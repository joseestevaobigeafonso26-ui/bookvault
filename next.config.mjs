export default {
  webpack: (config) => {
    config.resolve.alias.canvas = false; // exigido pelo pdfjs-dist no browser
    return config;
  },
};
