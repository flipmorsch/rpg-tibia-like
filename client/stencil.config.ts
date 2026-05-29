import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'tibado-ui',
  srcDir: 'src/ui',
  tsconfig: 'tsconfig.stencil.json',
  outputTargets: [
    {
      type: 'dist',
      dir: 'ui-dist',
    },
    {
      type: 'dist-hydrate-script',
      dir: 'ui-dist/hydrate',
    },
  ],
};
