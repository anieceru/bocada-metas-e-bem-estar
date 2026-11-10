import { hojeISO } from "@/lib/diario";

export const REFEICOES_PADRAO = ["Café da manhã", "Almoço", "Jantar", "Lanches"];
export function dataValida(valor: unknown): valor is string {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const data = new Date(`${valor}T12:00:00`);
  return Number.isFinite(data.getTime()) && hojeISO(data) === valor;
}
export function diasSemana(dia: string) {
  const data = new Date(`${dia}T12:00:00`);
  data.setDate(data.getDate() - ((data.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(data); d.setDate(d.getDate() + i); return hojeISO(d);
  });
}
export function ajustarDia(dia: string, delta: number) {
  const d = new Date(`${dia}T12:00:00`); d.setDate(d.getDate() + delta); return hojeISO(d);
}
export function validarRefeicoes(nomes: string[]) {
  const valores = nomes.map((n) => n.trim());
  return valores.length > 0 && valores.every((n) => n.length > 0 && n.length <= 60) && new Set(valores.map((n) => n.toLocaleLowerCase("pt-BR"))).size === valores.length;
}