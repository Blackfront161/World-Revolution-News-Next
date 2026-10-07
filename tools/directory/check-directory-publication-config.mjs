import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
export const PUBLICATION_SWITCH='WRN_DIRECTORY_PUBLISH_ENABLED';
export const REQUIRED_SECRET_NAMES=Object.freeze(['WRN_FTPS_HOST','WRN_FTPS_IP','WRN_FTPS_USER','WRN_FTPS_PASSWORD','WRN_FTPS_DIRECTORY']);
// Diagnostics contain configuration names only. Never serialize the input env.
export function checkDirectoryPublicationConfig(env,{explicitPublish=false}={}){
  const enabled=env[PUBLICATION_SWITCH]==='1';
  if(!enabled){
    if(explicitPublish)throw Error('publication-switch-required: '+PUBLICATION_SWITCH);
    return {state:'publication-disabled',publicationPerformed:false,requiredVariable:PUBLICATION_SWITCH,requiredSecretNames:REQUIRED_SECRET_NAMES};
  }
  const missing=REQUIRED_SECRET_NAMES.filter(name=>typeof env[name]!=='string'||!env[name].trim());
  if(missing.length)throw Error('publication-config-missing: '+missing.join(', '));
  return {state:'publication-config-present',publicationPerformed:false,requiredVariable:PUBLICATION_SWITCH,requiredSecretNames:REQUIRED_SECRET_NAMES};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{process.stdout.write(JSON.stringify(checkDirectoryPublicationConfig(process.env,{explicitPublish:process.argv.includes('--explicit-publish')}))+'\n');}
  catch(error){process.stderr.write(error.message+'\n');process.exitCode=1;}
}
