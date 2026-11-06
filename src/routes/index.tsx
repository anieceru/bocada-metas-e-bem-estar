import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Mic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bocada — diário alimentar leve e rápido" },
      { name: "description", content: "Bocada é um diário alimentar leve, rápido e acolhedor." },
      { property: "og:title", content: "Bocada — diário alimentar" },
      { property: "og:description", content: "Um diário alimentar leve, rápido e acolhedor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/hoje", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto flex max-w-sm flex-col">
        <p className="text-3xl font-bold tracking-tight text-primary">Bocada</p>
        <div className="mt-16 flex h-16 w-16 items-center justify-center rounded-2xl bg-destaque">
          <Mic className="h-7 w-7 text-destaque-foreground" aria-hidden />
        </div>
        <h1 className="mt-6 text-3xl font-bold leading-tight">Seu diário alimentar, leve e sem complicação.</h1>
        <p className="mt-3 text-muted-foreground">Defina suas metas e acompanhe seu dia. Em breve, é só falar o que comeu.</p>
        <Link to="/auth" className="mt-10 rounded-xl bg-primary py-3 text-center font-semibold text-primary-foreground">
          Entrar ou criar conta
        </Link>
        <nav className="mt-12 flex gap-4 text-xs text-muted-foreground">
          <Link to="/privacidade" className="underline">Privacidade</Link>
          <Link to="/termos" className="underline">Termos de Uso</Link>
        </nav>
      </div>
    </div>
  );
}
