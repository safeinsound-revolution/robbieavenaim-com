// Pixel sizes of everything in public/, read once by Vite and handed to the
// pages as `virtual:image-dimensions`, so <Img> can stamp width/height.
//
// Read here rather than with node:fs in the page itself: Cloudflare's build
// renders the pages somewhere that can't see public/ (the fs read failed
// silently there and shipped every <img> without dimensions, 2026-10-05),
// whereas a Vite plugin always runs in plain Node.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { imageSize } from 'image-size';

const ID = 'virtual:image-dimensions';
const RESOLVED = '\0' + ID;
const IMAGE = /\.(jpe?g|png|webp|avif|gif|svg)$/i;

function scan(publicDir) {
  const sizes = {};
  for (const entry of readdirSync(publicDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !IMAGE.test(entry.name)) continue;
    const file = join(entry.parentPath, entry.name);
    try {
      const { width, height, orientation } = imageSize(readFileSync(file));
      if (!width || !height) continue;
      const key = '/' + relative(publicDir, file).split(sep).join('/');
      // EXIF orientations 5–8 are a phone photo stored on its side.
      sizes[key] = orientation >= 5 ? [height, width] : [width, height];
    } catch {
      // Not an image image-size understands; it just goes without.
    }
  }
  return sizes;
}

export default function imageDimensions() {
  let publicDir = 'public';
  return {
    name: 'image-dimensions',
    configResolved(config) {
      publicDir = config.publicDir;
    },
    resolveId(id) {
      if (id === ID) return RESOLVED;
    },
    load(id) {
      if (id === RESOLVED) return `export default ${JSON.stringify(scan(publicDir))};`;
    },
  };
}
