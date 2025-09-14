# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não Lançado]

### Adicionado

#### 🔐 **Sistema de Logout Robusto (v2.0)**
- **Função `performLogout()`**: Nova implementação completa de logout no Supabase
  - Logout global (remove sessão de todos os dispositivos)
  - Limpeza completa de localStorage e sessionStorage
  - Tratamento de erros robusto com fallbacks
  - Retorno estruturado com sucesso/erro
- **Proteção contra Múltiplos Cliques**: Prevenção de execução simultânea
- **Feedback Visual**: Estados de loading ("Saindo...") durante o processo
- **Toast Notifications**: Mensagens claras de sucesso/erro
- **Redirecionamento Seguro**: Navegação apropriada após logout
- **Reload Forçado**: Garantia de limpeza completa da aplicação
- **Implementação Dupla**: Header (redireciona para home) e Backoffice (redireciona para login)

#### 🛒 **Sistema de Carrinho de Compras**
- **CartContext**: Gerenciamento de estado global do carrinho com React Context
- **Persistência**: Carrinho salvo no localStorage para manter itens entre sessões
- **Validação de Estoque**: Impede adicionar mais itens do que disponível
- **Notificações**: Toast messages para feedback do usuário
- **Cálculos Automáticos**: Total do carrinho e contagem de itens em tempo real

#### 📄 **Páginas Dedicadas com Sidebar**
- **Página do Carrinho** (`/carrinho`): Interface completa para gerenciar itens
  - Visualização detalhada dos produtos com imagens
  - Controles de quantidade (+/-) com validação de estoque
  - Resumo do pedido com totais e informações de frete
  - Estado vazio com call-to-action para continuar comprando
- **Página de Pedidos** (`/pedidos`): Histórico de compras do usuário
  - Listagem de pedidos com status coloridos
  - Detalhes de cada pedido e breakdown de itens
  - Ações contextuais (ver detalhes, comprar novamente, cancelar)
- **Página de Perfil Atualizada** (`/perfil`): Integrada com nova sidebar

#### 🧭 **Sidebar de Navegação**
- **Design Consistente**: Navegação lateral unificada para todas as páginas do usuário
- **Itens de Navegação**:
  - Voltar à Loja (Home) - Retorna à página inicial
  - Perfil (User) - Gerenciar informações pessoais
  - Carrinho (ShoppingCart) - Com badge de quantidade de itens
  - Pedidos (Package) - Histórico de compras
- **Indicação Visual**: Página ativa destacada com cores do tema
- **Responsiva**: Adaptável para diferentes tamanhos de tela

#### 🛍️ **Funcionalidades de E-commerce**
- **Botões "Adicionar ao Carrinho"**: Em todos os produtos da página principal
- **Ícone do Carrinho**: No header com badge mostrando quantidade de itens
- **Navegação por Link**: Ícone do carrinho direciona para página dedicada
- **Gerenciamento Completo**: Adicionar, remover, alterar quantidades
- **Estados Visuais**: Feedback visual para produtos no carrinho e esgotados

### Alterado
- **Header**: Removida funcionalidade de drawer, ícone do carrinho agora navega para página
- **Produtos**: Adicionados botões de adicionar ao carrinho com validação de estoque
- **Roteamento**: Novas rotas `/carrinho` e `/pedidos` adicionadas ao App.tsx
- **Layout**: Páginas do usuário agora seguem padrão consistente com sidebar

### Técnico
- **Componentes Criados**:
  - `CartContext.tsx` - Context para gerenciamento de estado do carrinho
  - `CartIcon.tsx` - Ícone do carrinho com badge de quantidade
  - `CartDrawer.tsx` - Componente de drawer (substituído por página dedicada)
  - `Sidebar.tsx` - Navegação lateral para páginas do usuário
  - `CartPage.tsx` - Página completa do carrinho
  - `OrdersPage.tsx` - Página de histórico de pedidos
- **Hooks Personalizados**: `useCart()` para acesso ao contexto do carrinho
- **Persistência**: localStorage para manter carrinho entre sessões do navegador

