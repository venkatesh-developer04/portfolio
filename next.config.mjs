/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // three.js ships untranspiled ESM in some subpaths; keep it in the compile graph.
  transpilePackages: ['three'],
};

export default nextConfig;
