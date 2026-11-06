import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/LegalPage";

export const Route = createFileRoute("/termos")({
  head: () => legalHead("Termos de Uso", "Condições de uso do Bocada."),
  component: () => (
    <LegalPage titulo="Termos de Uso">
      <h2>Quem pode usar</h2>
      <p>O Bocada é destinado a maiores de 18 anos.</p>
      <h2>Natureza do serviço</h2>
      <p>O Bocada é um diário alimentar. Os valores exibidos são estimativas e não substituem orientação de nutricionista ou médico.</p>
      <h2>Fonte dos dados nutricionais</h2>
      <p>Tabela Brasileira de Composição de Alimentos (TACO), 4ª edição revisada e ampliada. NEPA/UNICAMP, Campinas, 2011. Dados normalizados por brolesi/taco (licença MIT).</p>
      <p>Industrializados: USDA FoodData Central, Global Branded Food Products Database, edição de 29 de outubro de 2026 (CC0/domínio público). Cerca de 450 mil produtos do mercado americano, com nomes e marcas originais e calorias, proteínas, carboidratos e gorduras disponíveis. Valores por 100 g fornecidos pelos fabricantes; receitas e rótulos podem variar entre países. Não há consulta externa ao buscar alimentos.</p>
      <h2>Sua conta</h2>
      <p>Você é responsável por manter sua senha em segurança. Pode excluir sua conta a qualquer momento em Configurações.</p>
      <h2>Alterações</h2>
      <p>Estes termos podem mudar; avisaremos sobre mudanças relevantes.</p>
    </LegalPage>
  ),
});