## [1.0.0] - 2024-12-09

### Adicionado

#### 🏗️ **Arquitetura e Configuração**
- Configuração inicial do projeto com Vite + React + TypeScript
- Integração com Supabase para backend e autenticação
- Configuração do Tailwind CSS com tema personalizado para surf shop
- Estrutura de componentes reutilizáveis com shadcn/ui
- Sistema de roteamento com React Router DOM
- Configuração de ESLint e TypeScript para qualidade de código

#### 🎨 **Interface do Usuário**
- **Header**: Navegação responsiva com menu mobile
- **Hero Section**: Seção principal com call-to-action atrativo
- **About**: Seção "Quem Somos" com estatísticas da empresa
- **Products**: Catálogo de produtos com filtros e categorias
- **Services**: Apresentação dos serviços oferecidos
- **Footer**: Rodapé completo com informações de contato

#### 🔐 **Sistema de Autenticação**
- Registro de usuários com validação de dados
- Login seguro com Supabase Auth
- Recuperação de senha
- Perfis de usuário com metadados personalizados
- Sistema de roles (cliente/admin)

#### 💾 **Banco de Dados**
- **Tabela Clientes**: Gestão completa de perfis de clientes
  - Dados pessoais (nome, sobrenome, telefone, CPF)
  - Informações adicionais (data nascimento, gênero, endereço)
  - Foto de perfil
  - Tipo de usuário
- **Sistema de Triggers**: Criação automática de perfil após registro
- **RLS (Row Level Security)**: Segurança de dados por usuário
- **Movimentações**: Sistema para tracking de atividades

#### 🛠️ **Funcionalidades Técnicas**
- **React Query**: Gerenciamento de estado e cache
- **React Hook Form**: Formulários com validação
- **Zod**: Validação de schemas
- **Date-fns**: Manipulação de datas
- **Lucide React**: Ícones modernos
- **Recharts**: Gráficos e visualizações
- **Sonner**: Sistema de notificações toast

#### 📱 **Responsividade**
- Design mobile-first
- Breakpoints otimizados para todos os dispositivos
- Componentes adaptativos
- Menu mobile com animações suaves

#### 🎯 **Recursos Específicos do Negócio**
- Catálogo de produtos de surf
- Sistema de categorias (pranchas, acessórios, roupas)
- Apresentação de serviços (aulas, reparos, aluguel)
- Estatísticas da empresa (anos de experiência, clientes satisfeitos)
- Tema visual inspirado no oceano e surf

### 📋 **Scripts de Configuração Incluídos**
- `SETUP_DATABASE.md`: Guia completo de configuração do banco
- `SETUP_CLIENTES.md`: Configuração específica da tabela clientes
- `SETUP_MOVIMENTACOES.md`: Sistema de movimentações
- `CRIAR_USUARIO_ADMIN.sql`: Script para criar usuário administrador
- `VERIFICAR_DADOS_CLIENTE.sql`: Scripts de verificação e debug

### 🔧 **Ferramentas de Desenvolvimento**
- Scripts de build para desenvolvimento e produção
- Preview local com Vite
- Linting automático
- Suporte a TypeScript strict mode
- Hot reload para desenvolvimento ágil

### 📚 **Documentação**
- README completo com instruções de instalação
- Documentação de fluxo de dados
- Guias de debug para login e registro
- Documentação de configuração do Supabase

## [0.1.0] - 2024-11-XX

### Adicionado
- Configuração inicial do projeto
- Estrutura básica de componentes
- Integração inicial com Supabase

---

## Tipos de Mudanças
- `Adicionado` para novas funcionalidades
- `Alterado` para mudanças em funcionalidades existentes
- `Descontinuado` para funcionalidades que serão removidas
- `Removido` para funcionalidades removidas
- `Corrigido` para correções de bugs
- `Segurança` para vulnerabilidades corrigidas

## Links
- [Projeto no Lovable](https://lovable.dev/projects/93ae584c-03a3-4382-a471-89d98284cb44)
- [Repositório](https://github.com/jamelao011/wave-craft-cms)
