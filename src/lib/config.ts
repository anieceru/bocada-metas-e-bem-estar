// ===== Limites de "meta fora do usual" =====
// Calorias foram definidas pelo produto. Os demais são PROVISÓRIOS:
// ajuste aqui quando os valores definitivos forem decididos.
export const LIMITES_METAS = {
  kcal: { min: 1200, max: 4500, unidade: "kcal", nome: "Calorias" },
  carboidratos_g: { min: 50, max: 600, unidade: "g", nome: "Carboidratos" }, // PROVISÓRIO
  proteinas_g: { min: 30, max: 300, unidade: "g", nome: "Proteínas" }, // PROVISÓRIO
  gorduras_g: { min: 20, max: 200, unidade: "g", nome: "Gorduras" }, // PROVISÓRIO
  agua_ml: { min: 1000, max: 5000, unidade: "ml", nome: "Água" }, // PROVISÓRIO
} as const;

export type ChaveMeta = keyof typeof LIMITES_METAS;
export const CHAVES_METAS = Object.keys(LIMITES_METAS) as ChaveMeta[];
export type Metas = Record<ChaveMeta, number | null>;

export const SEGUNDOS_CONFIRMACAO = 5;

export function metasForaDoUsual(m: Partial<Metas>): ChaveMeta[] {
  return CHAVES_METAS.filter((k) => {
    const v = m[k];
    if (v == null) return false;
    return v < LIMITES_METAS[k].min || v > LIMITES_METAS[k].max;
  });
}

// Versão do texto de consentimento de dados de saúde. Mude ao alterar o texto.
export const VERSAO_CONSENTIMENTO = "2026-11-v1-rascunho";
export const TEXTO_CONSENTIMENTO =
  "Autorizo o Bocada a tratar meus dados de saúde (idade, peso, altura, sexo, objetivo e metas diárias) apenas para o funcionamento do app, conforme a Política de Privacidade. Posso retirar esta autorização a qualquer momento em Configurações.";

// E-mail de contato de privacidade (LGPD). PREENCHER.
export const EMAIL_PRIVACIDADE = "[preencher@seudominio.com.br]";

const COMUNS = new Set([
  "12345678", "123456789", "1234567890", "password", "password1", "senha123", "senha1234",
  "qwerty123", "qwertyui", "11111111", "00000000", "12341234", "abcd1234", "iloveyou",
  "admin123", "brasil123", "mudar123", "88888888", "87654321", "abc12345", "123123123",
  "princesa", "flamengo", "corinthians", "palmeiras", "senhasenha", "aaaaaaaa", "q1w2e3r4",
]);

export function validarSenha(s: string): string | null {
  if (s.length < 8) return "Use pelo menos 8 caracteres.";
  if (COMUNS.has(s.toLowerCase()) || /^(.)\1+$/.test(s))
    return "Essa senha é muito comum. Escolha outra.";
  return null;
}

export const OBJETIVOS = [
  { v: "emagrecer", l: "Emagrecer" },
  { v: "manter", l: "Manter o peso" },
  { v: "ganhar", l: "Ganhar peso" },
] as const;
