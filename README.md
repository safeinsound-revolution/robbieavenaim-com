# robbieavenaim.com

Rebuild of Robbie Avenaim's artist site — Astro (static), Sveltia CMS for editing, deployed to a Cloudflare Worker from this repo (see [Deployment](#deployment)).

## Structure

- `src/content/` — all editable content (bio, projects, discography, testimonials, grants) as Markdown/YAML, edited either by hand or through the CMS at `/admin/`.
- `src/content.config.ts` — content collection schemas. The `order` frontmatter field on Projects,
  Discography and Testimonials is written by the CMS's drag-and-drop reordering (`reorder: true` in
  `public/admin/config.yml`) — it isn't an editable field in the admin UI. It's optional in the schema, and
  an entry without one sorts last, so a hand-added file won't break the build. Grants have no `order` at all.
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

A few things that aren't obvious:

- **Ordering is drag-and-drop** for Projects, Discography and Testimonials — they display in the order they
  appear in the CMS list. Open the collection, click **Reorder**, drag items (or use the up/down arrows), then
  click **Done** — the CMS renumbers every affected entry itself and saves them in one commit. There is no
  order number to type: new entries are added to the **bottom** of the list, so add first, then drag into place.
- **Grants & Awards orders itself.** There's no ordering to maintain: each entry lands in the page section
  named by its *Group* field, and each section lists newest year first. Multi-year entries ("2002, 2003, 2005")
  sort on the first year shown. Filenames are generated as `<group>-<year>-<description>`, but nothing reads
  them — the *Group* field alone decides which section an entry appears in.
- **Homepage project cards** are edited under **Projects**, not under the Homepage entry — the homepage grid
  ("Project Highlights") is generated from the Projects collection, in the same order as the Projects list.
- **"Upcoming Events"** (Pages → Homepage) only appears on the site when the *Show "Upcoming Events" section*
  switch is on **and** at least one event has been added. Emptying the list hides the whole section — that's
  intended, not a bug. Dates are free text (e.g. `12–14 Sep 2026`), so past events don't disappear on their
  own; delete them when they're done.

## Publishing CMS edits

**Saving in the CMS no longer rebuilds the site.** It used to: Sveltia commits on every Save, Cloudflare
builds every commit, and it builds them one at a time — so editing eight entries in a row queued eight full
builds, each waiting on the last. With `skip_ci: true` under `backend:` in `public/admin/config.yml`, Sveltia
marks each commit so Cloudflare skips the build for it.

Publishing is now a deliberate step. Either way works:

- **Save and Publish** — the little arrow beside the **Save** button in an entry. Use it on the last edit of a
  batch.
- **Publish Changes** — the button in the CMS header. Ships everything saved but unpublished so far.

Deletions are the exception: Sveltia always builds those, so deleting an entry updates the site by itself.

**The failure mode to expect:** *"I edited it and saved, but the site didn't change."* That almost always
means saved-but-unpublished commits are sitting in the repo. Click **Publish Changes** in the CMS. From a
terminal you can see them with `git log origin/main --oneline -10` (the CMS's own commits are titled
`Update <Collection> "<slug>"`), and any ordinary push — even an unrelated one — will ship everything queued
behind it.

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
**A normal push to `main` auto-builds and deploys** (`npm run build` → `dist`, ~60–90s). There's nothing to
run by hand.

The exception is commits made by the CMS, which are marked to skip the build — see
[Publishing CMS edits](#publishing-cms-edits) below.

The `.github/workflows/deploy.yml` workflow is **dormant** — it's gated behind a `DEPLOY_ENABLED` repo
variable that is unset, so it's skipped on every push. The Cloudflare Worker git-integration is the real (and
only active) deploy path; don't be misled by GitHub Actions showing "skipped".
