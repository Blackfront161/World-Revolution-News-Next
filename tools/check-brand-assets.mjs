import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const defaultWorkspaceRoot = path.resolve(import.meta.dirname, '..');
const manifestVersion = 'wrn-brand-assets-v1';
const pinnedAssets = Object.freeze({
  'solinaridao-header-mark-filled.png': {
    id: 'solinaridao-header-mark-filled',
    bytes: 1197127,
    sha256: '60F839B54A573173D28387DBB2DC6199B2474FC4EF6450FF4EF933108C141081',
    sourceRepository: 'wrn-github-app-current',
    sourceCommit: '2216ff3c1305f6d474712892a36dc9b0ea7cb0a0',
    sourcePath: 'solinaridao-header-mark-filled.png',
    rightsStatus: 'owner-attested-po-017',
    role: 'master',
    allowedSurfaces: ['mobile-header', 'website-header'],
    editingStatus: 'unmodified-original',
  },
  'wrn-future-header-white.png': {
    id: 'wrn-future-header-white',
    bytes: 212123,
    sha256: '9DA0E22936304A30A55BA1483C2305C6AD6C3B1A057341AF2AB3B16FE98A5E2F',
    sourceRepository: 'wrn-github-app-current',
    sourceCommit: '2216ff3c1305f6d474712892a36dc9b0ea7cb0a0',
    sourcePath: 'wrn-future-header-white.png',
    rightsStatus: 'owner-attested-po-017',
    role: 'master',
    allowedSurfaces: ['website-header'],
    editingStatus: 'unmodified-original',
  },
  'app-background.webp': {
    id: 'wrn-editorial-background',
    bytes: 81416,
    sha256: 'CBA5EB9BBFB9E20D2DAD86EBC9295C5D48F04EE080087A42F7E6CA85ADEF1167',
    sourceRepository: 'wrn-github-app-current',
    sourceCommit: '2216ff3c1305f6d474712892a36dc9b0ea7cb0a0',
    sourcePath: 'app-background.webp',
    rightsStatus: 'owner-attested-po-017',
    role: 'master',
    allowedSurfaces: ['body-recovery'],
    editingStatus: 'unmodified-original',
  },
});
const allowedAssetFiles = new Set(Object.keys(pinnedAssets));
const allowedBinaryExtensions = new Set(['.png', '.webp']);

function listFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  });
}

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex').toUpperCase();
}

function assertManifestValue(failures, file, field, received, expected) {
  if (JSON.stringify(received) !== JSON.stringify(expected)) {
    failures.push(`Manifestwert ${field} fuer ${file} weicht vom gepinnten Wert ab.`);
  }
}

function findForbiddenSourceReferences(workspaceRoot) {
  const prohibitedName = ['Qo', 'od'].join('');
  const forbidden = new RegExp(
    `${prohibitedName}|r10e|https?:\\/\\/(?:fonts\\.|use\\.typekit\\.)`,
    'i',
  );
  const sourceDirectories = [
    path.join(workspaceRoot, 'packages', 'brand-tokens', 'src'),
    path.join(workspaceRoot, 'apps', 'mobile', 'src'),
    path.join(workspaceRoot, 'apps', 'website', 'src'),
  ];
  return sourceDirectories.flatMap((directory) =>
    listFiles(directory).flatMap((filePath) => {
      const source = readFileSync(filePath, 'utf8');
      return forbidden.test(source) ? [path.relative(workspaceRoot, filePath)] : [];
    }),
  );
}

function findEditorialHeaderBackgroundReferences(workspaceRoot) {
  const headerStylesheets = [
    ['apps/mobile/src/styles.css', '.mobile-header'],
    ['apps/website/src/styles.css', '.site-header'],
  ];
  const editorialReference = /app-background\.webp|--wrn-asset-editorial-background/;

  return headerStylesheets.flatMap(([relativePath, selector]) => {
    const sourcePath = path.join(workspaceRoot, ...relativePath.split('/'));
    if (!existsSync(sourcePath)) return [];

    const selectorPattern = selector.replace('.', '\\.');
    const rule = readFileSync(sourcePath, 'utf8').match(
      new RegExp(`${selectorPattern}\\s*\\{([\\s\\S]*?)\\}`, 'm'),
    );
    return rule !== null && editorialReference.test(rule[1]) ? [relativePath] : [];
  });
}

