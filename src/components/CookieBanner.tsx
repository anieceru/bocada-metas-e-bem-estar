import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

const KEY = "bocada-cookies";

/** Hoje o app só usa armazenamento essencial (sessão e preferência de tema).
 * Qualquer ferramenta não essencial futura deve checar cookiesNaoEssenciaisAceitos(). */
export function cookiesNaoEssenciaisAceitos() {
  return typeof window !== "undefined" && localStorage.getItem(KEY) === "aceito";
}

export function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => setShow(!localStorage.getItem(KEY)), []);
  if (!show) return null;
  const set = (v: string) => {
    localStorage.setItem(KEY, v);
    setShow(false);
  };
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
      <div className="mx-auto max-w-md rounded-2xl border bg-popover p-4 text-popover-foreground shadow-lg">
        <p className="text-sm">
          Usamos apenas o essencial para o app funcionar. Cookies não essenciais só são usados se
          você aceitar.{" "}
          <Link to="/privacidade" className="font-medium text-primary underline">
            Saiba mais
          </Link>
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => set("recusado")}
            className="flex-1 rounded-xl border border-input px-3 py-2 text-sm font-semibold"
          >
            Recusar não essenciais
          </button>
          <button
            onClick={() => set("aceito")}
            className="flex-1 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
