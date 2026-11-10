import { describe, expect, it } from "vitest";
import { metasForaDoUsual, validarSenha } from "@/lib/config";

describe("regras do Bocada", () => {
  it("alerta calorias abaixo de 1200", () => {
    expect(metasForaDoUsual({ kcal: 1199 })).toEqual(["kcal"]);
  });
  it("alerta calorias acima de 4500", () => {
    expect(metasForaDoUsual({ kcal: 4501 })).toEqual(["kcal"]);
  });
  it("não alerta calorias entre 1200 e 4500", () => {
    expect(metasForaDoUsual({ kcal: 1200 })).toEqual([]);
    expect(metasForaDoUsual({ kcal: 4500 })).toEqual([]);
  });
  it("recusa senha com menos de 8 caracteres", () => {
    expect(validarSenha("abc1234")).not.toBeNull();
  });
  it("recusa senha comum", () => {
    expect(validarSenha("12345678")).not.toBeNull();
  });
  it("aceita senha razoável", () => {
    expect(validarSenha("feijao-com-arroz-77")).toBeNull();
  });
});

import { calcularMetas, ritmoSemanalG } from "@/lib/calculo-metas";
describe("calculadora de metas", () => {
  const base = { idade: 30, peso_kg: 70, altura_cm: 170, sexo: "feminino", atividade: "sedentario", objetivo: "manter" };
  it("usa Mifflin-St Jeor com fator sedentário 1,2", () => {
    const r = calcularMetas(base)!;
    expect(r.basal).toBe(1452); // 700 + 1062,5 - 150 - 161 = 1451,5
    expect(r.metas.kcal).toBe(1742);
  });
  it("emagrecer tira 500 kcal da manutenção", () => {
    expect(calcularMetas({ ...base, objetivo: "emagrecer" })!.metas.kcal).toBe(1242);
  });
  it("água é 35 ml por kg", () => {
    expect(calcularMetas(base)!.metas.agua_ml).toBe(2450);
  });
  it("sem atividade não calcula", () => {
    expect(calcularMetas({ ...base, atividade: null })).toBeNull();
  });
  it("500 kcal/dia abaixo ≈ 455 g por semana a menos", () => {
    expect(ritmoSemanalG(1500, 2000)).toBe(-455);
  });
});
