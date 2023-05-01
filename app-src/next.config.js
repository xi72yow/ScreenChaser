/**
 * @type {import('next').NextConfig}
 */

function generateConfig() {
  const prodConfig = {
    output: "export",
    assetPrefix: ".",
  };

  const devConfig = {
    output: "export",
  };

  return process.env.NODE_ENV === "production" ? prodConfig : devConfig;
}

const nextConfig = generateConfig();

module.exports = nextConfig;
