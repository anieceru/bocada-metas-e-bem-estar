import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarDays, History, Settings } from "lucide-react";

export function AppShell({ children, titulo }: { children: ReactNode; titulo?: string }) {
  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col">
        <header className="px-5 pb-3 pt-6">
          <p className="text-xl font-bold tracking-tight text-primary">Bocada</p>
          <p className="text-sm capitalize text-muted-foreground">{titulo ?? hoje}</p>
        </header>
        <main className="flex-1 px-5 pb-28">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-surface pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto grid max-w-md grid-cols-3">
            {[
              { to: "/hoje", l: "Hoje", I: CalendarDays },
              { to: "/historico", l: "Histórico", I: History },
              { to: "/configuracoes", l: "Configurações", I: Settings },
            ].map(({ to, l, I }) => (
              <Link
                key={to}
                to={to}
                className="flex flex-col items-center gap-1 py-2.5 text-xs font-medium text-muted-foreground"
                activeProps={{ className: "text-primary" }}
              >
                <I className="h-5 w-5" aria-hidden />
                {l}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
