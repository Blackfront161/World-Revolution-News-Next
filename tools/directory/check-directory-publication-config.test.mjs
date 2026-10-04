import {test} from 'node:test';import assert from 'node:assert/strict';
import {checkDirectoryPublicationConfig,REQUIRED_SECRET_NAMES,PUBLICATION_SWITCH} from './check-directory-publication-config.mjs';
test('disabled schedule reports names without claiming a publication',()=>{
  const report=checkDirectoryPublicationConfig({});assert.equal(report.state,'publication-disabled');assert.equal(report.publicationPerformed,false);assert.equal(report.requiredVariable,PUBLICATION_SWITCH);
  assert.throws(()=>checkDirectoryPublicationConfig({},{explicitPublish:true}),/publication-switch-required/);
});
test('enabled delivery requires every existing scoped secret and prints only names',()=>{
  const env={[PUBLICATION_SWITCH]:'1',...Object.fromEntries(REQUIRED_SECRET_NAMES.map(name=>[name,'private-value-that-must-not-be-logged']))};
  const report=checkDirectoryPublicationConfig(env,{explicitPublish:true});assert.equal(report.state,'publication-config-present');assert.equal(JSON.stringify(report).includes('private-value'),false);
  for(const name of REQUIRED_SECRET_NAMES){const partial={...env,[name]:' '};assert.throws(()=>checkDirectoryPublicationConfig(partial),e=>e.message.includes(name)&&!e.message.includes('private-value'));}
});
