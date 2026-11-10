import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { HORAS_AGUA, HORAS_REFEICAO_PADRAO, type PrefsNotificacao } from "@/lib/notificacoes";
import { ativarPush } from "@/lib/firebase-config";
import type { Json } from "@/integrations/supabase/types";

const horas = Array.from({ length: 24 }, (_, h) => h);
const MSG_PUSH: Record<string, string> = {
  "nao-configurado": "As notificações ainda não estão configuradas.",
  "sem-suporte": "Este navegador não oferece notificações.",
  "abrir-nova-aba": "Abra o Bocada numa aba própria ou no app publicado para permitir notificações.",
  negado: "As notificações estão bloqueadas. Libere nas configurações do site no navegador.",
};

export function Lembretes({ userId, refeicoes }: { userId: string; refeicoes: string[] }) {
  const qc = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: ["notificacoes", userId],
    queryFn: async () => {
      const [{ data: p, error }, { count }] = await Promise.all([
        supabase.from("notificacao_preferencias").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("dispositivos_push").select("id", { count: "exact", head: true }).eq("user_id", userId),
      ]);
      if (error) throw new Error("Não foi possível carregar os lembretes.");
      return { p, dispositivos: count ?? 0 };
    },
  });
  if (isPending || !data) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  return <Formulario key={data.p?.atualizado_em ?? "novo"} userId={userId} refeicoes={refeicoes} inicial={data.p} dispositivos={data.dispositivos} onSalvo={() => qc.invalidateQueries({ queryKey: ["notificacoes", userId] })} />;
}

function Formulario({ userId, refeicoes, inicial, dispositivos, onSalvo }: { userId: string; refeicoes: string[]; inicial: ({ modo: string; refeicoes: boolean; agua: boolean; alertas: boolean; hora_diaria: number; horas_refeicoes: Json; canal_push: boolean }) | null; dispositivos: number; onSalvo: () => void }) {
  const [modo, setModo] = useState<PrefsNotificacao["modo"]>(inicial?.modo === "diaria" || inicial?.modo === "personalizada" ? inicial.modo : "nenhuma");
  const [ref, setRef] = useState(inicial?.refeicoes ?? true);
  const [agua, setAgua] = useState(inicial?.agua ?? false);
  const [alertas, setAlertas] = useState(inicial?.alertas ?? false);
  const [horaDiaria, setHoraDiaria] = useState(inicial?.hora_diaria ?? 20);
  const [horasRef, setHorasRef] = useState<Record<string, number>>({ ...HORAS_REFEICAO_PADRAO, ...((inicial?.horas_refeicoes ?? {}) as Record<string, number>) });
  const [salvando, setSalvando] = useState(false);
  const nadaMarcado = modo === "personalizada" && !ref && !agua && !alertas;

  async function salvar() {
    if (nadaMarcado) return;
    setSalvando(true);
    try {
      let canalPush = dispositivos > 0;
      if (modo !== "nenhuma") {
        const r = await ativarPush();
        if (r.status !== "registrado") return void toast(MSG_PUSH[r.status]);
        const { error } = await supabase.from("dispositivos_push").upsert({ user_id: userId, token: r.token }, { onConflict: "token", ignoreDuplicates: true });
        if (error) return void toast.error("Não foi possível ativar as notificações neste aparelho.");
        canalPush = true;
      }
      const fuso = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo";
      const { error } = await supabase.from("notificacao_preferencias").upsert({
        user_id: userId, modo, refeicoes: ref, agua, alertas, hora_diaria: horaDiaria, horas_refeicoes: horasRef, fuso,
        canal_push: modo !== "nenhuma" && canalPush, canal_email: false, atualizado_em: new Date().toISOString(),
      });
      if (error) return void toast.error("Não foi possível salvar os lembretes.");
      toast.success(modo === "nenhuma" ? "Notificações desativadas." : "Lembretes salvos.");
      onSalvo();
    } catch {
      toast.error("Não foi possível ativar as notificações agora.");
    } finally { setSalvando(false); }
  }

  const Hora = ({ id, valor, onChange }: { id: string; valor: number; onChange: (h: number) => void }) => (
    <select id={id} value={valor} onChange={(e) => onChange(Number(e.target.value))} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
      {horas.map((h) => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}
    </select>
  );

  return <div className="space-y-4">
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-medium">Quero receber</legend>
      {([["nenhuma", "Nenhuma notificação"], ["diaria", "Um lembrete diário"], ["personalizada", "Escolher quais lembretes"]] as const).map(([v, l]) => (
        <label key={v} className="flex items-center gap-3 text-sm"><input type="radio" name="modo-notif" value={v} checked={modo === v} onChange={() => setModo(v)} className="h-4 w-4 accent-primary" />{l}</label>
      ))}
    </fieldset>
    {modo === "diaria" && <div className="flex items-center justify-between gap-3"><Label htmlFor="hora-diaria">Horário do lembrete</Label><Hora id="hora-diaria" valor={horaDiaria} onChange={setHoraDiaria} /></div>}
    {modo === "personalizada" && <div className="space-y-4 border-l-2 pl-4">
      <div className="space-y-2">
        <label className="flex items-center gap-3 text-sm font-medium"><Checkbox checked={ref} onCheckedChange={(v) => setRef(v === true)} />Cada refeição</label>
        {ref && refeicoes.map((nome, i) => <div key={nome} className="flex items-center justify-between gap-3 pl-7 text-sm"><Label htmlFor={`hora-ref-${i}`} className="font-normal">{nome}</Label><Hora id={`hora-ref-${i}`} valor={horasRef[nome] ?? 12} onChange={(h) => setHorasRef({ ...horasRef, [nome]: h })} /></div>)}
      </div>
      <label className="flex items-start gap-3 text-sm"><Checkbox checked={agua} onCheckedChange={(v) => setAgua(v === true)} className="mt-0.5" /><span><span className="font-medium">Água</span><br /><span className="text-xs text-muted-foreground">Às {HORAS_AGUA.map((h) => `${h}h`).join(", ")}.</span></span></label>
      <label className="flex items-start gap-3 text-sm"><Checkbox checked={alertas} onCheckedChange={(v) => setAlertas(v === true)} className="mt-0.5" /><span><span className="font-medium">Alerta de meta ultrapassada</span><br /><span className="text-xs text-muted-foreground">No máximo uma vez por dia, com ideias para seguir com leveza.</span></span></label>
      {nadaMarcado && <p role="alert" className="text-sm text-destructive">Marque pelo menos um lembrete ou escolha outra opção.</p>}
    </div>}
    <div className="space-y-1 text-xs text-muted-foreground">
      <p className="flex items-center gap-1.5"><Bell className="h-3.5 w-3.5" aria-hidden />{dispositivos > 0 ? "Notificações ativas neste aparelho ou em outro já autorizado." : "O navegador vai pedir permissão ao salvar."}</p>
      <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" aria-hidden />Lembretes por e-mail ainda não estão disponíveis.</p>
      <p>As notificações não mostram calorias, peso ou outros dados de saúde.</p>
    </div>
    <Button onClick={salvar} disabled={salvando || nadaMarcado} className="h-11 w-full rounded-xl">{salvando ? "Salvando…" : "Salvar lembretes"}</Button>
  </div>;
}