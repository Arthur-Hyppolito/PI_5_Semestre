# 📊 Detalhamento Completo das Tabelas - WaveSurf

**Data:** 30/10/2025 12:00 | **Versão:** 1.0

---

## 1. TABELA: `carrinho` (Legado)

### 📝 Descrição
Carrinho de compras temporário (versão antiga, substituída por `carrinho_itens`)

### 📊 Estrutura Completa

| # | Campo | Tipo | Tamanho | Nullable | Default | Descrição |
|---|-------|------|---------|----------|---------|-----------|
| 1 | id | uuid | - | NO | gen_random_uuid() | PK |
| 2 | user_id | uuid | - | NO | null | FK auth.users |
| 3 | produto_id | text | - | NO | null | ID produto (texto) |
| 4 | produto_nome | text | - | NO | null | Nome produto |
| 5 | produto_descricao | text | - | YES | null | Descrição |
| 6 | produto_preco | numeric | - | NO | null | Preço |
| 7 | produto_categoria | text | - | YES | null | Categoria |
| 8 | produto_imagem_url | text | - | YES | null | URL imagem |
| 9 | quantidade | integer | - | NO | 1 | Quantidade |
| 10 | created_at | timestamptz | - | YES | now() | Criação |
| 11 | updated_at | timestamptz | - | YES | now() | Atualização |

### 🔐 RLS: ✅ TRUE (4 políticas)
- Users can view own cart items (SELECT)
- Users can insert own cart items (INSERT)
- Users can update own cart items (UPDATE)
- Users can delete own cart items (DELETE)

### 🔄 Triggers: 1
- update_carrinho_updated_at (BEFORE UPDATE)

### 🔍 Índices: 2
- carrinho_pkey (UNIQUE - id)
- carrinho_user_id_produto_id_key (UNIQUE - user_id, produto_id)

---

## 2. TABELA: `carrinho_itens` ⭐

### 📝 Descrição
Sistema atual de carrinho de compras normalizado

### 📊 Estrutura Completa

| # | Campo | Tipo | Tamanho | Nullable | Default | Descrição |
|---|-------|------|---------|----------|---------|-----------|
| 1 | id | uuid | - | NO | gen_random_uuid() | PK |
| 2 | user_id | uuid | - | NO | null | FK auth.users |
| 3 | produto_id | uuid | - | NO | null | FK produtos |
| 4 | quantidade | integer | - | NO | 1 | Quantidade |
| 5 | preco_unitario | numeric | - | NO | null | Preço fixado |
| 6 | created_at | timestamptz | - | YES | now() | Criação |
| 7 | updated_at | timestamptz | - | YES | now() | Atualização |

### 🔐 RLS: ✅ TRUE (4 políticas)
- Usuários podem ver seus próprios itens (SELECT)
- Usuários podem inserir itens (INSERT)
- Usuários podem atualizar itens (UPDATE)
- Usuários podem deletar itens (DELETE)

### 🔄 Triggers: 1
- update_carrinho_itens_updated_at (BEFORE UPDATE)

### 🔍 Índices: 5
- carrinho_itens_pkey (UNIQUE - id)
- idx_carrinho_user_produto_unique (UNIQUE - user_id, produto_id)
- idx_carrinho_user_id (INDEX - user_id)
- idx_carrinho_produto_id (INDEX - produto_id)
- idx_carrinho_created_at (INDEX - created_at DESC)

### ✅ Constraints
- carrinho_itens_quantidade_check (quantidade > 0)

---

## 3. TABELA: `categorias`

### 📝 Descrição
Categorias de produtos do e-commerce

### 📊 Estrutura Completa

| # | Campo | Tipo | Tamanho | Nullable | Default | Descrição |
|---|-------|------|---------|----------|---------|-----------|
| 1 | id | uuid | - | NO | gen_random_uuid() | PK |
| 2 | nome | varchar | 255 | NO | null | Nome categoria |
| 3 | descricao | text | - | YES | null | Descrição |
| 4 | created_at | timestamptz | - | YES | now() | Criação |
| 5 | updated_at | timestamptz | - | YES | now() | Atualização |

### 🔐 RLS: ✅ TRUE (2 políticas)
- Categorias são visíveis publicamente (SELECT - public)
- Apenas autenticados podem modificar (ALL - authenticated)

