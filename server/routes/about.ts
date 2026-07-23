import { Hono } from 'hono';

import { Layout } from '../templates/layout';
import { AboutPage } from '../templates/about';

const about = new Hono();

about.get('/', (c) => {
  return c.html(
    Layout({
      title: 'About',
      description:
        'Learn more about ChessViewer — the free, open-source chess diagram generator.',
      children: String(AboutPage())
    })
  );
});

export default about;
