import { describe, expect, it } from "vitest";
import { horaLocal, lembretesDaHora, metasUltrapassadas, type PrefsNotificacao } from "@/lib/notificacoes";

const base: PrefsNotificacao = { modo: "personalizada", refeicoes: true, agua: true, alertas: true, hora_diaria: 20, horas_refeicoes: { "Café da manhã": 8 } };
const refeicoes = ["Café da manhã", "Almoço"];

describe("lembretes", () => {
  it("não envia nada quando a pessoa não quer notificações", () => {
    expect(lembretesDaHora({ ...base, modo: "nenhuma" }, 8, "2026-11-10", refeicoes)).toEqual([]);
  });
  it("envia só o lembrete diário no horário escolhido", () => {
    expect(lembretesDaHora({ ...base, modo: "diaria" }, 20, "2026-11-10", refeicoes).map((l) => l.chave)).toEqual(["2026-11-10:diario"]);
    expect(lembretesDaHora({ ...base, modo: "diaria" }, 8, "2026-11-10", refeicoes)).toEqual([]);
  });
  it("envia lembretes das refeições e da água marcados", () => {
    expect(lembretesDaHora(base, 8, "2026-11-10", refeicoes).map((l) => l.titulo)).toEqual(["Café da manhã"]);
    expect(lembretesDaHora(base, 13, "2026-11-10", refeicoes).map((l) => l.titulo)).toEqual(["Água"]);
    expect(lembretesDaHora({ ...base, agua: false }, 13, "2026-11-10", refeicoes)).toEqual([]);
  });
  it("não inclui números nas mensagens", () => {
    expect(lembretesDaHora(base, 8, "2026-11-10", refeicoes).every((l) => !/\d/.test(l.corpo))).toBe(true);
  });
  it("usa o horário local da pessoa", () => {
    expect(horaLocal(new Date("2026-11-10T11:00:00Z"), "America/Sao_Paulo")).toEqual({ hora: 8, dia: "2026-11-10" });
  });
  it("alerta quando passa da meta do dia", () => {
    expect(metasUltrapassadas({ kcal: 2100, proteinas_g: 80 }, { kcal: 2000, proteinas_g: 100 })).toEqual(["kcal"]);
    expect(metasUltrapassadas({ kcal: 2000 }, { kcal: 2000 })).toEqual([]);
  });
});