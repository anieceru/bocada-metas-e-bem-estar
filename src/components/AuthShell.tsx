import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto max-w-sm">
        <Link to="/" className="text-2xl font-bold tracking-tight text-primary">
          Bocada
        </Link>
        <h1 className="mt-8 text-2xl font-bold">{title}</h1>
        <div className="mt-6">{children}</div>
        <nav className="mt-10 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <Link to="/privacidade" className="underline">Privacidade</Link>
          <Link to="/termos" className="underline">Termos de Uso</Link>
          <Link to="/contato-privacidade" className="underline">Contato de privacidade</Link>
        </nav>
      </div>
    </div>
  );
}

/** Limite local de tentativas (complementa os limites do servidor de autenticação). */
export function cooldownRestante(chave: string): number {
  const raw = localStorage.getItem(`bocada-rl-${chave}`);
  if (!raw) return 0;
  const { ate } = JSON.parse(raw) as { n: number; ate: number };
  return Math.max(0, Math.ceil((ate - Date.now()) / 1000));
}
export function registrarFalha(chave: string) {
  const raw = localStorage.getItem(`bocada-rl-${chave}`);
  const n = (raw ? (JSON.parse(raw) as { n: number }).n : 0) + 1;
  const espera = n >= 3 ? Math.min(300, 15 * 2 ** (n - 3)) : 0;
  localStorage.setItem(`bocada-rl-${chave}`, JSON.stringify({ n, ate: Date.now() + espera * 1000 }));
}
export function limparFalhas(chave: string) {
  localStorage.removeItem(`bocada-rl-${chave}`);
}

export function GoogleIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.730-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.930-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
  );
}
