/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // Nanti domain AWS S3 bisa ditambahin di bawah ini
    ],
  },
};

export default nextConfig;
