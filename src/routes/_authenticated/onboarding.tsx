import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ShieldCheck, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MetasForm } from "@/components/MetasForm";
import { excluirConta } from "@/lib/conta.functions";
import { OBJETIVOS, TEXTO_CONSENTIMENTO, VERSAO_CONSENTIMENTO, type Metas } from "@/lib/config";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Primeiros passos — Bocada" }, { name: "robots", content: "noindex" }] }),
  component: Onboarding,
});

type Passo = "idade" | "bloqueio" | "consentimento" | "corpo" | "tom" | "metas";

function Opcao({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium ${ativo ? "border-primary bg-secondary text-secondary-foreground" : "bg-surface"}`}
    >
      {children}
    </button>
  );
}

function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [passo, setPasso] = useState<Passo>("idade");
  const [idade, setIdade] = useState("");
  const [consente, setConsente] = useState(false);
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [sexo, setSexo] = useState<string | null>(null);
  const [objetivo, setObjetivo] = useState<string | null>(null);
  const [tom, setTom] = useState<"neutro" | "animado">("neutro");
  const [erro, setErro] = useState<string | null>(null);

  const num = (s: string) => (s.trim() ? Number(s.replace(",", ".")) : null);

  async function concluir(metas: Metas | null) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const base = { tom, onboarding_concluido: true };
    const saude = consente
      ? {
          idade: Number(idade),
          peso_kg: num(peso),
          altura_cm: num(altura),
          sexo,
          objetivo,
          consentimento_saude_em: new Date().toISOString(),
          consentimento_saude_versao: VERSAO_CONSENTIMENTO,
        }
      : {};
    const { error } = await supabase.from("profiles").update({ ...base, ...saude }).eq("id", u.user.id);
    if (error) return void toast.error("Não foi possível salvar. Tente de novo.");
    if (consente && metas) {
      const { error: e2 } = await supabase.from("metas").upsert({ user_id: u.user.id, ...metas }, { onConflict: "user_id" });
      if (e2) return void toast.error("Não foi possível salvar as metas.");
    }
    qc.removeQueries({ queryKey: ["perfil"] });
    navigate({ to: "/hoje", replace: true });
  }

  const cartao = "mx-auto max-w-sm px-5 py-10";

  if (passo === "idade")
    return (
      <div className={cartao}>
        <p className="text-sm font-semibold text-primary">Passo 1</p>
        <h1 className="mt-1 text-2xl font-bold">Quantos anos você tem?</h1>
        <div className="mt-4 rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">
          <p className="flex items-center gap-2 font-semibold"><Lock className="h-4 w-4" aria-hidden /> Por que perguntamos</p>
          <p className="mt-1">O Bocada é só para maiores de 18 anos. Esta resposta serve para essa checagem e <strong>não é guardada</strong> neste passo.</p>
        </div>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(idade);
            if (!Number.isInteger(n) || n < 1 || n > 120) return setErro("Digite uma idade válida.");
            setErro(null);
            setPasso(n < 18 ? "bloqueio" : "consentimento");
          }}
        >
          <Label htmlFor="idade">Idade</Label>
          <Input id="idade" inputMode="numeric" required value={idade} onChange={(e) => setIdade(e.target.value.replace(/\D/g, ""))} />
          {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
          <Button type="submit" className="h-11 w-full rounded-xl">Continuar</Button>
        </form>
      </div>
    );

  if (passo === "bloqueio")
    return (
      <div className={cartao}>
        <h1 className="text-2xl font-bold">Por enquanto o Bocada é só para maiores de 18</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Obrigado pelo interesse. Para cuidar da alimentação com segurança, recomendamos conversar com um adulto de confiança ou um profissional de saúde. Sua idade não foi guardada.
        </p>
        <Button
          className="mt-6 h-11 w-full rounded-xl"
          onClick={async () => {
            try { await excluirConta(); } catch { /* segue para sair */ }
            await supabase.auth.signOut();
            navigate({ to: "/auth", replace: true });
          }}
        >
          Encerrar e excluir esta conta
        </Button>
      </div>
    );

  if (passo === "consentimento")
    return (
      <div className={cartao}>
        <p className="text-sm font-semibold text-primary">Passo 2</p>
        <h1 className="mt-1 text-2xl font-bold">Seus dados de saúde</h1>
        <div className="mt-4 rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">
          <p className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" aria-hidden /> Guardar é opcional</p>
          <p className="mt-1">
            Para salvar idade, peso, altura, sexo, objetivo e metas, precisamos da sua autorização. Sem ela, você usa o app normalmente, mas esses dados não ficam guardados.
          </p>
        </div>
        <label className="mt-5 flex items-start gap-3 rounded-xl border bg-surface p-4 text-sm">
          <Checkbox checked={consente} onCheckedChange={(v) => setConsente(v === true)} className="mt-0.5" />
          <span>
            {TEXTO_CONSENTIMENTO}{" "}
            <Link to="/privacidade" target="_blank" className="text-primary underline">Política de Privacidade</Link>
          </span>
        </label>
        <Button className="mt-6 h-11 w-full rounded-xl" onClick={() => setPasso(consente ? "corpo" : "tom")}>
          {consente ? "Continuar" : "Continuar sem guardar dados de saúde"}
        </Button>
      </div>
    );

  if (passo === "corpo")
    return (
      <div className={cartao}>
        <p className="text-sm font-semibold text-primary">Passo 3</p>
        <h1 className="mt-1 text-2xl font-bold">Sobre você</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tudo opcional. Dá para mudar depois.</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label htmlFor="peso">Peso (kg)</Label><Input id="peso" inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="altura">Altura (cm)</Label><Input id="altura" inputMode="numeric" value={altura} onChange={(e) => setAltura(e.target.value)} /></div>
        </div>
        <p className="mt-6 text-sm font-medium">Sexo (opcional)</p>
        <p className="text-xs text-muted-foreground">Serve só para sugerir metas no futuro.</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[["feminino", "Feminino"], ["masculino", "Masculino"], ["outro", "Outro"]].map(([v, l]) => (
            <Opcao key={v} ativo={sexo === v} onClick={() => setSexo(sexo === v ? null : (v as string))}>{l}</Opcao>
          ))}
        </div>
        <p className="mt-6 text-sm font-medium">Objetivo</p>
        <div className="mt-2 space-y-2">
          {OBJETIVOS.map((o) => (
            <Opcao key={o.v} ativo={objetivo === o.v} onClick={() => setObjetivo(o.v)}>{o.l}</Opcao>
          ))}
        </div>
        <Button className="mt-6 h-11 w-full rounded-xl" onClick={() => setPasso("tom")}>Continuar</Button>
      </div>
    );

  if (passo === "tom")
    return (
      <div className={cartao}>
        <h1 className="text-2xl font-bold">Como prefere que o app fale com você?</h1>
        <div className="mt-6 space-y-2">
          <Opcao ativo={tom === "neutro"} onClick={() => setTom("neutro")}>Neutro</Opcao>
          <Opcao ativo={tom === "animado"} onClick={() => setTom("animado")}>Um pouco mais animado</Opcao>
        </div>
        <Button className="mt-6 h-11 w-full rounded-xl" onClick={() => (consente ? setPasso("metas") : concluir(null))}>
          {consente ? "Continuar" : "Concluir"}
        </Button>
      </div>
    );

  return (
    <div className={cartao}>
      <h1 className="text-2xl font-bold">Metas diárias</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">Digite as que quiser. Tudo pode ser preenchido depois.</p>
      <MetasForm
        inicial={{}}
        rotuloSalvar="Salvar e concluir"
        onSalvar={(m) => concluir(m)}
        extra={
          <Button type="button" variant="ghost" className="h-11 rounded-xl" onClick={() => concluir(null)}>
            Pular por enquanto
          </Button>
        }
      />
    </div>
  );
}
