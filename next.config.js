const dns = require('dns');
if (typeof dns.setServers === 'function') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    console.log('[dns] Configured custom DNS servers: 8.8.8.8, 1.1.1.1');
  } catch (err) {
    console.error('[dns] Failed to set custom DNS servers', err);
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ]
  }
};

module.exports = nextConfig;
