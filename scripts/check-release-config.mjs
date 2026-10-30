import { registryUrl } from './publish-artifactory.mjs';

try {
  const required = ['SONAR_HOST_URL', 'SONAR_PROJECT_KEY', 'SONAR_TOKEN', 'BLACKDUCK_URL', 'BLACKDUCK_TOKEN', 'ARTIFACTORY_NPM_REGISTRY', 'ARTIFACTORY_TOKEN'];
  const missing = required.filter(name => !process.env[name]?.trim());
  if (missing.length) throw new Error(`Missing release variables/secrets: ${missing.join(', ')}`);
  for (const name of ['SONAR_HOST_URL', 'BLACKDUCK_URL']) {
    const url = new URL(process.env[name]);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error(`${name} must be an HTTPS URL without embedded credentials/query parameters.`);
  }
  for (const name of ['SONAR_PROJECT_KEY', 'SONAR_ORGANIZATION']) {
    if (process.env[name] && !/^[a-zA-Z0-9_.:-]+$/.test(process.env[name])) throw new Error(`${name} contains unsupported characters.`);
  }
  const severities = (process.env.BLACKDUCK_FAILURE_SEVERITIES || 'BLOCKER,CRITICAL').split(',');
  if (severities.some(value => !['ALL', 'BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'OK', 'TRIVIAL', 'UNSPECIFIED'].includes(value))) {
    throw new Error('BLACKDUCK_FAILURE_SEVERITIES must be a comma-separated Black Duck policy severity list; NONE is not allowed for release gating.');
  }
  registryUrl(process.env.ARTIFACTORY_NPM_REGISTRY);
  console.log('Release configuration validated. Secret values are not logged.');
} catch (error) { console.error(error.message); process.exitCode = 1; }
