/** @type {import('next').NextConfig} */

const path = require("path");
const config = require("../config");
const apiURL = config.API_URL;
const { hostname } = new URL(apiURL);

const nextConfig = {
  turbopack: {
    root: path.join(__dirname, ".."),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        port: "",
        pathname: "/**",
      },

      // Api http
      {
        protocol: "http",
        hostname,
        port: config.API_PORT ? config.API_PORT.toString() : "",
        pathname: "/**",
      },
      // Api https
      {
        protocol: "https",
        hostname,
        port: config.API_PORT ? config.API_PORT.toString() : "",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
