export function createProductionCodeSplitting() {
  return {
    groups: [
      {
        name: 'react-vendor',
        test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/,
        priority: 40,
      },
      {
        name: 'wrn-language',
        test: /packages[\\/]ui-language[\\/]/,
        priority: 30,
      },
      {
        name: 'wrn-content-core',
        test: /packages[\\/](?:content-contracts|domain)[\\/]/,
        priority: 20,
      },
      {
        name: 'wrn-browser-runtime',
        test: /packages[\\/]browser-content[\\/]/,
        priority: 10,
      },
    ],
  };
}
