/* /llms.txt — a plain-Markdown map of the site for AI answer engines
 * (https://llmstxt.org). Built from the collections rather than kept as a
 * file in public/, so a project Robbie adds in the CMS shows up here too. */
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import about from "../content/about.json";

export const GET: APIRoute = async ({ site }) => {
  const url = (path: string) => new URL(path, site).href;
  const projects = (await getCollection("projects")).sort(
    (a, b) => (a.data.order ?? Infinity) - (b.data.order ?? Infinity),
  );

  const body = `# Robbie Avenaim

> Australian drummer, sound and installation artist working with robotic and kinetic percussion. Co-founder of the WHAT IS MUSIC? festival and founder of Safe in Sound.

${about.shortBio}

## Main pages

- [About](${url("/about/")}): full biography
- [Projects](${url("/projects/")}): current projects, installations and releases
- [Discography](${url("/discography/")}): recorded releases, labels and collaborators
- [Grants & Awards](${url("/grants/")}): funding and recognition
- [Testimonials](${url("/testimonials/")}): what collaborators and presenters say

## Projects

${projects.map((p) => `- [${p.data.title.replace(/\s+/g, " ").trim()}](${url(`/projects/${p.id}/`)}): ${p.data.summary.replace(/\s+/g, " ").trim()}`).join("\n")}
`;

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
