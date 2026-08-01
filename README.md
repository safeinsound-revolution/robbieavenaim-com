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
  own; delete them when they're done. **Details preserves line breaks** as typed (the field is rendered
  `whitespace-pre-line`), so an event can be laid out like a poster. **Link Label** is the wording on the
  button and falls back to "More info" when left blank — it is not the URL; that goes in **Link URL**.

## Publishing CMS edits

**Saving in the CMS publishes.** There is no separate publish step: Save, wait ~60–90s for the Cloudflare
build, and the change is live. Editing several entries in a row queues one build each and they run one at a
time, so a long session takes a while to fully drain — the site catches up on its own.

It briefly worked the other way. `skip_ci: true` under `backend:` made Sveltia mark each commit so Cloudflare
skipped the build, turning publishing into a deliberate step. That was removed on 1 Aug 2026 after it cost
Robbie an evening's work: he added a Now or Never event four times over fifteen minutes, saw nothing appear,
and switched the section off assuming it was broken. Nothing was broken — every save had committed fine and
none of them had deployed.

Do not re-add the flag without also fixing what made it unusable:

- **The header "Publish Changes" button does nothing here.** Sveltia's GitHub backend publishes by POSTing a
  `repository_dispatch` (`event_type: sveltia-cms-publish`). Nothing in this repo listens for it — `deploy.yml`
  is triggered by `push`/`workflow_dispatch` and is dormant anyway — and Cloudflare Workers builds on push
  only. The click reports success and deploys nothing. Only **Save and Publish** (the arrow beside **Save**)
  ever worked, because it commits without the marker, which is a real push.
- **That button is hidden most of the time.** Sveltia shows it only when the *single most recent* commit starts
  with the skip marker (`isLastCommitPublished` in the bundle). Any dev push, or any delete, hid it while a
  stack of unpublished saves sat behind it.
- **Deletions always deployed** — Sveltia omits the marker for those — so some changes went live immediately
  and others never did, with nothing on screen to explain the difference.

If build queuing becomes a real problem, add a workflow listening for that dispatch event (pushing an empty
commit is enough to trigger Cloudflare) and re-add the flag *then*.

To check what's deployed from a terminal: `git log origin/main --oneline -10`. CMS commits are titled
`Update <Collection> "<slug>"`.

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

CMS saves are ordinary commits and build like any other — see
[Publishing CMS edits](#publishing-cms-edits). (They were marked to skip the build until 1 Aug 2026.)

The `.github/workflows/deploy.yml` workflow is **dormant** — it's gated behind a `DEPLOY_ENABLED` repo
variable that is unset, so it's skipped on every push. The Cloudflare Worker git-integration is the real (and
only active) deploy path; don't be misled by GitHub Actions showing "skipped".

**Social sharing / SEO:** every page emits Open Graph + Twitter-card tags from `src/layouts/Layout.astro`,
pointing at `public/og.png` (1200×630). `og:url` and the canonical link are built per-page from `Astro.site`,
because link scrapers don't resolve relative URLs. `og:image:width`/`height` are declared explicitly — Facebook
needs them to render a card on first scrape instead of deferring it.

To regenerate the card, run `python3 scripts/make-og.py` from the repo root (needs Pillow and Google Chrome).
It crops the hero photo, builds a branded HTML card in the site's own palette, and screenshots it with
headless Chrome at 1200×630. Text, colours and the crop centre are constants at the top of that file.

`@astrojs/sitemap` builds `sitemap-index.xml` (→ `sitemap-0.xml`) on every build, and `public/robots.txt`
points crawlers at it. Submitting it in Google Search Console is still outstanding (Robbie's browser task).
