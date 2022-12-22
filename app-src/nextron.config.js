module.exports = {
  mainSrcDir: "main",
  rendererSrcDir: "renderer",

  // main process' webpack config
  webpack: (config, env) => {
    return {
      ...config,
      experiments: {
        topLevelAwait: true,
      },
    };
  },
};
