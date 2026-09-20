import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const specifierPattern = /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\()(["'])([^"']+)\1/g;
const fileImportPattern = /\bimport\s*(["'])([^"']+)\1/g;
const requiredPackage = '@wrn/test-support';
const expectedSpecifier = 'workspace:*';
const apps = [
  {
    name: 'mobile',
    packagePath: 'apps/mobile/package.json',
    appFile: 'apps/mobile/src/App.tsx',
  },
  {
    name: 'website',
    packagePath: 'apps/website/package.json',
    appFile: 'apps/website/src/App.tsx',
  },
];

function extractSpecifiers(source) {
  const specifiers = [];
  for (const matcher of [specifierPattern, fileImportPattern]) {
    let match;
    while ((match = matcher.exec(source)) !== null) {
      specifiers.push(match[2]);
    }
    matcher.lastIndex = 0;
  }
  return specifiers;
}

function readJsonFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

function listSourceFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return entry.name === 'node_modules' ? [] : listSourceFiles(entryPath);
    }

    return entry.isFile() && /\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name) ? [entryPath] : [];
  });
}

function isTestSupportSpecifier(specifier) {
  const normalized = specifier.replaceAll('\\', '/');
  return (
    normalized === requiredPackage ||
    normalized.startsWith(`${requiredPackage}/`) ||
    normalized.includes('/packages/test-support/') ||
    normalized.startsWith('packages/test-support/')
  );
}

function findTestSupportImports(directory) {
  return listSourceFiles(directory).filter(
    (sourceFile) =>
      !/\.test\.[cm]?[jt]sx?$/.test(sourceFile) &&
      extractSpecifiers(readFileSync(sourceFile, 'utf8')).some(isTestSupportSpecifier),
  );
}

function listArtifactFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listArtifactFiles(entryPath);
    return entry.isFile() ? [entryPath] : [];
  });
}

export function checkLocalPreviewBoundaries(workspaceRoot, { release = false } = {}) {
  const root = path.resolve(workspaceRoot);
  const violations = [];
  const allowedImportFiles = apps.reduce(
    (state, app) => ({
      ...state,
      [app.name]: path.resolve(root, app.appFile),
    }),
    {},
  );

  for (const app of apps) {
    const packageJsonPath = path.join(root, app.packagePath);
    const packageJson = readJsonFile(packageJsonPath);
    const dependencies = {
      ...(packageJson.dependencies ?? {}),
      ...(packageJson.devDependencies ?? {}),
    };
    const version = dependencies[requiredPackage];
    const appSourceRoot = path.join(root, 'apps', app.name, 'src');
    const appSources = listSourceFiles(appSourceRoot);
    const importingFiles = [];

    for (const sourceFile of appSources) {
      for (const specifier of extractSpecifiers(readFileSync(sourceFile, 'utf8'))) {
        if (isTestSupportSpecifier(specifier)) {
          importingFiles.push(sourceFile);
          break;
        }
      }
    }

    if (release) {
      if (version !== undefined) {
        violations.push({
          file: app.packagePath,
          kind: 'dependency',
          message: `${app.name}: Dependency ${requiredPackage} darf im Release nicht vorhanden sein. Gefunden: ${version}`,
        });
      }

      if (importingFiles.length > 0) {
        violations.push({
          file: `${app.name} App`,
          kind: 'runtime-import',
          message: `${app.name}: Runtimeimport ${requiredPackage} ist im Release-Modus nicht erlaubt.`,
        });
      }
    } else {
      if (version !== expectedSpecifier) {
        violations.push({
          file: app.packagePath,
          kind: 'dependency',
          message: `${app.name}: Dependency ${requiredPackage} muss genau "${expectedSpecifier}" sein. Gefunden: ${version ?? 'undefined'}`,
        });
      }

      if (importingFiles.length === 0) {
        violations.push({
          file: app.appFile,
          kind: 'runtime-import',
          message: `${app.name}: ${requiredPackage} muss im Preview in ${app.appFile} importiert sein.`,
        });
        continue;
      }

      for (const importingFile of importingFiles) {
        if (path.resolve(importingFile) !== path.resolve(allowedImportFiles[app.name])) {
          violations.push({
            file: path.relative(root, importingFile).replaceAll('\\', '/'),
            kind: 'runtime-import',
            message: `${app.name}: ${requiredPackage} darf im Preview nur in ${app.appFile} importiert werden.`,
          });
        }
      }
    }
  }

  if (release) {
    const releaseSourceRoots = [
      ['mobile Runtime', 'apps/mobile/src'],
      ['website Runtime', 'apps/website/src'],
      ['website Publisher', 'apps/website/tools'],
      ['normale Werkzeuge', 'tools'],
    ];
    for (const [label, relativeRoot] of releaseSourceRoots) {
      for (const sourceFile of findTestSupportImports(path.join(root, relativeRoot))) {
        violations.push({
          file: path.relative(root, sourceFile).replaceAll('\\', '/'),
          kind: 'release-import',
          message: `${label}: Test-Support-Import ist im Releasepfad nicht erlaubt.`,
        });
      }
    }

    for (const relativeRoot of ['apps/mobile/dist', 'apps/website/dist']) {
      for (const artifactFile of listArtifactFiles(path.join(root, relativeRoot))) {
        const contents = readFileSync(artifactFile, 'utf8');
        if (contents.includes(requiredPackage) || contents.includes('packages/test-support/')) {
          violations.push({
            file: path.relative(root, artifactFile).replaceAll('\\', '/'),
            kind: 'artifact-reference',
            message: 'Finales Artefakt darf keine Test-Support-Referenz enthalten.',
          });
        }
      }
    }
  }

  return violations.length === 0 ? { ok: true, violations: [] } : { ok: false, violations };
}

export function assertLocalPreviewBoundaries(workspaceRoot, { release = false } = {}) {
  const { ok, violations } = checkLocalPreviewBoundaries(workspaceRoot, { release });
  if (ok) {
    return;
  }

  const rendered = violations.map(({ file, message }) => `- ${file}: ${message}`).join('\n');
  const mode = release ? 'Release' : 'Preview';
  throw new Error(`${mode}-Boundary verletzt:\n${rendered}`);
}

const currentPath = process.argv[1] ? path.resolve(process.argv[1]) : undefined;
const thisFile = fileURLToPath(import.meta.url);

if (currentPath === thisFile) {
  const args = process.argv.slice(2);
  const release = args.includes('--release');
  const workspaceRoot = args.find((arg) => !arg.startsWith('--'))
    ? path.resolve(args.find((arg) => !arg.startsWith('--')))
    : path.resolve(path.dirname(thisFile), '..');
  assertLocalPreviewBoundaries(workspaceRoot, { release });
  process.stdout.write(
    `@wrn/test-support ${release ? 'Release' : 'Preview'}-Boundary: bestanden\n`,
  );
}
