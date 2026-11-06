import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/LegalPage";
import { VERSAO_CONSENTIMENTO } from "@/lib/config";

export const Route = createFileRoute("/privacidade")({
  head: () => legalHead("Política de Privacidade", "Como o Bocada trata seus dados pessoais e de saúde."),
  component: () => (
    <LegalPage titulo="Política de Privacidade">
      <h2>Quais dados tratamos</h2>
      <p>E-mail e dados de acesso para sua conta. Com sua autorização específica: idade, peso, altura, sexo (opcional), objetivo e metas diárias. Preferências do app (tom, tema, tamanho do copo).</p>
      <h2>Dados de saúde (LGPD, art. 11)</h2>
      <p>Só guardamos dados de saúde com seu consentimento específico, registrado com data, hora e versão do texto (atual: {VERSAO_CONSENTIMENTO}). Você pode retirar a autorização em Configurações; os dados são apagados.</p>
      <h2>Para que usamos</h2>
      <p>Apenas para o funcionamento do app. Não vendemos dados nem os enviamos a ferramentas de análise de terceiros.</p>
      <h2>Cookies</h2>
      <p>Usamos apenas armazenamento essencial (sessão e preferência de tema). Recursos não essenciais só são ativados se você aceitar no aviso de cookies.</p>
      <h2>Seus direitos</h2>
      <p>Acesso, correção, exportação e exclusão. Exporte ou exclua sua conta em Configurações, ou fale conosco pela página de <Link to="/contato-privacidade" className="text-primary underline">contato de privacidade</Link>.</p>
      <h2>Segurança</h2>
      <p>Cada pessoa só acessa os próprios dados, com regras de acesso no banco de dados.</p>
    </LegalPage>
  ),
});