---

## 4. TABELA: `clientes` ⭐

### 📝 Descrição
Perfis de usuários (clientes e administradores)

### 📊 Estrutura Completa

| # | Campo | Tipo | Tamanho | Nullable | Default | Descrição |
|---|-------|------|---------|----------|---------|-----------|
| 1 | id | uuid | - | NO | gen_random_uuid() | PK |
| 2 | auth_user_id | uuid | - | YES | null | FK auth.users |
| 3 | nome | varchar | 255 | NO | null | Nome |
| 4 | sobrenome | varchar | 255 | NO | null | Sobrenome |
| 5 | email | varchar | 255 | YES | null | Email |
| 6 | telefone | varchar | 20 | YES | null | Telefone |
| 7 | cpf | varchar | 14 | YES | null | CPF |
| 8 | data_nascimento | date | - | YES | null | Nascimento |
| 9 | genero | varchar | 20 | YES | null | Gênero |
| 10 | endereco | jsonb | - | YES | '{}'::jsonb | Endereços JSON |
| 11 | preferencias | jsonb | - | YES | '{}'::jsonb | Preferências JSON |
| 12 | tipo_usuario | varchar | 20 | YES | 'cliente' | cliente/admin |
| 13 | ativo | boolean | - | YES | true | Status |
| 14 | foto_perfil | text | - | YES | null | URL foto |
| 15 | created_at | timestamptz | - | YES | now() | Criação |
| 16 | updated_at | timestamptz | - | YES | now() | Atualização |

### 🔐 RLS: ✅ TRUE (3 políticas)
- clientes_select_policy (SELECT - true para authenticated)
- Permitir criação de perfil (INSERT - auth.uid() = auth_user_id)
- Usuários podem atualizar próprios dados (UPDATE)

### 🔄 Triggers: 1
- update_clientes_updated_at (BEFORE UPDATE)

### 🔍 Índices: 7
- clientes_pkey (UNIQUE - id)
- clientes_auth_user_id_key (UNIQUE - auth_user_id)
- idx_clientes_auth_user_id (INDEX)
- idx_clientes_tipo_usuario (INDEX)
- idx_clientes_ativo (INDEX)
- idx_clientes_nome (INDEX)
- idx_clientes_cpf (INDEX)

### 📊 Estatísticas
- Total: 33 registros
- Admins: 6
- Clientes: 27
- Ativos: 33

---

## 5. TABELA: `cores`

### 📊 Estrutura Completa

| # | Campo | Tipo | Tamanho | Nullable | Default | Descrição |
|---|-------|------|---------|----------|---------|-----------|
| 1 | id | uuid | - | NO | gen_random_uuid() | PK |
| 2 | codigo | varchar | 4 | NO | null | Código cor |
| 3 | nome | varchar | 30 | NO | null | Nome cor |
| 4 | created_at | timestamptz | - | YES | now() | Criação |

### 🔐 RLS: ✅ TRUE (2 políticas)
- Público: SELECT
- Autenticado: ALL

### 🔍 Índices: 2
- cores_pkey (UNIQUE - id)
- cores_codigo_key (UNIQUE - codigo)

---

## 6. TABELA: `estados`

### 📊 Estrutura Completa

| # | Campo | Tipo | Tamanho | Nullable | Default | Descrição |
|---|-------|------|---------|----------|---------|-----------|
| 1 | id | uuid | - | NO | gen_random_uuid() | PK |
| 2 | codigo | varchar | 4 | NO | null | Código |
| 3 | nome | varchar | 50 | NO | null | Nome estado |
| 4 | uf | varchar | 2 | NO | null | Sigla UF |

### 🔐 RLS: ✅ TRUE (2 políticas)
- Público: SELECT
- Autenticado: ALL

---

## 7. TABELA: `fornecedores`

### 📊 Estrutura Completa

| # | Campo | Tipo | Tamanho | Nullable | Default | Descrição |
|---|-------|------|---------|----------|---------|-----------|
| 1 | id | uuid | - | NO | gen_random_uuid() | PK |
| 2 | nome | varchar | 255 | NO | null | Nome |
| 3 | cnpj | varchar | 14 | NO | null | CNPJ |
| 4 | contato | varchar | 255 | YES | null | Contato |
| 5 | endereco | text | - | YES | null | Endereço |
| 6 | email | varchar | 255 | YES | null | Email |
| 7 | telefone | varchar | 20 | YES | null | Telefone |
| 8 | created_at | timestamptz | - | YES | now() | Criação |
| 9 | updated_at | timestamptz | - | YES | now() | Atualização |

