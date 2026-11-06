import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

export function LegalPage({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background px-5 py-10">
      <article className="mx-auto max-w-2xl space-y-4 text-sm leading-relaxed [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold">
        <Link to="/" className="text-xl font-bold text-primary">Bocada</Link>
        <h1 className="text-2xl font-bold">{titulo}</h1>
        <p className="rounded-xl bg-aviso p-3 font-medium text-aviso-foreground">
          RASCUNHO: texto provisório, a ser revisado por profissional jurídico antes da publicação.
        </p>
        {children}
      </article>
    </div>
  );
}

export const legalHead = (titulo: string, desc: string) => ({
  meta: [
    { title: `${titulo} — Bocada` },
    { name: "description", content: desc },
    { property: "og:title", content: `${titulo} — Bocada` },
    { property: "og:description", content: desc },
    { property: "og:type", content: "article" },
    { name: "twitter:card", content: "summary" },
  ],
});
