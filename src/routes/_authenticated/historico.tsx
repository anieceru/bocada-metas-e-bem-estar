import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/historico")({
  head: () => ({ meta: [{ title: "Histórico — Bocada" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AppShell titulo="Histórico">
      <div className="mt-10 text-center text-muted-foreground">
        <History className="mx-auto h-8 w-8" aria-hidden />
        <p className="mt-3 text-sm">Seu histórico vai aparecer aqui.</p>
      </div>
    </AppShell>
  ),
});
