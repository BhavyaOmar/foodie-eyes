import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false, // <--- Turn this OFF to save quota
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Needed for Google Auth profile pics later
      },
    ],
  },
};

export default nextConfig;
