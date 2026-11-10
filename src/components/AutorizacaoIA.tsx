import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { TEXTO_CONSENTIMENTO_IA, VERSAO_CONSENTIMENTO_IA } from "@/lib/interpretacao-ia";
import { useState } from "react";

export function useAutorizacaoIA(userId: string) {
  return useQuery({ queryKey: ["consentimento-ia", userId], queryFn: async () => {
    const { data, error } = await supabase.from("consentimentos_ia").select("versao").eq("user_id", userId).maybeSingle();
    if (error) throw new Error("Não foi possível conferir sua autorização.");
    return data?.versao === VERSAO_CONSENTIMENTO_IA;
  } });
}
export function AutorizacaoIA({ userId, disabled }: { userId: string; disabled?: boolean }) {
  const { data: autorizado, isPending, isError } = useAutorizacaoIA(userId);
  const qc = useQueryClient();
  const [salvando, setSalvando] = useState(false);
  async function alterar(ativo: boolean) {
    setSalvando(true);
    const { error } = ativo
      ? await supabase.from("consentimentos_ia").upsert({ user_id: userId, versao: VERSAO_CONSENTIMENTO_IA, autorizado_em: new Date().toISOString() })
      : await supabase.from("consentimentos_ia").delete().eq("user_id", userId);
    setSalvando(false);
    if (error) return void toast.error("Não foi possível atualizar a autorização.");
    await qc.invalidateQueries({ queryKey: ["consentimento-ia", userId] });
  }
  return <div className="my-4 border-y py-3">
    <label className="flex items-start gap-2 text-sm"><Checkbox aria-label="Autorizar interpretação por IA" checked={autorizado === true} disabled={disabled || isPending || isError || salvando} onCheckedChange={v => alterar(v === true)} />Interpretação por IA (opcional)</label>
    <p className="mt-2 text-xs text-muted-foreground">{TEXTO_CONSENTIMENTO_IA}</p>
    {isError && <p role="alert" className="mt-2 text-xs text-destructive">Não foi possível conferir a autorização. A interpretação local continua disponível.</p>}
  </div>;
}