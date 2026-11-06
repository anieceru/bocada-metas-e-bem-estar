export function privatePageHead(title: string, description: string) {
  return { meta: [
    { title: `${title} — Bocada` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — Bocada` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] };
}