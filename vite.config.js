import { defineConfig, loadEnv } from 'vite';
import { createHandler } from './api/tour.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const handler = createHandler({ getKey: () => env.TOUR_API_KEY || process.env.TOUR_API_KEY });
  const proxy = (server) => {
    server.middlewares.use('/api/tour', (req, res) => handler(req, res));
  };
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

  return {
    plugins: [
      { name: 'tour-server', configureServer: proxy, configurePreviewServer: proxy },
      {
        name: 'saera-social-image-url',
        transformIndexHtml(html) {
          if (!productionHost || !/^[a-z\d.-]+$/i.test(productionHost)) return html;
          const siteUrl = `https://${productionHost}`;
          return html
            .replaceAll('content="/ogimg.jpg"', `content="${siteUrl}/ogimg.jpg"`)
            .replace('</head>', `  <meta property="og:url" content="${siteUrl}/" />\n  </head>`);
        },
      },
    ],
  };
});
