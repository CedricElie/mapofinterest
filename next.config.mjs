/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow mobile devices on the network to access the dev server
  allowedDevOrigins: ['192.168.1.127', '192.168.1.127:3000'],
  experimental: {
    allowedDevOrigins: ['192.168.1.127', '192.168.1.127:3000'],
  },
};

export default nextConfig;