### 🔐 RLS: ✅ TRUE (2 políticas)
- Autenticado: SELECT
- Autenticado: ALL

### 🔍 Índices: 2
- fornecedores_pkey (UNIQUE - id)
- fornecedores_cnpj_key (UNIQUE - cnpj)

---

## 8. TABELA: `historico_precos`

### 📊 Estrutura Completa

| # | Campo | Tipo | Tamanho | Nullable | Default | Descrição |
|---|-------|------|---------|----------|---------|-----------|
| 1 | id | uuid | - | NO | gen_random_uuid() | PK |
| 2 | produto_id | uuid | - | YES | null | FK produtos |
| 3 | preco_anterior | numeric | - | NO | null | Preço antigo |
| 4 | preco_novo | numeric | - | NO | null | Preço novo |
| 5 | data_alteracao | timestamptz | - | YES | now() | Data |
| 6 | user_id | uuid | - | YES | null | Usuário |

### 🔗 Foreign Keys: 2
- produto_id → produtos(id)
- user_id → auth.users(id)

### 🔐 RLS: ✅ TRUE (2 políticas)
- Autenticado: SELECT
- Autenticado: ALL

### 🔍 Índices: 2
- historico_precos_pkey (UNIQUE - id)
- idx_historico_produto (INDEX - produto_id)

---

## 9. TABELA: `movimentacoes_estoque` ⭐

### 📊 Estrutura Completa

| # | Campo | Tipo | Tamanho | Nullable | Default | Descrição |
|---|-------|------|---------|----------|---------|-----------|
| 1 | id | uuid | - | NO | gen_random_uuid() | PK |
| 2 | produto_id | uuid | - | YES | null | FK produtos |
| 3 | tipo_movimentacao | USER-DEFINED | - | NO | null | ENTRADA/SAÍDA |
| 4 | quantidade | integer | - | NO | null | Quantidade |
| 5 | data_movimentacao | timestamptz | - | YES | now() | Data |
| 6 | fornecedor_id | uuid | - | YES | null | FK fornecedores |
| 7 | nota_fiscal | varchar | 50 | YES | null | NF |
| 8 | valor_unitario | numeric | - | NO | null | Valor |
| 9 | user_id | uuid | - | YES | null | Usuário |
| 10 | created_at | timestamptz | - | YES | now() | Criação |

### 🔗 Foreign Keys: 3
- produto_id → produtos(id)
- fornecedor_id → fornecedores(id)
- user_id → auth.users(id)

### 🔐 RLS: ✅ TRUE (1 política)
- Controle por usuário (ALL - auth.uid() = user_id)

### 🔄 Triggers: 1
- trigger_atualizar_estoque (AFTER INSERT)

### 🔍 Índices: 3
- movimentacoes_estoque_pkey (UNIQUE - id)
- idx_movimentacoes_produto (INDEX - produto_id)
- idx_movimentacoes_fornecedor (INDEX - fornecedor_id)

---

## 10. TABELA: `paises`

### 📊 Estrutura Completa

| # | Campo | Tipo | Tamanho | Nullable | Default | Descrição |
|---|-------|------|---------|----------|---------|-----------|
| 1 | id | uuid | - | NO | gen_random_uuid() | PK |
| 2 | codigo | varchar | 4 | NO | null | Código |
| 3 | nome | varchar | 50 | NO | null | Nome país |

### 🔐 RLS: ✅ TRUE (2 políticas)
- Público: SELECT
- Autenticado: ALL

---

## 11. TABELA: `produtos` ⭐

### 📊 Estrutura Completa

