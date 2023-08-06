/**
 * @type {import('next').NextConfig}
 */

const baseConfig = {
  output: "export",
};

function generateConfig() {
  const prodConfig = {
    ...baseConfig,
    assetPrefix: ".",
  };

  const devConfig = {
    ...baseConfig,
  };

  return process.env.NODE_ENV === "production" ? prodConfig : devConfig;
}

const nextConfig = generateConfig();

module.exports = nextConfig;
