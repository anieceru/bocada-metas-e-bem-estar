import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { entradaInterpretacao, podeInterpretarIA } from "./interpretacao-ia";

export const interpretarDescricaoIA = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => entradaInterpretacao.parse(d))
  .handler(async ({ data, context }) => {
    const [{ data: consentimento, error }, { data: perfil }] = await Promise.all([
      context.supabase.from("consentimentos_ia").select("versao").eq("user_id", context.userId).maybeSingle(),
      context.supabase.from("profiles").select("consentimento_saude_em").eq("id", context.userId).maybeSingle(),
    ]);
    if (error || !podeInterpretarIA(perfil?.consentimento_saude_em, consentimento?.versao)) return { itens: [], erro: "Autorize separadamente a interpretação por IA antes de enviar a descrição." };
    const { interpretarComModelo } = await import("./interpretacao-ia.server");
    return interpretarComModelo(data.frase, data.refeicao);
  });