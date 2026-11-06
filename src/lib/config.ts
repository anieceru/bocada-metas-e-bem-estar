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

export function metasForaDoUsual(
  m: Partial<Metas>,
  limites: Record<ChaveMeta, { min: number; max: number }> = LIMITES_METAS,
): ChaveMeta[] {
  return CHAVES_METAS.filter((k) => {
    const v = m[k];
    if (v == null) return false;
    return v < limites[k].min || v > limites[k].max;
  });
}

// Versão do texto de consentimento de dados de saúde. Mude ao alterar o texto.
export const VERSAO_CONSENTIMENTO = "2026-11-v2-rascunho";
export const TEXTO_CONSENTIMENTO =
  "Autorizo o Bocada a tratar meus dados de saúde (idade, peso, altura, sexo, objetivo, metas diárias e refeições registradas) apenas para o funcionamento do app, conforme a Política de Privacidade. Posso retirar esta autorização a qualquer momento em Configurações.";

// ===== Limites personalizados (cada pessoa ajusta os de macros e água) =====
export type Limites = Record<ChaveMeta, { min: number; max: number }>;
export const CHAVES_LIMITES_AJUSTAVEIS = ["carboidratos_g", "proteinas_g", "gorduras_g", "agua_ml"] as const;

export function limitesEfetivos(personalizados: unknown): Limites {
  const base = Object.fromEntries(
    CHAVES_METAS.map((k) => [k, { min: LIMITES_METAS[k].min, max: LIMITES_METAS[k].max }]),
  ) as Limites;
  if (personalizados && typeof personalizados === "object") {
    for (const k of CHAVES_LIMITES_AJUSTAVEIS) {
      const v = (personalizados as Record<string, { min?: unknown; max?: unknown }>)[k];
      if (v && typeof v.min === "number" && typeof v.max === "number" && v.min < v.max)
        base[k] = { min: v.min, max: v.max };
    }
  }
  return base;
}

// E-mail de contato de privacidade (LGPD).
export const EMAIL_PRIVACIDADE = "4niec0@gmail.com";

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
