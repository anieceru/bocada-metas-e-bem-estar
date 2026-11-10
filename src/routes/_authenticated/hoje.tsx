import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Trash2, Plus, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { RegistrarRefeicao } from "@/components/RegistrarRefeicao";
import { EditarRefeicoes } from "@/components/EditarRefeicoes";
import { Semana } from "@/components/Semana";
import { perfilQuery } from "@/lib/profile";
import { registrosDoDiaQuery } from "@/lib/registros";
import { hojeISO } from "@/lib/diario";
import { nomeAlimento } from "@/lib/identificar-alimentos";
import { dataValida, REFEICOES_PADRAO } from "@/lib/calendario";
import { privatePageHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/hoje")({
  head: () => privatePageHead("Hoje", "Registre suas refeições e acompanhe seu resumo diário no Bocada."),
  validateSearch: (search: Record<string, unknown>): { dia?: string } => dataValida(search['dia']) ? { dia: search['dia'] } : {},
  loader: ({ context }) => context.queryClient.ensureQueryData(perfilQuery),
  component: Hoje,
});
const METRICAS = [
  { key: "kcal", nome: "Calorias", unidade: "kcal" },
  { key: "proteinas_g", nome: "Proteínas", unidade: "g" },
  { key: "carboidratos_g", nome: "Carbos", unidade: "g" },
  { key: "gorduras_g", nome: "Gorduras", unidade: "g" },
] as const;
function Hoje() {
  const { data } = useSuspenseQuery(perfilQuery);
  const qc = useQueryClient();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const dia = search.dia ?? hojeISO();
  const [refeicaoAberta, setRefeicaoAberta] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const consent = !!data.perfil?.consentimento_saude_em;
  const { data: registros = [], isPending, isError } = useQuery({ ...registrosDoDiaQuery(dia), enabled: consent });
  if (!data.perfil?.onboarding_concluido) return <Navigate to="/onboarding" replace />;
  const refeicoes = data.perfil.refeicoes?.length ? data.perfil.refeicoes : REFEICOES_PADRAO;
  const grupos = [...new Set([...refeicoes, ...registros.map((r) => r.refeicao)])];
  const fibras = registros.filter((r) => r.fibra_g != null);
  async function apagar(id: string) {
    const { error } = await supabase.from("registros").delete().eq("id", id);
    if (error) return void toast.error("Não foi possível apagar.");
    qc.invalidateQueries({ queryKey: ["registros"] });
  }
  if (!consent) return <AppShell><section className="mt-4 py-6 text-center">
    <p>Para registrar refeições, é preciso autorizar o tratamento de dados de saúde.</p>
    <Button asChild className="mt-4"><Link to="/configuracoes">Ir para Configurações</Link></Button>
  </section></AppShell>;
  return <AppShell titulo={new Date(`${dia}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}>
    <RegistrarRefeicao key={dia + refeicoes.join("|")} userId={data.user.id} dia={dia} refeicoes={refeicoes} />
    <section className="mt-5 border-t pt-5">
      <h2 className="text-base font-semibold">Resumo do dia</h2>
      {isError ? <p role="alert" className="mt-3 text-sm text-destructive">Não foi possível carregar este dia.</p> : isPending ? <p className="mt-3 text-sm text-muted-foreground">Carregando…</p> : <>
        <ul className="mt-3 grid grid-cols-2 gap-3">{METRICAS.map(({ key, nome, unidade }) => {
          const total = registros.reduce((s, r) => s + Number(r[key]), 0);
          const meta = data.metas?.[key];
          return <li key={key} className="rounded-lg border bg-surface p-4"><p className="text-xs text-muted-foreground">{nome}</p><p className="mt-1 text-lg font-semibold">{Math.round(total).toLocaleString("pt-BR")} <span className="text-xs font-normal text-muted-foreground">{meta != null ? `/ ${meta.toLocaleString("pt-BR")} ` : ""}{unidade}</span></p></li>;
        })}</ul>
        <ul className="mt-3 grid grid-cols-2 gap-3">
          <li className="rounded-lg border bg-surface p-4">
            <p className="text-xs text-muted-foreground">Fibras</p>
            <p className="mt-1 text-lg font-semibold">{fibras.length ? fibras.reduce((s, r) => s + Number(r.fibra_g), 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : "—"} <span className="text-xs font-normal text-muted-foreground">g</span></p>
            {!fibras.length && <p className="mt-1 text-xs text-muted-foreground">Não informado</p>}
            {fibras.length > 0 && fibras.length < registros.length && <p className="mt-1 text-xs text-muted-foreground">Total parcial: {fibras.length} de {registros.length} alimentos.</p>}
          </li>
          <li className="rounded-lg border bg-surface p-4">
            <p className="text-xs text-muted-foreground">Meta diária de água</p>
            <p className="mt-1 text-lg font-semibold">{data.metas?.agua_ml != null ? data.metas.agua_ml.toLocaleString("pt-BR") : "—"} <span className="text-xs font-normal text-muted-foreground">ml</span></p>
            {data.metas?.agua_ml == null && <Link to="/configuracoes" className="mt-1 inline-block text-xs text-primary underline">Definir meta</Link>}
          </li>
        </ul>
      </>}
    </section>
    <section className="mt-6">
      <div className="flex items-center justify-between"><h2 className="text-base font-semibold">{dia === hojeISO() ? "Registrado hoje" : "Refeições do dia"}</h2><Button variant="ghost" size="icon" aria-label="Editar refeições" title="Editar refeições" onClick={() => setEditando(true)}><Pencil className="h-4 w-4" /></Button></div>
      {grupos.map((nome) => {
        const itens = registros.filter((r) => r.refeicao === nome);
        return <div key={nome} className="border-b py-4">
          <Button variant="ghost" onClick={() => setRefeicaoAberta(nome)} className="h-auto w-full justify-between px-0 text-left"><span className="font-semibold">{nome}</span><span className="flex items-center gap-2 text-xs text-muted-foreground">{Math.round(itens.reduce((s, r) => s + Number(r.kcal), 0))} kcal<Plus className="h-4 w-4 text-primary" /></span></Button>
          {itens.length === 0 ? <p className="mt-2 text-xs text-muted-foreground">Nada registrado.</p> : <ul className="mt-2 divide-y">{itens.map((r) => <li key={r.id} className="flex items-center gap-2 py-2"><div className="min-w-0 flex-1"><p className="break-words text-sm">{nomeAlimento(r.descricao)}</p><p className="text-xs text-muted-foreground">{Number(r.gramas)} g · {Math.round(Number(r.kcal))} kcal</p></div><Button variant="ghost" size="icon" aria-label={`Apagar ${nomeAlimento(r.descricao)}`} onClick={() => apagar(r.id)}><Trash2 className="h-4 w-4" /></Button></li>)}</ul>}
        </div>;
      })}
    </section>
    <Semana dia={dia} onChange={(d) => navigate({ search: { dia: d } })} />
    <Dialog open={refeicaoAberta !== null} onOpenChange={(open) => { if (!open) setRefeicaoAberta(null); }}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogTitle>{refeicaoAberta}</DialogTitle>{refeicaoAberta && <RegistrarRefeicao key={refeicaoAberta} userId={data.user.id} dia={dia} refeicoes={[...new Set([...refeicoes, refeicaoAberta])]} refeicaoInicial={refeicaoAberta} onSaved={() => setRefeicaoAberta(null)} />}</DialogContent></Dialog>
    <Dialog open={editando} onOpenChange={setEditando}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogTitle>Editar refeições</DialogTitle>{editando && <EditarRefeicoes userId={data.user.id} nomes={refeicoes} onClose={() => setEditando(false)} />}</DialogContent></Dialog>
  </AppShell>;
}
