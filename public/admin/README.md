# Setting up the CMS

The admin UI at `/admin/` is [Sveltia CMS](https://github.com/sveltia/sveltia-cms) — it edits the files in
`src/content/` directly and commits to GitHub. The site and the OAuth worker that lets the CMS log in via
GitHub are both already deployed; **one manual step is left** because GitHub doesn't let this be done via API —
creating the OAuth App itself has to happen in the GitHub UI.

## One-time setup (~2 minutes)

1. Go to <https://github.com/settings/applications/new> (repo owner: `jowtron`).
2. Fill in:
   - **Application name**: `Robbie Avenaim CMS`
   - **Homepage URL**: `https://robbieavenaim.com`
   - **Authorization callback URL**: `https://robbieavenaim-cms-auth.josephderrick.workers.dev/callback`
3. Click **Register application**.
4. Copy the **Client ID**, then click **Generate a new client secret** and copy that too (you only see it once).
5. Set both as secrets on the auth worker:
   ```sh
   cd workers/cms-auth
   wrangler secret put GITHUB_CLIENT_ID
   wrangler secret put GITHUB_CLIENT_SECRET
   ```
6. Visit `https://robbieavenaim.com/admin/` and log in with GitHub.

That's it — after this, editing content, uploading images, and publishing all happen through the CMS UI and
land as commits on `main`, which redeploys the site automatically via GitHub Actions.

## If the repo or domain changes

Update `public/admin/config.yml` (`backend.repo`, `site_url`) and the worker's callback URL / GitHub OAuth App
homepage to match.
