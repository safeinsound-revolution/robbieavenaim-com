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

CMS saves deploy like any other commit. `skip_ci: true` was removed from `public/admin/config.yml` on
1 Aug 2026 — it made every CMS save silently non-deploying, and the publish step meant to compensate was
unusable (the header "Publish Changes" button fires a `repository_dispatch` nothing listens for, and it is
hidden unless the very last commit carries the marker). Don't re-add it without a listener for that event.
See README → "Publishing CMS edits".

## Content schemas: a blank CMS box arrives as `''`, not as nothing

When the CMS saves an entry it writes out **every** field in the collection, including optional ones that were
never filled in, as an empty string. Zod's `z.string().optional()` is happy with that, which is why nothing has
broken here yet — every optional field on this site is a string. Anything else is not: `z.coerce.date()` reads
`''` as an invalid date, and an enum or a number rejects it outright.

One invalid field fails the **whole build**, and the CMS shows no error — the save succeeds, the commit lands,
and the site simply never updates. Everything else saved that day is stranded with it. This is exactly what
happened to safeinsound.com.au on 2026-07-31: an untouched "Last day" field wrote `endDate: ''` and took two
line-up photos and a rewritten description down with it, looking for all the world like the photos hadn't saved.

So **if you add a date, a number, or an optional dropdown to `config.yml`** — an event date on the homepage's
Upcoming Events list is the obvious future candidate — wrap its schema in `src/content.config.ts`:

```ts
/* An optional field the CMS has never had filled in comes back as an empty
 * string rather than being left out. Blank means "not set". */
const blank = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema);

eventDate: blank(z.coerce.date().optional()),
```

A required dropdown is safe (the CMS won't save it empty) but costs nothing to wrap. Strings never need it.

Alt text is the same trap one layer up: `imageAlt ?? name` keeps a blank `''` and publishes an unlabelled
photo, so fall back with `||`, not `??`.

Content ordering is drag-and-drop in the CMS and there is no Display Order field. The `order` frontmatter is
written by the CMS and is deliberately absent from `config.yml`'s `fields`; Grants have no `order` at all.
See README → "Content editing".
