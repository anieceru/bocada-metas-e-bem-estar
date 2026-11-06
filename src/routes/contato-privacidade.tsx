import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/LegalPage";
import { EMAIL_PRIVACIDADE } from "@/lib/config";

export const Route = createFileRoute("/contato-privacidade")({
  head: () => legalHead("Contato de privacidade", "Peça acesso, correção ou exclusão dos seus dados no Bocada."),
  component: () => (
    <LegalPage titulo="Contato de privacidade">
      <p>Para pedir acesso, correção ou exclusão dos seus dados pessoais (LGPD), escreva para:</p>
      <p className="text-base font-semibold">{EMAIL_PRIVACIDADE}</p>
      <p>Você também pode exportar ou excluir seus dados diretamente em Configurações.</p>
    </LegalPage>
  ),
});
