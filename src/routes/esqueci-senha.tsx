import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell, cooldownRestante, registrarFalha } from "@/components/AuthShell";

export const Route = createFileRoute("/esqueci-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — Bocada" },
      { name: "description", content: "Receba um link para criar uma nova senha no Bocada." },
      { property: "og:title", content: "Recuperar senha — Bocada" },
      { property: "og:description", content: "Receba um link para criar uma nova senha." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const espera = cooldownRestante("reset");
    if (espera > 0) return setErro(`Aguarde ${espera}s para pedir outro link.`);
    registrarFalha("reset");
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    // Sempre a mesma resposta, exista ou não a conta.
    setMsg("Se houver uma conta com esse e-mail, enviamos um link para criar uma nova senha.");
  }

  return (
    <AuthShell title="Recuperar senha">
      <form onSubmit={enviar} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
        {msg && <p role="status" className="rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">{msg}</p>}
        <Button type="submit" className="h-11 w-full rounded-xl">Enviar link</Button>
      </form>
    </AuthShell>
  );
}
