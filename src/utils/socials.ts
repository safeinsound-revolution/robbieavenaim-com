import contact from '../content/contact.json';

/* The CMS writes a field it has never had filled in as '' — and older saves of
   contact.json predate some of these fields entirely — so both read as unset. */
const c = contact as Record<string, string | undefined>;

/** Robbie's profiles, in footer order. Feeds the footer links and the
 *  homepage's Person schema `sameAs`, so the two can't drift apart. */
export const socials = [
  { label: 'Instagram', url: c.instagram },
  { label: 'Facebook', url: c.facebook },
  { label: 'YouTube', url: c.youtube },
  { label: 'Bandcamp', url: c.bandcamp },
  { label: 'LinkedIn', url: c.linkedin },
  { label: 'X', url: c.x },
].filter((s): s is { label: string; url: string } => !!s.url?.trim());
