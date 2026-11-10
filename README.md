# Bocada: Metas e Bem-Estar

# Prompt inicial para o Lovable: Bocada, Etapa 1 (base do app)

Esta é só a **Etapa 1**. As próximas etapas (diário, IA, voz, código de barras) virão em prompts separados.

---

## Contexto

Estou construindo o **Bocada**, um app web mobile-first (instalável como PWA) de diário alimentar. Na versão completa, a pessoa **fala** o que comeu e a IA registra alimentos, quantidades, calorias e macros automaticamente, sem digitar nem apertar botão de enviar.

**Nesta etapa quero apenas a base do produto:** conta, perfil, metas digitadas, visual, páginas legais e uma tela inicial vazia. **Não implemente IA, voz, código de barras, diário alimentar nem dados de exemplo ainda.** Não simule funcionalidades que não existem.

Idioma da interface: **português do Brasil**.

## Stack

- React + TypeScript + Tailwind
- Supabase: autenticação, banco de dados e Row Level Security
- PWA mobile-first (funciona bem em tela de celular; no desktop pode ser uma coluna centralizada)

## Design

**Tipografia:** use **Inter** (alternativa aceita: **Carlito**). Uma única família no app inteiro.

**Cores (marca):**
- **Azul** como cor principal (botões primários, links, foco).
- **Laranja amarelado** (tom quente, puxando para o âmbar) como cor de destaque.
- Sugestão de partida, ajuste se ficar melhor: azul `#2F6BEA`, laranja amarelado `#F4A62A`.

**Modo escuro obrigatório:**
- Seguir a preferência do sistema por padrão e ter um **alternador manual** (claro, escuro, sistema) em Configurações.
- Definir todas as cores como **tokens/variáveis CSS** (fundo, superfície, texto, borda, primária, destaque) com versões clara e escura. Nada de cores fixas espalhadas pelos componentes.
- Garantir **contraste suficiente** (padrão WCAG AA) nos dois modos.

**Cores de estado (usadas nas próximas etapas, já crie os tokens):**
- `estado-estimativa` (laranja), `estado-confirmada` (azul), `estado-memoria` (verde).
- Como a marca também usa azul e laranja, escolha para esses três **tons claramente diferentes dos botões da marca** e acompanhe cada cor de um **ícone ou rótulo**, para não depender só da cor (acessibilidade para daltonismo).

**Tom e estilo:** leve, acolhedor, rápido. Textos curtos e **neutros**. Nunca julgar comida nem pessoa. Evitar palavras como "pecado", "trapaça", "estourou". Sem emojis em excesso.

## O que construir nesta etapa

### 1. Autenticação
- Cadastro e login com **e-mail e senha** e **login com Google**.
- Recuperação de senha por e-mail.
- Rotas protegidas: sem login, a pessoa só vê login, cadastro e páginas legais.

### 2. Onboarding (logo após o primeiro login)
Perguntar, em poucas telas curtas:
- **Idade** (obrigatória). **Bloquear cadastro de menores de 18 anos** com uma mensagem gentil e neutra. A checagem de 18+ acontece **antes** do consentimento de dados de saúde, e a idade só é guardada no perfil se a pessoa consentir.
- **Peso** (kg) e **altura** (cm).
- **Sexo** (opcional; texto explicando que serve só para sugerir metas no futuro).
- **Objetivo:** emagrecer, manter ou ganhar peso.
- **Tom do app:** neutro (padrão) ou um pouco mais animado.
- **Metas diárias digitadas à mão:** calorias (kcal), carboidratos (g), proteínas (g), gorduras (g) e água (ml). Todas podem ser preenchidas depois; há botão "Pular por enquanto".
- Tudo isso precisa ser **editável depois** em Configurações.
- Não calcule nem sugira metas automaticamente nesta etapa.

### 3. Configurações
- Editar perfil (idade, peso, altura, sexo, objetivo, tom).
- Editar metas diárias.
- **Se a pessoa digitar uma meta muito fora do usual**, mostrar um **aviso claro e neutro** e um botão de confirmação que **só fica habilitado depois de 5 segundos**, para evitar mudança por impulso. O app não impede, apenas pede confirmação consciente.
  - **Calorias:** alerta abaixo de 1.200 kcal ou acima de 4.500 kcal.
  - **Carboidratos, proteínas, gorduras e água:** os limites ainda não foram definidos. Use valores provisórios, fáceis de ajustar depois, e deixe claro no código onde estão.
- Tamanho do copo de água (padrão **200 ml**, editável).
- Tema: claro, escuro ou sistema.
- **Exportar meus dados** (arquivo JSON ou CSV) e **Excluir minha conta** (com confirmação), conforme a LGPD.

### 4. Tela inicial (placeholder)
- Cabeçalho com o nome **Bocada** e a data de hoje.
- Estado vazio amigável: "Em breve você vai poder falar o que comeu e eu registro por você." (sem botão de microfone funcionando ainda).
- Mostrar as **metas do dia** definidas, se existirem (apenas os valores configurados, sem dados de consumo).
- Navegação inferior simples com: **Hoje**, **Histórico** (vazio por enquanto) e **Configurações**.

