// @ts-check
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

/**
 * Static site (default Astro output). For GitHub Pages “project” sites, set:
 *   SITE_URL=https://<org>.github.io
 *   BASE_PATH=/<repo>/
 * Example: SITE_URL=https://acme.github.io BASE_PATH=/pallette/ pnpm build
 * User/organization root sites (username.github.io) can keep BASE_PATH unset (defaults to /).
 */
const site = process.env.SITE_URL;
const base = process.env.BASE_PATH ?? '/';

// https://astro.build/config
export default defineConfig({
  ...(site ? { site } : {}),
  base,
  integrations: [
    starlight({
      title: 'Pallette',
      description:
        'Turn json-render component definitions into a live catalog—no Storybook required.',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com',
        },
      ],
      sidebar: [
        {
          label: 'Start here',
          items: [
            { label: 'Overview', link: '/' },
            { label: 'Introduction', slug: 'introduction' },
            { label: 'Getting started', slug: 'getting-started' },
            { label: 'Packages', slug: 'packages' },
            { label: 'Live demos', slug: 'demos' },
          ],
        },
      ],
    }),
  ],
});
