import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell, GoogleIcon, cooldownRestante, limparFalhas, registrarFalha } from "@/components/AuthShell";
import { validarSenha } from "@/lib/config";
import { Mail } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Bocada" },
      { name: "description", content: "Entre ou crie sua conta no Bocada." },
      { property: "og:title", content: "Entrar — Bocada" },
      { property: "og:description", content: "Entre ou crie sua conta no Bocada." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "cadastrar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/hoje", replace: true });
    });
  }, [navigate]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setMsg(null);
    const espera = cooldownRestante("login");
    if (espera > 0) return setErro(`Muitas tentativas. Aguarde ${espera}s e tente de novo.`);
    setCarregando(true);
    try {
      if (modo === "cadastrar") {
        const v = validarSenha(senha);
        if (v) return setErro(v);
        const { error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { emailRedirectTo: `${window.location.origin}/hoje` },
        });
        if (error && /weak|pwned|leak/i.test(error.message))
          return setErro("Essa senha aparece em vazamentos conhecidos. Escolha outra.");
        if (error && /rate|limit/i.test(error.message))
          return setErro("Muitas tentativas. Aguarde um pouco e tente de novo.");
        // Mensagem neutra: não revela se o e-mail já existe.
        setMsg("Se o e-mail puder ser usado, você vai receber um link de confirmação. Confirme para entrar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) {
          registrarFalha("login");
          if (/not confirmed/i.test(error.message))
            return setErro("E-mail ou senha incorretos, ou e-mail ainda não confirmado.");
          return setErro("E-mail ou senha incorretos, ou e-mail ainda não confirmado.");
        }
        limparFalhas("login");
        navigate({ to: "/hoje", replace: true });
      }
    } finally {
      setCarregando(false);
    }
  }

  async function google() {
    setErro(null);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) return setErro("Não foi possível entrar com Google agora.");
    if (r.redirected) return;
    navigate({ to: "/hoje", replace: true });
  }

  async function microsoft() {
    setErro(null);
    try {
      const r = await lovable.auth.signInWithOAuth("microsoft", { redirect_uri: window.location.origin });
      if (r.error) return setErro("Não foi possível entrar com Microsoft agora.");
      if (r.redirected) return;
      const { data } = await supabase.auth.getUser();
      if (data.user) navigate({ to: "/hoje", replace: true });
    } catch {
      setErro("Não foi possível entrar com Microsoft agora. Tente novamente.");
    }
  }

  return (
    <AuthShell title={modo === "entrar" ? "Que bom te ver" : "Criar conta"}>
      <Button
        type="button"
        onClick={google}
        variant="outline"
        className="h-11 w-full gap-2.5"
      >
        <GoogleIcon />
        Continuar com Google
      </Button>
      <Button type="button" variant="outline" onClick={microsoft} className="mt-3 h-11 w-full gap-2.5">
        <Mail className="h-4 w-4" aria-hidden /> Continuar com Microsoft / Outlook
      </Button>
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
      </div>
      <form onSubmit={enviar} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="senha">Senha</Label>
          <Input
            id="senha"
            type="password"
            autoComplete={modo === "entrar" ? "current-password" : "new-password"}
            required
            minLength={8}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          {modo === "cadastrar" && <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres. Evite senhas comuns.</p>}
        </div>
        {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
        {msg && <p role="status" className="rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">{msg}</p>}
        <Button type="submit" disabled={carregando} className="h-11 w-full rounded-xl">
          {modo === "entrar" ? "Entrar" : "Criar conta"}
        </Button>
      </form>
      <div className="mt-5 flex flex-col gap-2 text-sm">
        {modo === "entrar" && (
          <Link to="/esqueci-senha" className="text-primary underline">Esqueci minha senha</Link>
        )}
        <button
          type="button"
          className="text-left text-primary underline"
          onClick={() => { setModo(modo === "entrar" ? "cadastrar" : "entrar"); setErro(null); setMsg(null); }}
        >
          {modo === "entrar" ? "Ainda não tenho conta" : "Já tenho conta"}
        </button>
      </div>
      {modo === "cadastrar" && (
        <p className="mt-6 text-xs text-muted-foreground">
          O Bocada é para maiores de 18 anos. Ao criar a conta você concorda com os{" "}
          <Link to="/termos" className="underline">Termos de Uso</Link>.
        </p>
      )}
    </AuthShell>
  );
}
