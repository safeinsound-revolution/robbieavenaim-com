/** Resizing CMS uploads on the way out, via Cloudflare.
 *
 *  Everything the CMS accepts lands in public/images at whatever size it came
 *  off the camera or the screenshot key — the homepage hero was a 5.9 MB PNG,
 *  and nobody is going to ask Robbie to resize things before uploading.
 *  Cloudflare rewrites those on request: /cdn-cgi/image/<options>/<path>
 *  returns the same picture at a sane width, as AVIF or WebP where the browser
 *  takes it. Needs Image Transformations on for the zone (switched on
 *  2026-10-05); with it off, every rewritten URL is a 404.
 *
 *  This is delivery only. The original stays in the repo at full size, so the
 *  transformation is always reversible and nothing is ever lost.
 *
 *  Ported from the safeinsound site, plus `dimensions()` and width-descriptor
 *  srcsets for the full-bleed heroes.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { imageSize } from 'image-size';

/** Widest we ever ask for. Beyond this the bytes stop buying visible detail. */
const MAX_WIDTH = 2400;

/** Cloudflare's default is 85; 82 is indistinguishable here and smaller. */
const QUALITY = 82;

/** Steps offered to a full-bleed image, so a phone isn't sent a desktop file. */
const STEPS = [640, 960, 1280, 1600, 2000, 2400];

/**
 * Whether this path is ours to rewrite.
 *
 * SVG has nothing to resize, and an animated GIF would come back as a single
 * frame — both are better served untouched. Anything absolute belongs to
 * someone else's origin.
 */
function transformable(path: string): boolean {
  return path.startsWith('/') && !/\.(svg|gif)(\?|$)/i.test(path);
}

/**
 * A resized URL for an upload, or the path unchanged when it can't be resized.
 *
 * In dev this always returns the original: /cdn-cgi only exists once the
 * request has gone through Cloudflare, so a rewritten URL is a 404 on
 * localhost. The same is true of `astro preview` — check image sizes on the
 * deployed site, not on a local build.
 */
export function resized(path: string, width: number): string {
  if (import.meta.env.DEV || !transformable(path)) return path;

  const w = Math.min(Math.round(width), MAX_WIDTH);
  /* encodeURI, not encodeURIComponent: uploads routinely have spaces in their
     names ("Screen Shot 2026-07-23 at 8.48.06 pm.png") and those must be
     escaped, but the slashes separating the path must not be. */
  return `/cdn-cgi/image/width=${w},quality=${QUALITY},format=auto,fit=scale-down${encodeURI(path)}`;
}

/**
 * A 1x/2x srcset, or undefined when there's nothing to vary.
 *
 * fit=scale-down means the 2x entry costs nothing on an upload that was never
 * that big to begin with — Cloudflare returns it at its own size rather than
 * blowing it up.
 */
export function resizedSrcset(path: string, width: number): string | undefined {
  if (import.meta.env.DEV || !transformable(path)) return undefined;
  if (width >= MAX_WIDTH) return undefined; // no room left for a 2x

  return `${resized(path, width)} 1x, ${resized(path, width * 2)} 2x`;
}

/**
 * A width-descriptor srcset for an image whose size tracks the viewport —
 * pair it with a `sizes` attribute. Steps wider than the original are
 * dropped (scale-down would only hand back the original again), and the
 * original's own width stands in for them so the top end is still offered.
 */
export function resizedWidths(path: string, intrinsic?: number): string | undefined {
  if (import.meta.env.DEV || !transformable(path)) return undefined;

  const top = Math.min(intrinsic ?? MAX_WIDTH, MAX_WIDTH);
  const steps = STEPS.filter((w) => w < top).concat(top);
  return steps.map((w) => `${resized(path, w)} ${w}w`).join(', ');
}

/**
 * The upload's own pixel size, read from public/ at build time, so the <img>
 * can carry width/height and the browser reserves its box before it loads.
 *
 * Undefined for anything that isn't a readable local file — a remote URL, or
 * a path the CMS saved for an upload that has since been deleted. The page
 * still builds; that one image just goes without.
 */
export function dimensions(path: string): { width: number; height: number } | undefined {
  if (!path.startsWith('/')) return undefined;
  try {
    const file = join(process.cwd(), 'public', decodeURI(path));
    const { width, height, orientation } = imageSize(readFileSync(file));
    // EXIF orientations 5–8 are a phone photo stored on its side.
    return orientation && orientation >= 5 ? { width: height, height: width } : { width, height };
  } catch {
    return undefined;
  }
}