| # | Campo | Tipo | Tamanho | Nullable | Default | Descrição |
|---|-------|------|---------|----------|---------|-----------|
| 1 | id | uuid | - | NO | gen_random_uuid() | PK |
| 2 | nome | varchar | 255 | NO | null | Nome |
| 3 | descricao | text | - | YES | null | Descrição |
| 4 | preco_unitario | numeric | - | NO | null | Preço |
| 5 | quantidade_estoque | integer | - | NO | 0 | Estoque |
| 6 | status | boolean | - | YES | true | Ativo |
| 7 | categoria_id | uuid | - | YES | null | FK categorias |
| 8 | imagem_url | text | - | YES | null | Imagem |
| 9 | created_at | timestamptz | - | YES | now() | Criação |
| 10 | updated_at | timestamptz | - | YES | now() | Atualização |
| 11 | cor_id | uuid | - | YES | null | FK cores |
| 12 | unidade_id | uuid | - | YES | null | FK unidades |
| 13 | produto_simples | boolean | - | YES | true | Simples/Composto |
| 14 | qtd_entrada_total | integer | - | YES | 0 | Total entradas |
| 15 | qtd_saida_total | integer | - | YES | 0 | Total saídas |
| 16 | qtd_original | integer | - | YES | 0 | Qtd original |
| 17 | data_ultima_entrada | date | - | YES | null | Data entrada |
| 18 | hora_ultima_entrada | time | - | YES | null | Hora entrada |
| 19 | data_ultima_saida | date | - | YES | null | Data saída |
| 20 | hora_ultima_saida | time | - | YES | null | Hora saída |
| 21 | codigo_produto | varchar | 8 | YES | null | Código único |

### 🔗 Foreign Keys: 3
- categoria_id → categorias(id)
- cor_id → cores(id)
- unidade_id → unidades(id)

### 🔐 RLS: ✅ TRUE (2 políticas)
- Público: SELECT
- Autenticado: ALL

### 🔄 Triggers: 1
- trigger_alteracao_preco (BEFORE UPDATE)

### 🔍 Índices: 5
- produtos_pkey (UNIQUE - id)
- produtos_codigo_produto_key (UNIQUE - codigo_produto)
- idx_produtos_categoria (INDEX - categoria_id)
- idx_produtos_cor (INDEX - cor_id)
- idx_produtos_unidade (INDEX - unidade_id)

---

## 12. TABELA: `produtos_composicao`

### 📊 Estrutura Completa

| # | Campo | Tipo | Tamanho | Nullable | Default | Descrição |
|---|-------|------|---------|----------|---------|-----------|
| 1 | id | uuid | - | NO | gen_random_uuid() | PK |
| 2 | produto_pai_id | uuid | - | YES | null | FK produtos (pai) |
| 3 | produto_filho_id | uuid | - | YES | null | FK produtos (filho) |
| 4 | quantidade | integer | - | NO | null | Qtd filho no pai |
| 5 | created_at | timestamptz | - | YES | now() | Criação |

### 🔗 Foreign Keys: 2
- produto_pai_id → produtos(id)
- produto_filho_id → produtos(id)

### 🔐 RLS: ✅ TRUE (2 políticas)
- Autenticado: SELECT
- Autenticado: ALL

---

## 13. TABELA: `tabelas_auxiliares`

### 📊 Estrutura Completa

| # | Campo | Tipo | Tamanho | Nullable | Default | Descrição |
|---|-------|------|---------|----------|---------|-----------|
| 1 | codigo | varchar | 2 | NO | null | PK - Código |
| 2 | nome | varchar | 30 | NO | null | Nome |
| 3 | descricao | text | - | YES | null | Descrição |

### 🔐 RLS: ✅ TRUE (2 políticas)
- Público: SELECT
- Autenticado: ALL

---

## 14. TABELA: `unidades`

### 📊 Estrutura Completa

| # | Campo | Tipo | Tamanho | Nullable | Default | Descrição |
|---|-------|------|---------|----------|---------|-----------|
| 1 | id | uuid | - | NO | gen_random_uuid() | PK |
| 2 | codigo | varchar | 4 | NO | null | Código |
| 3 | nome | varchar | 30 | NO | null | Nome |
| 4 | sigla | varchar | 10 | YES | null | Sigla (KG, UN) |
| 5 | created_at | timestamptz | - | YES | now() | Criação |

### 🔐 RLS: ✅ TRUE (2 políticas)
- Público: SELECT
- Autenticado: ALL

### 🔍 Índices: 2
- unidades_pkey (UNIQUE - id)
- unidades_codigo_key (UNIQUE - codigo)

---

**Documento gerado em:** 30/10/2025 12:00 UTC-03:00
