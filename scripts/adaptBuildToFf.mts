import fs from 'fs/promises';

const BUILT_MANIFEST_PATH = './packages/extension/build/manifest.json';

fs.readFile(BUILT_MANIFEST_PATH, 'utf8').then(chromeContent => {
  const { background: { service_worker, ...background }, ...json } = JSON.parse(chromeContent)

  const ffJson = {
    ...json,
    background: {
      scripts: [service_worker],
      ...background,
    },
    browser_specific_settings: {
      gecko: {
        id: 'signer-webextension@alephzero.org',
        strict_min_version: '109.0'
      }
    }
  }

  const ffContent = JSON.stringify(ffJson, undefined, 2)

  return fs.writeFile(BUILT_MANIFEST_PATH, ffContent)
})
