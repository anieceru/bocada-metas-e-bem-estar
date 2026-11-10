// Regras de lembretes. Mensagens nunca incluem números ou dados de saúde,
// porque passam por serviços de entrega externos.
export type PrefsNotificacao = {
  modo: "nenhuma" | "diaria" | "personalizada";
  refeicoes: boolean;
  agua: boolean;
  alertas: boolean;
  hora_diaria: number;
  horas_refeicoes: Record<string, number>;
};
export const HORAS_AGUA = [10, 13, 16, 19];
export const HORAS_REFEICAO_PADRAO: Record<string, number> = { "Café da manhã": 8, "Almoço": 12, "Jantar": 19, "Lanches": 16 };
export type Lembrete = { chave: string; titulo: string; corpo: string; caminho: string };

export function lembretesDaHora(p: PrefsNotificacao, hora: number, dia: string, refeicoes: string[]): Lembrete[] {
  if (p.modo === "nenhuma") return [];
  if (p.modo === "diaria")
    return hora === p.hora_diaria ? [{ chave: `${dia}:diario`, titulo: "Bocada", corpo: "Quer registrar suas refeições de hoje?", caminho: "/hoje" }] : [];
  const out: Lembrete[] = [];
  if (p.refeicoes) for (const nome of refeicoes) {
    const h = p.horas_refeicoes[nome] ?? HORAS_REFEICAO_PADRAO[nome];
    if (h === hora) out.push({ chave: `${dia}:refeicao:${nome}`, titulo: nome, corpo: "Quando puder, registre o que comeu.", caminho: "/hoje" });
  }
  if (p.agua && HORAS_AGUA.includes(hora)) out.push({ chave: `${dia}:agua:${hora}`, titulo: "Água", corpo: "Um lembrete para beber água.", caminho: "/hoje" });
  return out;
}

/** Hora local (0–23) e data local AAAA-MM-DD num fuso horário. */
export function horaLocal(agora: Date, fuso: string) {
  let f = fuso;
  try { new Intl.DateTimeFormat("en-CA", { timeZone: f }); } catch { f = "America/Sao_Paulo"; }
  const partes = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: f, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(agora).map((x) => [x.type, x.value]));
  return { hora: Number(partes["hour"]), dia: `${partes["year"]}-${partes["month"]}-${partes["day"]}` };
}

export type Totais = Partial<Record<"kcal" | "carboidratos_g" | "proteinas_g" | "gorduras_g", number>>;
/** Metas do dia ultrapassadas pelo total registrado. */
export function metasUltrapassadas(totais: Totais, metas: Totais) {
  return (["kcal", "proteinas_g", "carboidratos_g", "gorduras_g"] as const).filter((k) => { const meta = metas[k]; return meta != null && meta > 0 && (totais[k] ?? 0) > meta; });
}