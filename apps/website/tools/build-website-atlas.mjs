import {buildWebsiteAtlasPackage} from './website-atlas-package.mjs';
const [snapshotRoot,outputRoot,...extra]=process.argv.slice(2);
if(!snapshotRoot || !outputRoot || extra.length) throw Error('Usage: node tools/build-website-atlas.mjs <admitted-r76-snapshot-directory> <new-output-directory>');
const manifest=await buildWebsiteAtlasPackage({snapshotRoot,outputRoot});
console.log(JSON.stringify({version:manifest.version,files:manifest.files.length,snapshotBytes:manifest.snapshotBytes,websiteShellIncluded:false,publicationPerformed:false}));
