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

// Health check
app.get('/health', (c) => c.text('ok'));

const PORT = parseInt(process.env.SSR_PORT || '3001', 10);
console.log(`SSR server running on http://localhost:${PORT}`);

serve({ fetch: app.fetch, port: PORT });
