import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const sourceExtensions = new Set(['.cts', '.js', '.jsx', '.mts', '.mjs', '.ts', '.tsx']);
const ignoredDirectories = new Set(['.git', 'coverage', 'dist', 'node_modules']);
const purePackages = new Set(['domain', 'api-contracts', 'content-contracts']);

function normalizedPath(value) {
  return path.resolve(value).toLowerCase();
}

function isWithin(candidate, container) {
  const relative = path.relative(normalizedPath(container), normalizedPath(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function listSourceFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return ignoredDirectories.has(entry.name) ? [] : listSourceFiles(entryPath);
    }

    return entry.isFile() && sourceExtensions.has(path.extname(entry.name)) ? [entryPath] : [];
  });
}

function extractSpecifiers(source) {
  const specifiers = [];
  const matchers = [
    /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\()(["'])([^"']+)\1/g,
    /\bimport\s*(["'])([^"']+)\1/g,
  ];

  for (const matcher of matchers) {
    let match;
    while ((match = matcher.exec(source)) !== null) {
      specifiers.push(match[2]);
    }
  }

  return specifiers;
}

function workspaceOwner(filePath, workspaceRoot) {
  const relative = path.relative(workspaceRoot, filePath).replaceAll('\\', '/');
  const match = /^(apps|packages|services)\/([^/]+)(?:\/|$)/.exec(relative);
  return match ? { kind: match[1], name: match[2] } : undefined;
}

function appNameFromSpecifier(specifier) {
  const match = /^(?:@wrn\/|apps\/)?(mobile|website)(?:\/|$)/.exec(specifier);
  return match?.[1];
}

function resolvePathLikeSpecifier(specifier, fromFile) {
  if (specifier.startsWith('file:')) {
    try {
      return fileURLToPath(specifier);
    } catch {
      return undefined;
    }
  }

  if (
    specifier.startsWith('.') ||
    specifier.startsWith('/') ||
    path.isAbsolute(specifier) ||
    path.win32.isAbsolute(specifier)
  ) {
    return path.isAbsolute(specifier) || path.win32.isAbsolute(specifier)
      ? specifier
      : path.resolve(path.dirname(fromFile), specifier);
  }

  return undefined;
}

function isForbiddenPlatformOrProvider(specifier) {
  return (
    specifier === 'react' ||
    specifier.startsWith('react-dom') ||
    specifier === 'capacitor' ||
    specifier.startsWith('@capacitor/') ||
    /^(?:@azure\/|@cloudflare\/|@google-cloud\/|@huggingface\/|@supabase\/|firebase(?:\/|$)|openai(?:\/|$))/.test(
      specifier,
    )
  );
}

/**
 * Prueft statisch, ob der Workspace die G3-Foundationgrenzen einhaelt. Die
 * Pruefung liest nur Quelltexte und veraendert keine Produktdateien.
 */
export function findBoundaryViolations(workspaceRoot) {
  const root = path.resolve(workspaceRoot);
  const sourceFiles = [
    ...listSourceFiles(path.join(root, 'apps')),
    ...listSourceFiles(path.join(root, 'packages')),
    ...listSourceFiles(path.join(root, 'services')),
  ];
  const violations = [];

  for (const filePath of sourceFiles) {
    const owner = workspaceOwner(filePath, root);
    if (!owner) {
      continue;
    }

    for (const specifier of extractSpecifiers(readFileSync(filePath, 'utf8'))) {
      const importedAppName = appNameFromSpecifier(specifier);
      const resolvedPath = resolvePathLikeSpecifier(specifier, filePath);
      const resolvedOwner =
        resolvedPath && isWithin(resolvedPath, root)
          ? workspaceOwner(resolvedPath, root)
          : undefined;

      if (owner.kind === 'apps' && importedAppName && importedAppName !== owner.name) {
        violations.push({ filePath, specifier, rule: 'Apps duerfen einander nicht importieren.' });
      }

      if (owner.kind === 'packages' && importedAppName) {
        violations.push({ filePath, specifier, rule: 'Pakete duerfen keine Apps importieren.' });
      }

      if (owner.kind === 'services' && importedAppName) {
        violations.push({ filePath, specifier, rule: 'Services duerfen keine Apps importieren.' });
      }

      if (
        owner.kind === 'services' &&
        /^(?:@wrn\/(?:browser-content|test-support)|(?:apps|packages)\/(?:browser-content|test-support))/.test(
          specifier,
        )
      ) {
        violations.push({
          filePath,
          specifier,
          rule: 'Services duerfen weder Client-UI noch Fixtures oder Test-Support importieren.',
        });
      }

      if (
        owner.kind === 'apps' &&
        resolvedOwner?.kind === 'apps' &&
        resolvedOwner.name !== owner.name
      ) {
        violations.push({
          filePath,
          specifier,
          rule: 'Apps duerfen einander nicht ueber Pfade importieren.',
        });
      }

      if (owner.kind === 'packages' && resolvedOwner?.kind === 'apps') {
        violations.push({
          filePath,
          specifier,
          rule: 'Pakete duerfen Apps nicht ueber Pfade importieren.',
        });
      }

      if (owner.kind === 'services' && resolvedOwner?.kind === 'apps') {
        violations.push({
          filePath,
          specifier,
          rule: 'Services duerfen Apps nicht ueber Pfade importieren.',
        });
      }

      if (
        owner.kind === 'services' &&
        resolvedOwner?.kind === 'packages' &&
        (resolvedOwner.name === 'test-support' || resolvedOwner.name === 'browser-content')
      ) {
        violations.push({
          filePath,
          specifier,
          rule: 'Services duerfen Client-UI, Fixtures oder Test-Support nicht ueber Pfade importieren.',
        });
      }

      if (
        owner.kind === 'packages' &&
        resolvedOwner?.kind === 'packages' &&
        resolvedOwner.name !== owner.name
      ) {
        violations.push({
          filePath,
          specifier,
          rule: 'Paketgrenzen duerfen nicht mit absoluten oder relativen Quellpfaden umgangen werden.',
        });
      }

      if (purePackages.has(owner.name) && isForbiddenPlatformOrProvider(specifier)) {
        violations.push({
          filePath,
          specifier,
          rule: 'Domain-, API- und Content-Contracts muessen React-, DOM-, Capacitor- und Provider-unabhaengig bleiben.',
        });
      }
    }
  }

  return violations;
}

export function assertWorkspaceBoundaries(workspaceRoot) {
  const violations = findBoundaryViolations(workspaceRoot);
  if (violations.length === 0) {
    return;
  }

  const rendered = violations
    .map(
      ({ filePath, specifier, rule }) =>
        `- ${path.relative(workspaceRoot, filePath)} -> ${specifier}: ${rule}`,
    )
    .join('\n');
  throw new Error(`Importgrenzen verletzt:\n${rendered}`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : undefined;
const thisFile = fileURLToPath(import.meta.url);

if (invokedPath === thisFile) {
  const workspaceRoot = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(path.dirname(thisFile), '..');
  assertWorkspaceBoundaries(workspaceRoot);
  process.stdout.write('Importgrenzen: bestanden\n');
}
