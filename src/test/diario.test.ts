import { describe, expect, it } from "vitest";
import { calcularNutrientes, dividirItens, interpretarFrase, interpretarItem, referenciaAlimento } from "@/lib/diario";
import { limitesEfetivos, metasForaDoUsual } from "@/lib/config";

describe("diário", () => {
  it.each([["no almoço", "Almoço"], ["no café da manhã", "Café da manhã"], ["no lanche", "Lanches"], ["no jantar", "Jantar"]])("atribui alimentos à refeição %s", (fala, destino) => {
    expect(interpretarFrase(`${fala} comi 150 g de arroz, né`, "Lanches")).toEqual([{ termo: "arroz", gramas: 150, refeicao: destino }]);
  });
  it("mantém refeições distintas na mesma frase", () => {
    expect(interpretarFrase("no café da manhã tomei leite e no almoço comi arroz", "Jantar")).toEqual([{ termo: "leite", gramas: null, refeicao: "Café da manhã" }, { termo: "arroz", gramas: null, refeicao: "Almoço" }]);
  });
  it("reconhece a refeição no fim da frase", () => {
    expect(interpretarFrase("comi arroz no almoço", "Jantar")[0]?.refeicao).toBe("Almoço");
  });
  it("reconhece a refeição no início da fala, sem preposição, sem buscá-la como alimento", () => {
    expect(interpretarFrase("café da manhã um copo de leite", "Lanches")).toEqual([{ termo: "leite", gramas: 200, refeicao: "Café da manhã", medidaOriginal: "um copo" }]);
  });
  it("converte medidas caseiras em gramas usando o copo da pessoa", () => {
    expect(interpretarItem("um copo de leite", { copoMl: 250 })).toEqual({ termo: "leite", gramas: 250, medidaOriginal: "um copo" });
    expect(interpretarItem("duas colheres de sopa de açúcar")).toEqual({ termo: "acucar", gramas: 30, medidaOriginal: "duas colheres de sopa" });
  });
  it.each(["no almoço", "no café da manhã", "no lanche", "no jantar"])("não procura %s como alimento", (refeicao) => {
    expect(dividirItens(`${refeicao} comi 150 g de arroz`).map(item => interpretarItem(item)).filter(p => p.termo)).toEqual([{ termo: "arroz", gramas: 150 }]);
  });
  it("ignora né e ne como marcas da fala, sem sugerir nêspera", () => {
    expect(dividirItens("arroz, né, feijão, ne").map(item => interpretarItem(item)).filter(p => p.termo).map(p => p.termo)).toEqual(["arroz", "feijao"]);
    expect(interpretarItem("nêspera").termo).toBe("nespera");
  });
  it("mantém a referência USDA separada da TACO ao registrar", () => {
    const a = { id: 123456, descricao: "Produto USDA", kcal: 400, proteina_g: 10, lipideos_g: 20, carboidrato_g: 45, fonte: "usda" as const };
    expect(referenciaAlimento(a)).toEqual({ alimento_id: null, usda_fdc_id: 123456, br_ean: null });
    expect(calcularNutrientes(a, 25)).toEqual({ kcal: 100, proteinas_g: 2.5, gorduras_g: 5, carboidratos_g: 11.3 });
  });
  it("preserva a referência TACO dos alimentos existentes", () => {
    expect(referenciaAlimento({ id: 1, descricao: "Arroz", kcal: 128, proteina_g: 2.5, lipideos_g: 0.2, carboidrato_g: 28 })).toEqual({ alimento_id: 1, usda_fdc_id: null, br_ean: null });
  });
  it("mantém a referência de produto brasileiro separada das demais", () => {
    expect(referenciaAlimento({ id: 7622210592729, descricao: "Biscoito recheado", kcal: 480, proteina_g: 5, lipideos_g: 19, carboidrato_g: 70, fonte: "br" })).toEqual({ alimento_id: null, usda_fdc_id: null, br_ean: 7622210592729 });
  });
  it.each(["no lanche da tarde", "no lanche da manhã"])("atribui %s a Lanches, sem buscar a refeição como alimento", (fala) => {
    expect(interpretarFrase(`${fala} comi 30 g de bolacha`, "Café da manhã")).toEqual([{ termo: "bolacha", gramas: 30, refeicao: "Lanches" }]);
  });
  it("divide a fala em itens", () => {
    expect(dividirItens("150 gramas de arroz, feijão e uma banana")).toEqual(["150 gramas de arroz", "feijao", "uma banana"]);
  });
  it("separa frases, retoma o café sem duplicá-lo e inclui açúcar e cuscuz", () => {
    expect(dividirItens("leite. café. café tinha açúcar. cuscuz. queijo minas marca ipanema.").map(item => interpretarItem(item)).map(p => p.termo)).toEqual(["leite", "cafe", "acucar", "cuscuz", "queijo minas marca ipanema"]);
  });
  it("não separa a vírgula decimal da quantidade", () => {
    expect(dividirItens("150,5 g de cuscuz, café").map(item => interpretarItem(item))[0]).toEqual({ termo: "cuscuz", gramas: 150.5 });
  });
  it("extrai gramas e termo", () => {
    expect(interpretarItem("150 gramas de arroz")).toEqual({ termo: "arroz", gramas: 150 });
    expect(interpretarItem("uma banana")).toEqual({ termo: "banana", gramas: null, unidades: 1, medida: "unidade" });
  });
  it("calcula nutrientes proporcionais aos gramas", () => {
    const a = { id: 1, descricao: "x", kcal: 128, proteina_g: 2.5, lipideos_g: 0.2, carboidrato_g: 28 };
    expect(calcularNutrientes(a, 150).kcal).toBe(192);
  });
  it("usa limites personalizados de proteína", () => {
    const l = limitesEfetivos({ proteinas_g: { min: 100, max: 150 } });
    expect(metasForaDoUsual({ proteinas_g: 90 }, l)).toEqual(["proteinas_g"]);
  });
  it("não permite alterar o limite de calorias", () => {
    expect(limitesEfetivos({ kcal: { min: 500, max: 900 } }).kcal).toEqual({ min: 1200, max: 4500 });
  });
});
