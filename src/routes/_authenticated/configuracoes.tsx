import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { MetasForm } from "@/components/MetasForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { perfilQuery } from "@/lib/profile";
import { excluirConta } from "@/lib/conta.functions";
import { aplicarTema, lerTema, type Tema } from "@/lib/theme";
import { OBJETIVOS, TEXTO_CONSENTIMENTO, VERSAO_CONSENTIMENTO, type Metas } from "@/lib/config";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Bocada" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(perfilQuery),
  component: Config,
});

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-2xl border bg-surface p-5">
      <h2 className="mb-4 text-base font-semibold">{titulo}</h2>
      {children}
    </section>
  );
}

function Seletor<T extends string>({ valor, opcoes, onChange }: { valor: T | null; opcoes: readonly { v: T; l: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {opcoes.map((o) => (
        <button key={o.v} type="button" aria-pressed={valor === o.v} onClick={() => onChange(o.v)}
          className={`rounded-xl border px-3 py-2 text-sm font-medium ${valor === o.v ? "border-primary bg-secondary text-secondary-foreground" : ""}`}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

function Config() {
  const { data } = useSuspenseQuery(perfilQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const p = data.perfil!;
  const uid = data.user.id;
  const temConsent = !!p.consentimento_saude_em;

  const [tema, setTema] = useState<Tema>("sistema");
  useEffect(() => setTema(lerTema()), []);

  const [idade, setIdade] = useState(p.idade?.toString() ?? "");
  const [peso, setPeso] = useState(p.peso_kg?.toString() ?? "");
  const [altura, setAltura] = useState(p.altura_cm?.toString() ?? "");
  const [sexo, setSexo] = useState<string | null>(p.sexo);
  const [objetivo, setObjetivo] = useState<string | null>(p.objetivo);
  const [tom, setTom] = useState(p.tom);
  const [copo, setCopo] = useState(p.copo_ml.toString());
  const [novoConsent, setNovoConsent] = useState(false);

  const recarregar = () => qc.invalidateQueries({ queryKey: ["perfil"] });
  const num = (s: string) => (s.trim() ? Number(s.replace(",", ".")) : null);

  async function salvarPerfil(e: React.FormEvent) {
    e.preventDefault();
    const copoN = Number(copo);
    if (!(copoN >= 50 && copoN <= 2000)) return void toast.error("Tamanho do copo entre 50 e 2000 ml.");
    const upd: { tom: string; copo_ml: number; idade?: number; peso_kg?: number | null; altura_cm?: number | null; sexo?: string | null; objetivo?: string | null } = { tom, copo_ml: copoN };
    if (temConsent) {
      const i = num(idade);
      if (i == null || i < 18 || i > 120) return void toast.error("Informe uma idade válida (18 ou mais).");
      Object.assign(upd, { idade: i, peso_kg: num(peso), altura_cm: num(altura), sexo, objetivo });
    }
    const { error } = await supabase.from("profiles").update(upd).eq("id", uid);
    if (error) return void toast.error("Não foi possível salvar. Confira os valores.");
    toast.success("Perfil salvo.");
    recarregar();
  }

  async function darConsentimento() {
    const { error } = await supabase.from("profiles").update({
      consentimento_saude_em: new Date().toISOString(),
      consentimento_saude_versao: VERSAO_CONSENTIMENTO,
    }).eq("id", uid);
    if (error) return void toast.error("Não foi possível salvar.");
    toast.success("Autorização registrada.");
    setNovoConsent(false);
    recarregar();
  }

  async function retirarConsentimento() {
    const { error } = await supabase.from("profiles").update({ consentimento_saude_em: null }).eq("id", uid);
    if (error) return void toast.error("Não foi possível retirar agora.");
    setIdade(""); setPeso(""); setAltura(""); setSexo(null); setObjetivo(null);
    toast.success("Autorização retirada e dados de saúde apagados.");
    recarregar();
  }

  async function salvarMetas(m: Metas) {
    const { error } = await supabase.from("metas").upsert({ user_id: uid, ...m }, { onConflict: "user_id" });
    if (error) return void toast.error("Não foi possível salvar as metas.");
    toast.success("Metas salvas.");
    recarregar();
  }

  async function exportar() {
    const { data: fresh } = await qc.fetchQuery({ ...perfilQuery, staleTime: 0 }).then((d) => ({ data: d }));
    const conteudo = {
      exportado_em: new Date().toISOString(),
      conta: { id: fresh.user.id, email: fresh.user.email, criada_em: fresh.user.created_at },
      perfil: fresh.perfil,
      metas: fresh.metas,
    };
    const blob = new Blob([JSON.stringify(conteudo, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "bocada-meus-dados.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function excluir() {
    try {
      await excluirConta();
      await supabase.auth.signOut();
      navigate({ to: "/auth", replace: true });
      toast.success("Sua conta foi excluída.");
    } catch {
      toast.error("Não foi possível excluir a conta agora. Tente de novo.");
    }
  }

  async function sair() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <AppShell titulo="Configurações">
      <div className="flex gap-3 rounded-2xl bg-aviso p-4 text-sm text-aviso-foreground">
        <Info className="h-5 w-5 shrink-0" aria-hidden />
        <p>Os valores do app são estimativas e não substituem orientação de nutricionista ou médico.</p>
      </div>

      <Secao titulo="Perfil">
        <form onSubmit={salvarPerfil} className="space-y-4">
          {temConsent ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5"><Label htmlFor="c-idade">Idade</Label><Input id="c-idade" inputMode="numeric" value={idade} onChange={(e) => setIdade(e.target.value.replace(/\D/g, ""))} /></div>
                <div className="space-y-1.5"><Label htmlFor="c-peso">Peso (kg)</Label><Input id="c-peso" inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} /></div>
                <div className="space-y-1.5"><Label htmlFor="c-alt">Altura (cm)</Label><Input id="c-alt" inputMode="numeric" value={altura} onChange={(e) => setAltura(e.target.value)} /></div>
              </div>
              <div className="space-y-1.5">
                <Label>Sexo (opcional)</Label>
                <Seletor valor={sexo} onChange={(v) => setSexo(sexo === v ? null : v)} opcoes={[{ v: "feminino", l: "Feminino" }, { v: "masculino", l: "Masculino" }, { v: "outro", l: "Outro" }]} />
              </div>
              <div className="space-y-1.5"><Label>Objetivo</Label><Seletor valor={objetivo} onChange={setObjetivo} opcoes={OBJETIVOS} /></div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Dados de saúde não são guardados porque não há autorização. Veja "Dados de saúde" abaixo.</p>
          )}
          <div className="space-y-1.5"><Label>Tom do app</Label><Seletor valor={tom} onChange={setTom} opcoes={[{ v: "neutro", l: "Neutro" }, { v: "animado", l: "Mais animado" }]} /></div>
          <div className="space-y-1.5"><Label htmlFor="c-copo">Tamanho do copo de água (ml)</Label><Input id="c-copo" inputMode="numeric" value={copo} onChange={(e) => setCopo(e.target.value.replace(/\D/g, ""))} /></div>
          <Button type="submit" className="h-11 w-full rounded-xl">Salvar perfil</Button>
        </form>
      </Secao>

      <Secao titulo="Metas diárias">
        {temConsent ? (
          <MetasForm key={data.metas?.atualizado_em ?? "novo"} inicial={data.metas ?? {}} rotuloSalvar="Salvar metas" onSalvar={salvarMetas} />
        ) : (
          <p className="text-sm text-muted-foreground">Para guardar metas, autorize o tratamento de dados de saúde.</p>
        )}
      </Secao>

      <Secao titulo="Tema">
        <Seletor valor={tema} onChange={(t) => { setTema(t); aplicarTema(t); supabase.from("profiles").update({ tema: t }).eq("id", uid).then(); }}
          opcoes={[{ v: "claro", l: "Claro" }, { v: "escuro", l: "Escuro" }, { v: "sistema", l: "Sistema" }]} />
      </Secao>

      <Secao titulo="Dados de saúde">
        {temConsent ? (
          <div className="space-y-3 text-sm">
            <p>Autorizado em {new Date(p.consentimento_saude_em!).toLocaleString("pt-BR")} (versão {p.consentimento_saude_versao}).</p>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="outline" className="w-full rounded-xl">Retirar autorização</Button></AlertDialogTrigger>
              <AlertDialogContent className="max-w-sm rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Retirar autorização?</AlertDialogTitle>
                  <AlertDialogDescription>Idade, peso, altura, sexo, objetivo e metas serão apagados. Você continua usando o app.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={retirarConsentimento}>Retirar e apagar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <label className="flex items-start gap-3">
              <Checkbox checked={novoConsent} onCheckedChange={(v) => setNovoConsent(v === true)} className="mt-0.5" />
              <span>{TEXTO_CONSENTIMENTO} <Link to="/privacidade" className="text-primary underline">Política de Privacidade</Link></span>
            </label>
            <Button disabled={!novoConsent} onClick={darConsentimento} className="w-full rounded-xl">Autorizar</Button>
          </div>
        )}
      </Secao>

      <Secao titulo="Privacidade e conta">
        <div className="space-y-2">
          <Button variant="outline" className="w-full rounded-xl" onClick={exportar}>Exportar meus dados (JSON)</Button>
          <Button variant="outline" className="w-full rounded-xl" onClick={sair}>Sair</Button>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="destructive" className="w-full rounded-xl">Excluir minha conta</Button></AlertDialogTrigger>
            <AlertDialogContent className="max-w-sm rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
                <AlertDialogDescription>Sua conta e todos os seus dados serão apagados de forma definitiva.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={excluir} className="bg-destructive text-destructive-foreground">Excluir definitivamente</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <nav className="mt-4 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
          <Link to="/privacidade" className="underline">Privacidade</Link>
          <Link to="/termos" className="underline">Termos</Link>
          <Link to="/contato-privacidade" className="underline">Contato de privacidade</Link>
        </nav>
      </Secao>
    </AppShell>
  );
}
