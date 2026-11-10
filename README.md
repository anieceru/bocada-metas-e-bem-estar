# Bocada — Metas e Bem-Estar

**Status:** Em desenvolvimento. Este documento descreve os requisitos e funcionalidades planejadas para o Bocada. Nem todos os recursos estão necessariamente implementados ou validados.

## Sobre o projeto

O **Bocada** é um aplicativo web mobile-first de diário alimentar, com proposta de registro por voz.

O objetivo é permitir que a pessoa relate verbalmente o que comeu e que a inteligência artificial identifique os alimentos, quantidades, calorias e macronutrientes, registrando essas informações automaticamente.

A proposta é oferecer uma experiência rápida, acessível e sem julgamentos sobre alimentação.

**Nesta primeira etapa**, o foco está na estrutura do produto: autenticação, onboarding, configurações, metas, privacidade e segurança. O registro alimentar por voz será desenvolvido posteriormente.

## Stack tecnológica

- React + TypeScript
- Tailwind CSS
- Supabase: autenticação, banco de dados e Row Level Security (RLS)
- PWA: aplicativo web progressivo, instalável em dispositivos móveis

## Identidade visual e experiência

**Tipografia:** Inter (alternativa: Carlito), aplicada em todo o aplicativo.

**Cores da marca:**
- Azul principal: `#2F6BEA`
- Laranja âmbar: `#F4A62A`

**Temas:**
- Modo claro
- Modo escuro
- Modo sistema, seguindo a preferência do dispositivo

As cores devem ser organizadas em tokens ou variáveis CSS, com versões claras e escuras e contraste adequado ao padrão WCAG AA.

**Tom de comunicação:** leve, neutro e acolhedor. O aplicativo não deve utilizar linguagem moralizante ou julgadora sobre alimentos, alimentação ou pessoas.

## Escopo de desenvolvimento — Etapa 1

### 1. Autenticação

- Cadastro e login com e-mail e senha.
- Login com Google.
- Recuperação de senha por e-mail.
- Confirmação obrigatória de e-mail.
- Rotas protegidas para usuários autenticados.

### 2. Onboarding

Após o primeiro login, apresentar telas curtas para configuração inicial:

- Idade: obrigatória, com bloqueio de menores de 18 anos.
- Peso (kg) e altura (cm): opcionais.
- Sexo: opcional.
- Objetivo: emagrecer, manter ou ganhar peso.
- Tom de comunicação: neutro ou um pouco mais animado.
- Metas diárias manuais: calorias, carboidratos, proteínas, gorduras e água.

A pessoa poderá pular o preenchimento das metas e editar todas as informações posteriormente.

Não calcular nem sugerir metas automaticamente nesta etapa.

A idade só poderá ser armazenada no perfil mediante consentimento específico para tratamento de dados de saúde.

### 3. Configurações

Permitir a edição de:

- Dados do perfil.
- Objetivo e tom de comunicação.
- Metas diárias.
- Tamanho do copo de água, com padrão de 200 ml.
- Tema: claro, escuro ou sistema.

Metas muito fora dos limites usuais deverão apresentar um aviso neutro e exigir confirmação após cinco segundos.

Limites definidos para calorias:
- Abaixo de 1.200 kcal.
- Acima de 4.500 kcal.

Os limites provisórios das demais metas deverão ficar centralizados em configurações ajustáveis no código.

Também deverão existir:

- Exportação de dados em JSON ou CSV.
- Exclusão de conta mediante confirmação.
- Retirada do consentimento para tratamento de dados de saúde, com exclusão dos respectivos campos.
- Aviso de que os valores apresentados são estimativas e não substituem orientação profissional.

### 4. Tela inicial

A tela Hoje deverá apresentar:

- Nome Bocada.
- Data atual.
- Estado vazio com a mensagem: "Em breve você vai poder falar o que comeu e eu registro por você."
- Metas diárias configuradas, quando existentes.

Não implementar botão de microfone funcional nesta etapa.

Navegação inferior:
- Hoje.
- Histórico.
- Configurações.

O Histórico permanecerá vazio até a implementação do diário alimentar.

### 5. Páginas e avisos

Implementar:

- Página 404 personalizada.
- Página genérica de erro.
- Banner de cookies com opções para aceitar ou recusar cookies não essenciais.
- Política de Privacidade.
- Termos de Uso.
- Página de Contato de Privacidade.

Política de Privacidade e Termos de Uso deverão conter textos provisórios identificados como rascunhos, sujeitos à revisão jurídica.

O contato de privacidade deverá possuir um campo para preenchimento do e-mail responsável por receber solicitações de acesso, correção e exclusão de dados.

## Segurança e privacidade

O Bocada poderá tratar dados pessoais sensíveis referentes à saúde. A implementação deverá observar a LGPD e os princípios de necessidade, transparência, segurança e consentimento.

### Autenticação e senhas

- Confirmação de e-mail obrigatória.
- Senhas com pelo menos oito caracteres.
- Bloqueio de senhas comuns.
- Proteção contra senhas vazadas do Supabase, quando disponível no plano.
- Limitação de tentativas de login e recuperação de senha.
- Mensagens neutras que não revelem se determinado e-mail está cadastrado.

### Consentimento para dados de saúde

- Solicitar consentimento específico em caixa separada e desmarcada por padrão.
- Apresentar link para a Política de Privacidade.
- Registrar data, hora e versão do texto aceito.
- Permitir retirada do consentimento nas Configurações.
- Apagar os campos de saúde quando o consentimento for retirado.
- Permitir utilização do aplicativo sem armazenamento desses dados quando não houver consentimento.

