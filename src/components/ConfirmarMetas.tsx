import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { LIMITES_METAS, SEGUNDOS_CONFIRMACAO, type ChaveMeta, type Metas } from "@/lib/config";

export function ConfirmarMetas({
  aberto,
  chaves,
  metas,
  onCancelar,
  onConfirmar,
}: {
  aberto: boolean;
  chaves: ChaveMeta[];
  metas: Partial<Metas>;
  onCancelar: () => void;
  onConfirmar: () => void;
}) {
  const [restante, setRestante] = useState(SEGUNDOS_CONFIRMACAO);
  useEffect(() => {
    if (!aberto) return;
    setRestante(SEGUNDOS_CONFIRMACAO);
    const id = setInterval(() => setRestante((r) => (r > 0 ? r - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [aberto]);

  return (
    <AlertDialog open={aberto} onOpenChange={(o) => !o && onCancelar()}>
      <AlertDialogContent className="max-w-sm rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-estado-estimativa" aria-hidden />
            Confira antes de salvar
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm">
              <p>Algumas metas estão fora da faixa mais comum:</p>
              <ul className="list-disc pl-5">
                {chaves.map((k) => {
                  const l = LIMITES_METAS[k];
                  return (
                    <li key={k}>
                      {l.nome}: {metas[k]} {l.unidade} (faixa comum: {l.min}–{l.max} {l.unidade})
                    </li>
                  );
                })}
              </ul>
              <p>Se é isso mesmo, tudo bem. Se tiver dúvida, vale conversar com um nutricionista ou médico.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Revisar</AlertDialogCancel>
          <Button disabled={restante > 0} onClick={onConfirmar}>
            {restante > 0 ? `Confirmar (${restante}s)` : "Confirmar metas"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
