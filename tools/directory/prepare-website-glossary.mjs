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
  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.expression.getText(tree) === 'TERMS' &&
      node.expression.name.text === 'push'
    ) {
      for (const argument of node.arguments) {
        if (ts.isObjectLiteralExpression(argument)) terms.push(literal(argument));
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
  const unique = [...new Map(terms.map((term) => [term.id, term])).values()];
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