A verificação de idade mínima deverá acontecer antes da solicitação do consentimento.

### Proteção de dados

- Não incluir dados de saúde em logs, mensagens de erro ou ferramentas de análise de terceiros.
- Não carregar rastreadores não essenciais antes do consentimento correspondente.
- Aplicar RLS em todas as tabelas.
- Garantir que cada usuário só possa acessar e alterar os próprios registros.
- Manter chaves secretas exclusivamente em variáveis de ambiente protegidas ou funções de servidor/edge.
- Nunca publicar credenciais secretas no código do navegador ou no repositório.

Ao final da etapa, executar a verificação de segurança do Lovable, quando disponível, e corrigir os problemas identificados.

## Banco de dados — Supabase

Criar apenas as tabelas necessárias nesta etapa.

### Tabela `profiles`

Campos previstos:

- `id`: igual ao ID do usuário autenticado.
- `idade`: armazenada somente mediante consentimento.
- `peso_kg`.
- `altura_cm`.
- `sexo`: opcional.
- `objetivo`.
- `tom`.
- `tema`.
- `copo_ml`.
- `consentimento_saude`: registro de data, hora e versão do texto aceito.
- `criado_em`.
- `atualizado_em`.

### Tabela `metas`

Campos previstos:

- `id`.
- `user_id`.
- `kcal`.
- `carboidratos_g`.
- `proteinas_g`.
- `gorduras_g`.
- `agua_ml`.
- `atualizado_em`.

### Segurança do banco

- RLS habilitado em todas as tabelas.
- Políticas de leitura e alteração restritas ao proprietário dos registros.
- Nenhuma tabela criada sem políticas de acesso.
- Nenhuma política pública ou permissiva mantida em produção.

## Fora do escopo da Etapa 1

Não implementar nem simular:

- Diário alimentar.
- Gravação ou transcrição de voz.
- Inteligência artificial para reconhecimento de alimentos.
- Base de alimentos (TACO, Open Food Facts, USDA).
- Leitura de código de barras.
- Registro por fotografia.
- Memória de medidas.
- Registro de consumo de água.
- Gráficos e relatórios de consumo.
- Importação de dados do MyFitnessPal.
- Cálculo ou sugestão automática de metas.

Essas funcionalidades pertencem a etapas posteriores.

## Critérios de aceitação

A Etapa 1 será considerada concluída quando:

1. Cadastro, login, logout e recuperação de senha funcionarem.
2. Login por Google estiver funcional.
3. Menores de 18 anos não conseguirem concluir o cadastro.
4. O onboarding permitir configurar e salvar os dados previstos.
5. A idade só for armazenada mediante consentimento.
6. As informações forem editáveis em Configurações.
7. Metas fora dos limites apresentarem aviso e confirmação após cinco segundos.
8. Os temas claro e escuro funcionarem corretamente.
9. A tipografia Inter estiver aplicada globalmente.
10. Exportação e exclusão de conta funcionarem.
11. A confirmação de e-mail for obrigatória.
12. Senhas fracas forem recusadas e tentativas repetidas forem limitadas.
13. O consentimento for registrado com data, hora e versão.
14. A retirada do consentimento provocar a exclusão dos campos correspondentes.
15. Mensagens de autenticação não revelarem a existência de contas.
16. Dados de saúde não forem enviados a logs ou ferramentas de terceiros.
17. Testes com duas contas confirmarem o isolamento dos dados por RLS.
18. Páginas 404, erro, cookies, privacidade e termos estiverem disponíveis.
19. Nenhuma tela apresentar dados fictícios ou funcionalidades inexistentes.
20. A verificação de segurança do Lovable for executada e os problemas identificados forem tratados.

## Desenvolvimento local

O projeto utiliza Node.js e npm.

Para executar localmente:

```bash
git clone <URL-DO-REPOSITORIO>
cd <NOME-DO-REPOSITORIO>
npm install
npm run dev
```

Para trabalhar localmente, é necessário configurar as variáveis de ambiente exigidas pelo projeto.

### Variáveis de ambiente

As credenciais devem ser configuradas em arquivos locais de ambiente, conforme a estrutura do projeto.

Exemplo de nomes de variáveis:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Não preencher esses campos com credenciais reais no README.

**Importante:** variáveis com prefixo `VITE_` ficam acessíveis no navegador. Portanto, somente informações públicas, como a URL do projeto e a chave publicável do Supabase, podem ser utilizadas dessa forma. Service role keys, tokens privados e outros segredos devem permanecer exclusivamente no servidor ou em Edge Functions.

O arquivo `.env` deve permanecer fora do versionamento por meio do `.gitignore`.

## Repositório e continuidade do projeto

O desenvolvimento é realizado com [Lovable](https://lovable.dev), com sincronização do código com o GitHub.

**Editor do projeto:**
https://lovable.dev/projects/cc072f61-4a5b-4aaf-ab9c-8f299c1de27a

O GitHub é utilizado para versionamento, histórico de alterações, documentação e preservação do código-fonte.

As alterações realizadas no Lovable são sincronizadas com o repositório conectado.

## Licenciamento

O projeto ainda não possui uma licença de código aberto definida. A ausência de uma licença não concede automaticamente permissões de reutilização, modificação ou redistribuição do código.
````
