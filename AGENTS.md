## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Deployment & CMS commits

The site is a Cloudflare **Worker** (Static Assets), git-connected — an ordinary push to `main` builds and
deploys in ~60–90s. It is **not** a Pages project, and `.github/workflows/deploy.yml` is dormant.

**Never put a Cloudflare skip-CI token in a commit message.** Cloudflare matches those bracketed tokens
anywhere in the message, not just as a prefix, so a commit that merely *mentions* one silently never deploys
— no error, no check run. Write `skip_ci` or "the skip-CI flag" when a message has to discuss it.

CMS commits carry that marker on purpose (`skip_ci: true` in `public/admin/config.yml`), so saving in
`/admin/` no longer deploys. See README → "Publishing CMS edits".

Content ordering is drag-and-drop in the CMS and there is no Display Order field. The `order` frontmatter is
written by the CMS and is deliberately absent from `config.yml`'s `fields`; Grants have no `order` at all.
See README → "Content editing".
