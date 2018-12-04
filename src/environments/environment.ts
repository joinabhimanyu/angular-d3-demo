// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `angular-cli.json`.

export const environment = {
  production: false,
  envName: 'DEV',
  authMatrix: {
    provider: { '': ['view'] },
    psr: { '': ['view'] },
    ma: { '': ['view'] },
    dc: { '': ['view'] },
    do: { '': ['view'] },
    np: { '': ['view'] }
  },
  appName: 'neuroSHARE',
  appAPIName: 'neuroshare',
  version: '0.1.0',
  trackEval: true,
  skipTokenValidation: true,
  autoSaveProgressNoteTimer: 60000,
  timeOut: 1800
};
