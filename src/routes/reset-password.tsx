import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/AuthShell";
import { validarSenha } from "@/lib/config";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — Bocada" },
      { name: "description", content: "Defina uma nova senha para sua conta Bocada." },
      { property: "og:title", content: "Nova senha — Bocada" },
      { property: "og:description", content: "Defina uma nova senha." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const v = validarSenha(senha);
    if (v) return setErro(v);
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) {
      return setErro(
        /weak|pwned|leak/i.test(error.message)
          ? "Essa senha aparece em vazamentos conhecidos. Escolha outra."
          : "O link expirou ou não é válido. Peça um novo.",
      );
    }
    navigate({ to: "/hoje", replace: true });
  }

  return (
    <AuthShell title="Criar nova senha">
      <form onSubmit={enviar} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="senha">Nova senha</Label>
          <Input id="senha" type="password" autoComplete="new-password" required minLength={8} value={senha} onChange={(e) => setSenha(e.target.value)} />
        </div>
        {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
        <Button type="submit" className="h-11 w-full rounded-xl">Salvar senha</Button>
      </form>
    </AuthShell>
  );
}
