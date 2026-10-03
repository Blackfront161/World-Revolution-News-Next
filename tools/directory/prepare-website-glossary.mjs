import ts from 'typescript';
import { createHash } from 'node:crypto';
import { readLiteralDeclaration, createKnowledgeDocument } from '../import-legacy-knowledge.mjs';
import { validateMobileKnowledge } from '../../packages/content-contracts/src/mobile-knowledge-v1.ts';

/** Extract data literals only: never execute the app's glossary script. */
export function prepareWebsiteGlossary(source, commit, observedAt) {
  if (!/^[a-f0-9]{40}$/.test(commit)) throw Error('glossary-commit');
  const terms = readLiteralDeclaration(source, 'TERMS');
  const sources = readLiteralDeclaration(source, 'SOURCES');
  const tree = ts.createSourceFile(
    'lexicon-tab.js',
    source,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.JS,
  );
  const literal = (node) => readLiteralDeclaration(`const value = ${node.getText(tree)};`, 'value');
  // Interpret only the closed data-expression subset used by editorial expansions.
  // No App code, arbitrary calls, property getters or callback bodies execute.
  function data(node, environment = Object.create(null), depth = 0) {
    if (depth > 32) throw Error('glossary-expression-depth');
    const next = (value, env = environment) => data(value, env, depth + 1);
    if (ts.isParenthesizedExpression(node)) return next(node.expression);
    if (ts.isIdentifier(node) && Object.hasOwn(environment, node.text))
      return environment[node.text];
    if (ts.isArrayLiteralExpression(node)) {
      if (node.elements.length > 1000) throw Error('glossary-expression-count');
      return node.elements.map((value) => {
        if (ts.isSpreadElement(value)) throw Error('glossary-array-spread');
        return next(value);
      });
    }
    if (ts.isObjectLiteralExpression(node)) {
      const result = Object.create(null);
      for (const property of node.properties) {
        if (ts.isSpreadAssignment(property)) {
          const value = next(property.expression);
          if (!value || typeof value !== 'object' || Array.isArray(value))
            throw Error('glossary-object-spread');
          Object.assign(result, value);
          continue;
        }
        const key =
          property.name && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
            ? property.name.text
            : null;
        if (!key || ['__proto__', 'prototype', 'constructor'].includes(key))
          throw Error('glossary-object-key');
        if (ts.isPropertyAssignment(property)) result[key] = next(property.initializer);
        else if (ts.isShorthandPropertyAssignment(property)) result[key] = next(property.name);
        else throw Error('glossary-object-property');
      }
      return result;
    }
    if (ts.isConditionalExpression(node))
      return next(node.condition) === true ? next(node.whenTrue) : next(node.whenFalse);
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken
    )
      return next(node.left) === next(node.right);
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'map' &&
      node.arguments.length === 1 &&
      ts.isArrowFunction(node.arguments[0])
    ) {
      const values = next(node.expression.expression),
        callback = node.arguments[0];
      if (
        !Array.isArray(values) ||
        values.length > 1000 ||
        callback.parameters.length !== 1 ||
        ts.isBlock(callback.body)
      )
        throw Error('glossary-data-map');
      const binding = callback.parameters[0].name;
      return values.map((value) => {
        const env = Object.assign(Object.create(null), environment);
        if (ts.isIdentifier(binding)) env[binding.text] = value;
        else if (
          ts.isArrayBindingPattern(binding) &&
          Array.isArray(value) &&
          binding.elements.length === value.length
        ) {
          binding.elements.forEach((element, index) => {
            if (
              !ts.isBindingElement(element) ||
              !ts.isIdentifier(element.name) ||
              element.initializer ||
              element.dotDotDotToken
            )
              throw Error('glossary-map-binding');
            env[element.name.text] = value[index];
          });
        } else throw Error('glossary-map-binding');
        return next(callback.body, env);
      });
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.getText(tree) === 'extraTerm' &&
      node.arguments.length >= 12 &&
      node.arguments.length <= 13
    ) {
      const [
        id,
        category,
        references,
        deTitle,
        enTitle,
        deSummary,
        enSummary,
        dePractice,
        enPractice,
        deDebate,
        enDebate,
        related,
        aliases = { de: [], en: [] },
      ] = node.arguments.map((value) => next(value));
      return {
        id,
        category,
        sources: references,
        title: { de: deTitle, en: enTitle },
        summary: { de: deSummary, en: enSummary },
        practice: { de: dePractice, en: enPractice },
        debate: { de: deDebate, en: enDebate },
        related,
        aliases: { de: aliases.de ?? [], en: aliases.en ?? [] },
      };
    }
    return literal(node);
  }
  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ['TERMS', 'SOURCES'].includes(node.expression.expression.getText(tree)) &&
      node.expression.name.text === 'push'
    ) {
      for (const argument of node.arguments) {
        if (ts.isSpreadElement(argument)) {
          const values = data(argument.expression);
          if (!Array.isArray(values) || values.length > 1000)
            throw Error('glossary-expansion-count');
          (node.expression.expression.getText(tree) === 'TERMS' ? terms : sources).push(...values);
        } else if (ts.isObjectLiteralExpression(argument))
          (node.expression.expression.getText(tree) === 'TERMS' ? terms : sources).push(
            literal(argument),
          );
        else if (
          ts.isCallExpression(argument) &&
          argument.expression.getText(tree) === 'extraTerm' &&
          argument.arguments.length >= 12 &&
          argument.arguments.length <= 13
        ) {
          const [
            id,
            category,
            references,
            deTitle,
            enTitle,
            deSummary,
            enSummary,
            dePractice,
            enPractice,
            deDebate,
            enDebate,
            related,
            aliases = { de: [], en: [] },
          ] = argument.arguments.map(literal);
          terms.push({
            id,
            category,
            sources: references,
            title: { de: deTitle, en: enTitle },
            summary: { de: deSummary, en: enSummary },
            practice: { de: dePractice, en: enPractice },
            debate: { de: deDebate, en: enDebate },
            related,
            aliases: { de: aliases.de ?? [], en: aliases.en ?? [] },
          });
        } else throw Error('glossary-nonliteral-expansion');
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  // The App explicitly replaces older drafts by stable public term ID.
  const unique = [...new Map(terms.map((term) => [term.id, term])).values()].map((term) => ({
    ...term,
    aliases: { de: term.aliases?.de ?? [], en: term.aliases?.en ?? [] },
  }));
  const document = createKnowledgeDocument({
    libraryFeed: '[]',
    librarySources: '[]',
    lexiconSource: `const TERMS = ${JSON.stringify(unique)}; const SOURCES = ${JSON.stringify(sources)};`,
    observedAt,
  });
  document.sourceCommit = commit;
  document.input.lexiconSha256 = createHash('sha256').update(source).digest('hex');
  document.input.lexiconBytes = Buffer.byteLength(source);
  const validation = validateMobileKnowledge(document);
  if (!validation.ok) throw Error('glossary-invalid: ' + validation.errors.join(','));
  return document;
}
