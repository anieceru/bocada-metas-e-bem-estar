import { z } from "zod";
import { mencionaRefeicao, normalizar } from "./diario";

export const VERSAO_CONSENTIMENTO_IA = "2026-11-10-v1";
export function podeInterpretarIA(consentimentoSaude: string | null | undefined, versaoIA: string | null | undefined) {
  return !!consentimentoSaude && versaoIA === VERSAO_CONSENTIMENTO_IA;
}
export const TEXTO_CONSENTIMENTO_IA = "Autorizo enviar somente a descrição que eu digitar ou ditar a um modelo de IA da OpenAI, pelo AI Gateway, para identificar alimentos, quantidades e refeições. Peso, idade, metas e histórico não serão enviados. Posso retirar esta autorização aqui a qualquer momento; sem ela, continuo usando a interpretação local.";
export const entradaInterpretacao = z.object({ frase: z.string().trim().min(1).max(2000), refeicao: z.string().min(1).max(60) });
const itemIA = z.object({ alimento: z.string().trim().min(1).max(150), marca: z.string().max(100).nullable(), quantidade: z.number().positive().max(5000).nullable(), unidade: z.enum(["g", "ml", "unidade", "colher de chá", "colher de sopa", "xícara", "copo", "fatia"]).nullable(), gramas: z.number().positive().max(5000).nullable(), refeicao: z.enum(["Café da manhã", "Almoço", "Jantar", "Lanches"]).nullable() });
export const saidaInterpretacao = z.object({ itens: z.array(itemIA).max(30) });
export type ItemInterpretado = { termo: string; gramas: number | null; refeicao: string; quantidadeOriginal?: string; medidaOriginal?: string; unidades?: number; medida?: string };
export function converterInterpretacao(valor: unknown, refeicao: string, frase?: string): ItemInterpretado[] {
  // Sem refeição dita na fala, vale a escolhida na tela; o modelo não pode adivinhar.
  const confiarRefeicao = frase === undefined || mencionaRefeicao(frase);
  return saidaInterpretacao.parse(valor).itens.filter(it => !["ne", "ah", "hum", "eh", "ue", "tipo", "almoco", "cafe da manha", "jantar", "lanche", "lanches"].includes(normalizar(it.alimento))).map(it => ({
    termo: normalizar(it.alimento === "leite integral" ? "leite" : it.alimento) + (it.marca ? ` marca ${normalizar(it.marca)}` : ""),
    gramas: it.unidade === "g" || it.unidade === "ml" ? it.quantidade : it.gramas,
    refeicao: (confiarRefeicao ? it.refeicao : null) ?? refeicao,
    ...(it.unidade === "unidade" && it.quantidade ? { unidades: it.quantidade, medida: "unidade" } : {}),
    ...(it.quantidade && it.unidade ? { quantidadeOriginal: `${it.quantidade} ${it.unidade}` } : {}),
  }));
}