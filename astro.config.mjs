import { defineConfig } from 'astro/config';

// TODO before launch: set `site` to the real production URL (used for canonical + Open Graph URLs).
export default defineConfig({
  site: 'https://example.com',
  server: { port: 4321 },
  devToolbar: { enabled: false },
  // Menu photos come from the Google Sheet as public https URLs (Drive, Imgur, etc.)
  // and are downloaded and optimised at build time.
  image: {
    remotePatterns: [{ protocol: 'https' }],
  },
});