### 5. Páginas e avisos obrigatórios
- Página **404** personalizada e página de erro genérica, ambas com tom neutro e botão para voltar ao início.
- **Banner de cookies** (aceitar / recusar o que não for essencial).
- Páginas de **Política de Privacidade** e **Termos de Uso** com texto provisório claramente marcado como rascunho a ser revisado.
- Aviso curto em Configurações: os valores do app são estimativas e não substituem orientação de nutricionista ou médico.

## Segurança e privacidade (obrigatório nesta etapa)

Os dados deste app (peso, altura, idade, objetivo, metas, hábitos alimentares) são **dados pessoais de saúde**. Trate com cuidado desde o início:

- **Confirmação de e-mail** obrigatória antes de usar o app.
- **Regras de senha:** mínimo de 8 caracteres, sem aceitar senhas muito comuns. Ativar a proteção contra senhas vazadas do Supabase, se o plano permitir.
- **Limite de tentativas de login e de recuperação de senha** (rate limit), com mensagem neutra que **não revele se um e-mail existe ou não** no sistema.
- **Consentimento específico para dados de saúde:** no onboarding, uma caixa **separada e desmarcada por padrão** pedindo autorização para tratar **peso, altura, idade, objetivo e metas diárias**, com link para a Política de Privacidade. Registrar **data, hora e versão do texto** aceito. A pessoa pode **retirar o consentimento** em Configurações (e, nesse caso, apagar esses campos). Sem consentimento, o app deve funcionar sem guardar esses dados.
- **Coletar o mínimo necessário:** sexo é opcional, peso e altura podem ser pulados.
- **Nada de dados de saúde em logs, mensagens de erro ou ferramentas de análise de terceiros.** Não incluir rastreadores de terceiros além dos essenciais, e só carregar os não essenciais depois do consentimento no banner de cookies.
- **Todas as chamadas ao banco passam pelas regras de RLS;** nenhuma tabela criada sem política de acesso. Se alguma política ficar aberta para teste, avisar claramente.
- **Chaves e segredos** apenas em variáveis de ambiente do servidor/edge functions. Nada no código do navegador nem no repositório.
- Rodar a **verificação de segurança do Lovable** (se disponível) ao fim da etapa e corrigir o que ela apontar.
- Página de **Contato de privacidade** com um e-mail para a pessoa pedir acesso, correção ou exclusão dos próprios dados (LGPD). Deixar o e-mail como campo a preencher.

## Banco de dados (Supabase)

Crie apenas o necessário para esta etapa:
- `profiles`: id (igual ao id do usuário), idade (guardada somente com consentimento), peso_kg, altura_cm, sexo (opcional), objetivo, tom, tema, copo_ml, consentimento_saude (data, hora e versão do texto), criado_em, atualizado_em.
- `metas`: id, user_id, kcal, carboidratos_g, proteinas_g, gorduras_g, agua_ml, atualizado_em.

**Segurança:** ative **Row Level Security** em todas as tabelas. Cada pessoa só lê e altera as **próprias** linhas. Nenhuma chave secreta no código do navegador.

## Fora do escopo desta etapa

Não implemente nem simule: diário alimentar, voz, transcrição, IA, base de alimentos (TACO, Open Food Facts, USDA), código de barras, foto, memória de medidas, água registrada, gráficos, importação do MyFitnessPal, sugestão automática de metas.

## Critérios de aceitação

- Consigo me cadastrar, entrar, sair e recuperar senha, com e-mail e com Google.
- Menor de 18 anos não consegue concluir o cadastro.
- O onboarding salva idade, peso, altura, objetivo, tom e metas, e tudo aparece editável em Configurações.
- A idade só é guardada se a pessoa consentir com o tratamento de dados de saúde.
- Meta fora do usual mostra o aviso e só deixa confirmar depois de 5 segundos.
- Modo claro e escuro funcionam, com alternador manual, e todas as telas ficam legíveis nos dois.
- Fonte Inter (ou Carlito) aplicada em todo o app.
- Exportar dados e excluir conta funcionam.
- Não consigo entrar sem confirmar o e-mail. Senhas fracas são recusadas. Tentativas repetidas de login são limitadas.
- O consentimento de dados de saúde aparece em caixa separada, desmarcada, fica registrado com data e versão, e posso retirá-lo em Configurações.
- Mensagens de login e de recuperação de senha não revelam se um e-mail está cadastrado.
- Não há dados de saúde em logs nem em ferramentas de terceiros.
- Uma pessoa não consegue ver nem alterar dados de outra (testar com duas contas).
- 404, banner de cookies, Política de Privacidade e Termos de Uso existem.
- Nenhuma tela mostra dados falsos ou funcionalidade que ainda não existe.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cc072f61-4a5b-4aaf-ab9c-8f299c1de27a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
