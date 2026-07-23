import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { trimTrailingSlash } from 'hono/trailing-slash';

import aboutRoute from './routes/about';

const app = new Hono();

app.use(trimTrailingSlash());

// Static files
app.use('/js/*', serveStatic({ root: './server/public' }));
app.use('/piece/*', serveStatic({ root: './public' }));

// Routes
app.route('/about', aboutRoute);

// Redirect root to /about
app.get('/', (c) => c.redirect('/about'));

// Health check
app.get('/health', (c) => c.text('ok'));

const PORT = parseInt(process.env.SSR_PORT || '3001', 10);
console.log(`\n  SSR server ready`);
console.log(`  ─────────────────────`);
console.log(`  http://localhost:${PORT}/about   AboutPage (SSR + Alpine)`);
console.log(`  http://localhost:${PORT}/health  Health check\n`);

serve({ fetch: app.fetch, port: PORT });
