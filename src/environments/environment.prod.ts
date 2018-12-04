export const environment = {
  production: true,
  envName: 'PROD',
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
