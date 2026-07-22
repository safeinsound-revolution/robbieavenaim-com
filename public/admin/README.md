# Setting up the CMS

The admin UI at `/admin/` is [Sveltia CMS](https://github.com/sveltia/sveltia-cms) — it edits the files in
`src/content/` directly and commits to GitHub (`safeinsound-revolution/robbieavenaim-com`), which redeploys
the site. Anyone who edits needs **write access** to that repo (add them as a collaborator).

You can sign in two ways — full details and the manual checklist are in the repo root **`README.md`
→ "CMS setup"**. In short:

- **Option A — personal access token:** nothing to configure. At `/admin/`, sign in with a GitHub
  fine-grained PAT scoped to the `robbieavenaim-com` repo (Contents: read & write).

- **Option B — one-click "Sign in with GitHub":** already wired. `config.yml`'s `base_url` points at the
  **shared** `sveltia-cms-auth` OAuth worker on Robbie's Cloudflare account
  (`https://sveltia-cms-auth.robbie-avenaim.workers.dev`) — the same one Safe in Sound uses. The GitHub
  OAuth app and worker secrets already exist and are reused; **no new OAuth app or secrets for this site.**
  The only remaining step is that robbieavenaim.com's domains are on the worker's `ALLOWED_DOMAINS` — they've
  been added to the worker's source (`workers/sveltia-cms-auth/wrangler.toml` in the Safe in Sound repo); run
  `wrangler deploy` there once to apply it.

## If the repo or domain changes

Update `config.yml` (`backend.repo`, `site_url`) and add the new domain to the shared worker's
`ALLOWED_DOMAINS` (in the Safe in Sound repo's `workers/sveltia-cms-auth/wrangler.toml`), then redeploy it.
