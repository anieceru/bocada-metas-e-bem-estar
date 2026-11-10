import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { validarRefeicoes } from "@/lib/calendario";

export function EditarRefeicoes({ nomes, userId, onClose }: { nomes: string[]; userId: string; onClose: () => void }) {
  const [lista, setLista] = useState(nomes);
  const [salvando, setSalvando] = useState(false);
  const qc = useQueryClient();
  async function salvar() {
    if (!validarRefeicoes(lista)) return;
    setSalvando(true);
    const { error } = await supabase.from("profiles").update({ refeicoes: lista.map((n) => n.trim()) }).eq("id", userId);
    setSalvando(false);
    if (error) return void toast.error("Não foi possível salvar as refeições.");
    await qc.invalidateQueries({ queryKey: ["perfil"] });
    onClose();
  }
  return <div className="space-y-3 py-4">
    <p className="text-sm text-muted-foreground">Os registros anteriores mantêm a refeição em que foram salvos.</p>
    {lista.map((nome, i) => <div key={i} className="flex gap-2">
      <Input aria-label={`Nome da refeição ${i + 1}`} maxLength={60} value={nome} onChange={(e) => setLista(lista.map((n, j) => i === j ? e.target.value : n))} />
      <Button variant="ghost" size="icon" aria-label={`Remover refeição ${i + 1}`} onClick={() => setLista(lista.filter((_, j) => i !== j))}><Trash2 className="h-4 w-4" /></Button>
    </div>)}
    <Button variant="outline" onClick={() => setLista([...lista, ""])}><Plus className="h-4 w-4" />Adicionar refeição</Button>
    {!validarRefeicoes(lista) && <p role="alert" className="text-sm text-destructive">Use nomes diferentes e mantenha pelo menos uma refeição.</p>}
    <Button className="w-full" disabled={salvando || !validarRefeicoes(lista)} onClick={salvar}>{salvando ? "Salvando…" : "Salvar refeições"}</Button>
  </div>;
}