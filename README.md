# robbieavenaim.com

Rebuild of Robbie Avenaim's artist site — Astro (static), Sveltia CMS for editing, deployed to Cloudflare Pages from this repo.

## Structure

- `src/content/` — all editable content (bio, projects, discography, testimonials, grants) as Markdown/YAML, edited either by hand or through the CMS at `/admin/`.
- `src/content.config.ts` — content collection schemas.
- `src/pages/` — routes.
- `public/images/` — media, referenced by path from content files. New uploads through the CMS also land here.
- `public/admin/` — Sveltia CMS (git-based admin UI).

## Commands

| Command           | Action                                      |
| :----------------- | :------------------------------------------ |
| `npm install`       | Install dependencies                        |
| `npm run dev`       | Local dev server at `localhost:4321`        |
| `npm run build`     | Build production site to `./dist/`          |
| `npm run preview`   | Preview the production build locally        |

## Content editing

Most content lives in `src/content/` as plain Markdown/YAML — edit directly, or use the CMS at `/admin/` once GitHub OAuth is configured (see `public/admin/README.md`).

## Deployment

Pushing to `main` triggers a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds the site and
deploys it to Cloudflare Pages via Wrangler. The workflow is currently a no-op until it's turned on:

1. Add repo secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
2. Add a repo variable `DEPLOY_ENABLED` set to `true`.

Until then, deploy manually from the repo root with:

```sh
npm run build
npx wrangler pages deploy dist --project-name=robbieavenaim-com --branch=main
```