/**
 * Verifiziert Assetdateien gegen Code-konstante, freigegebene Fingerabdruecke.
 * Das JSON-Manifest ist ein pruefbarer Beleg, aber keine Vertrauensquelle.
 */
export function validateBrandAssets({ workspaceRoot = defaultWorkspaceRoot } = {}) {
  const root = path.resolve(workspaceRoot);
  const assetDirectory = path.join(root, 'packages', 'brand-tokens', 'assets');
  const manifestPath = path.join(assetDirectory, 'asset-manifest.json');
  const failures = [];

  if (!existsSync(manifestPath)) {
    throw new Error('Markenassetgrenze verletzt:\n- Assetmanifest fehlt.');
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (manifest.manifestVersion !== manifestVersion) {
    failures.push(`Assetmanifestversion ist nicht ${manifestVersion}.`);
  }
  if (!Array.isArray(manifest.assets) || manifest.assets.length !== allowedAssetFiles.size) {
    failures.push('Assetmanifest muss genau die drei freigegebenen Originale enthalten.');
  }

  const manifestByFile = new Map();
  for (const asset of manifest.assets ?? []) {
    if (!asset || typeof asset.file !== 'string') {
      failures.push('Assetmanifest enthaelt einen Eintrag ohne gueltigen Dateinamen.');
      continue;
    }
    if (manifestByFile.has(asset.file)) {
      failures.push(`Assetmanifest enthaelt einen doppelten Dateinamen: ${asset.file}`);
      continue;
    }
    manifestByFile.set(asset.file, asset);
    if (!allowedAssetFiles.has(asset.file)) {
      failures.push(`Nicht freigegebenes Asset im Manifest: ${asset.file}`);
    }
  }

  for (const [file, expected] of Object.entries(pinnedAssets)) {
    const manifestAsset = manifestByFile.get(file);
    if (!manifestAsset) {
      failures.push(`Freigegebenes Asset fehlt im Manifest: ${file}`);
      continue;
    }
    for (const [field, expectedValue] of Object.entries(expected)) {
      assertManifestValue(failures, file, field, manifestAsset[field], expectedValue);
    }

    const assetPath = path.join(assetDirectory, file);
    if (!existsSync(assetPath)) {
      failures.push(`Freigegebenes Asset fehlt: ${file}`);
      continue;
    }
    const actualBytes = statSync(assetPath).size;
    if (actualBytes !== expected.bytes) {
      failures.push(
        `Byteabweichung fuer ${file}: gepinnt ${expected.bytes}, erhalten ${actualBytes}.`,
      );
    }
    if (sha256(assetPath) !== expected.sha256) {
      failures.push(`SHA-256-Abweichung fuer ${file}.`);
    }
  }

  if (!existsSync(assetDirectory)) {
    failures.push('Assetverzeichnis fehlt.');
  } else {
    for (const entry of readdirSync(assetDirectory, { withFileTypes: true })) {
      if (entry.name === 'asset-manifest.json') {
        continue;
      }
      if (!entry.isFile()) {
        failures.push(`Nicht erlaubter Eintrag im Assetverzeichnis: ${entry.name}`);
        continue;
      }
      if (!allowedAssetFiles.has(entry.name)) {
        failures.push(`Nicht registrierte Datei im Assetverzeichnis: ${entry.name}`);
      }
      if (!allowedBinaryExtensions.has(path.extname(entry.name))) {
        failures.push(`Nicht erlaubter Binaertyp im Assetverzeichnis: ${entry.name}`);
      }
    }
  }

  const forbiddenReferences = findForbiddenSourceReferences(root);
  if (forbiddenReferences.length > 0) {
    failures.push(
      `Verbotene Font-, Asset- oder Remote-Referenz: ${forbiddenReferences.join(', ')}`,
    );
  }

  const editorialHeaderReferences = findEditorialHeaderBackgroundReferences(root);
  if (editorialHeaderReferences.length > 0) {
    failures.push(
      `Redaktionelles Hintergrundasset ist im Header verboten: ${editorialHeaderReferences.join(', ')}`,
    );
  }

  if (failures.length > 0) {
    throw new Error(`Markenassetgrenze verletzt:\n- ${failures.join('\n- ')}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  validateBrandAssets();
  process.stdout.write('Markenassets: bestanden\n');
}
