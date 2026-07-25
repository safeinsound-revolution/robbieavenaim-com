# robbieavenaim.com

Rebuild of Robbie Avenaim's artist site — Astro (static), Sveltia CMS for editing, deployed to a Cloudflare Worker from this repo (see [Deployment](#deployment)).

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

Most content lives in `src/content/` as plain Markdown/YAML — edit directly, or use the CMS at `/admin/`.

Two things that aren't obvious:

- **Homepage project cards** are edited under **Projects**, not under the Homepage entry — the homepage grid
  ("Project Highlights") is generated from the Projects collection, ordered by each project's *Display Order*.
- **"Upcoming Events"** (Pages → Homepage) only appears on the site when the *Show "Upcoming Events" section*
  switch is on **and** at least one event has been added. Emptying the list hides the whole section — that's
  intended, not a bug. Dates are free text (e.g. `12–14 Sep 2026`), so past events don't disappear on their
  own; delete them when they're done.

## CMS setup

The admin UI at `/admin/` is [Sveltia CMS](https://github.com/sveltia/sveltia-cms) — it edits the files in
`src/content/` directly and commits them to GitHub (`safeinsound-revolution/robbieavenaim-com`), which
redeploys the site. Whoever edits needs **write access to that repo** (add them as a collaborator on GitHub).

There are two ways to sign in. Either works; they're not mutually exclusive.

### Option A — Personal access token (no setup)

Nothing to configure. At `/admin/`, choose to sign in with a GitHub **personal access token**: create a
fine-grained token (GitHub → Settings → Developer settings → Personal access tokens) scoped to the
`robbieavenaim-com` repo with **Contents: read & write**, and paste it in. Quickest for a one-off editor;
the downside is each editor manages their own token.

### Option B — One-click "Sign in with GitHub" (already wired)

`config.yml` points `base_url` at a shared [`sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth)
OAuth bridge — the **same Cloudflare Worker that Safe in Sound uses**, on Robbie's account
(`https://sveltia-cms-auth.robbie-avenaim.workers.dev`). Because it's shared, the GitHub OAuth app and the
worker's secrets **already exist** — there is no new OAuth app to create and no secrets to set for this site.
The one thing this site needs is to be on the worker's domain allowlist.

The worker's `ALLOWED_DOMAINS` lives in the repo that deploys it — Safe in Sound's
`workers/sveltia-cms-auth/wrangler.toml` — and robbieavenaim.com's domains have already been added there.
To make that live, redeploy the shared worker once:

```sh
cd ../safeinsound/workers/sveltia-cms-auth   # the repo that owns the shared worker
wrangler deploy                              # picks up the extended ALLOWED_DOMAINS
```

> Quick alternative: edit `ALLOWED_DOMAINS` in the Cloudflare dashboard (Workers → **sveltia-cms-auth** →
> Settings → Variables). Note that's temporary — the next `wrangler deploy` from the Safe in Sound repo
> resets it to whatever's in that repo's `wrangler.toml`, so keep the two in sync.

### Manual checklist (Option B)

1. **Deploy the extended allowlist** — `cd ../safeinsound/workers/sveltia-cms-auth && wrangler deploy`
   (already updated to include `robbieavenaim.com`, `www.robbieavenaim.com`, and the worker preview URL).
   Commit that change in the Safe in Sound repo too so it isn't lost.
2. **Confirm `base_url`** in `public/admin/config.yml` matches the worker URL
   (`https://sveltia-cms-auth.robbie-avenaim.workers.dev`), then commit/push this repo.
3. **Grant access** — add anyone who needs to edit as a collaborator (write) on
   `safeinsound-revolution/robbieavenaim-com`.
4. Visit `https://robbieavenaim.com/admin/` and click **Sign in with GitHub**.

There is **no** new GitHub OAuth app or worker secret to create — those are reused from the shared worker.
(If you ever want this site fully independent instead, stand up a separate worker under its own name with its
own OAuth app; the shared setup above is simpler and is what's in place.)

## Deployment

The site is a **Cloudflare Worker** (Static Assets) named `robbieavenaim-com`, connected to this GitHub repo.
**Every push to `main` auto-builds and deploys** (`npm run build` → `dist`, ~60–90s) — including content
commits made through the CMS. There's nothing to run by hand.

The `.github/workflows/deploy.yml` workflow is **dormant** — it's gated behind a `DEPLOY_ENABLED` repo
variable that is unset, so it's skipped on every push. The Cloudflare Worker git-integration is the real (and
only active) deploy path; don't be misled by GitHub Actions showing "skipped".
