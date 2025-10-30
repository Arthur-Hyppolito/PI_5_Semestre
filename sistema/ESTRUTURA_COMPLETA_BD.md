# 🗄️ Estrutura Completa do Banco de Dados - WaveSurf

**Data:** 30/10/2025 12:00 | **Versão:** 1.0 | **Status:** ✅ Operacional

---

## 📊 RESUMO EXECUTIVO

| Métrica | Quantidade |
|---------|------------|
| **Tabelas** | 14 |
| **Views** | 1 |
| **Índices** | 37 |
| **Triggers** | 5 |
| **Políticas RLS** | 32 |
| **Foreign Keys** | 13 |
| **Funções** | 12 |
| **Sequências** | 1 |

---

## 📋 TABELAS DO SISTEMA

### 1. `carrinho` - Carrinho Temporário (Legado)
- **11 campos** | **RLS:** ✅ | **Triggers:** 1
- Carrinho antigo com dados desnormalizados
- **FK:** user_id → auth.users

### 2. `carrinho_itens` - Carrinho Atual ⭐
- **7 campos** | **RLS:** ✅ | **Triggers:** 1 | **Índices:** 5
- Sistema atual de carrinho normalizado
- **FK:** user_id → auth.users, produto_id → produtos

### 3. `categorias` - Categorias de Produtos
- **5 campos** | **RLS:** ✅ | **Público:** SELECT
- Categorização de produtos

### 4. `clientes` - Usuários do Sistema ⭐
- **16 campos** | **RLS:** ✅ | **Triggers:** 1 | **Índices:** 7
- **33 registros** (6 admins, 27 clientes)
- **FK:** auth_user_id → auth.users

### 5. `cores` - Cores de Produtos
- **4 campos** | **RLS:** ✅ | **Público:** SELECT
- Tabela auxiliar de cores

### 6. `estados` - Estados Brasileiros
- **4 campos** | **RLS:** ✅ | **Público:** SELECT
- Tabela auxiliar geográfica

### 7. `fornecedores` - Fornecedores
- **9 campos** | **RLS:** ✅ | **Autenticado:** ALL
- Gestão de fornecedores

### 8. `historico_precos` - Auditoria de Preços
- **6 campos** | **RLS:** ✅ | **Autenticado:** ALL
- Rastreamento de alterações de preço
- **FK:** produto_id → produtos, user_id → auth.users

### 9. `movimentacoes_estoque` - Controle de Estoque ⭐
- **10 campos** | **RLS:** ✅ | **Triggers:** 1
- Entradas e saídas de estoque
- **FK:** produto_id → produtos, fornecedor_id → fornecedores

### 10. `paises` - Países
- **3 campos** | **RLS:** ✅ | **Público:** SELECT
- Tabela auxiliar geográfica

### 11. `produtos` - Catálogo de Produtos ⭐
- **21 campos** | **RLS:** ✅ | **Triggers:** 1 | **Índices:** 5
- Produtos simples e compostos
- **FK:** categoria_id, cor_id, unidade_id

### 12. `produtos_composicao` - Produtos Compostos
- **5 campos** | **RLS:** ✅
- Relacionamento pai-filho de produtos
- **FK:** produto_pai_id, produto_filho_id → produtos

### 13. `tabelas_auxiliares` - Configurações
- **3 campos** | **RLS:** ✅ | **Público:** SELECT
- Dados auxiliares do sistema

### 14. `unidades` - Unidades de Medida
- **5 campos** | **RLS:** ✅ | **Público:** SELECT
- KG, UN, L, etc.

---

## 🔐 POLÍTICAS RLS POR TABELA

### Tabelas Públicas (SELECT)
- categorias, cores, estados, paises, produtos, tabelas_auxiliares, unidades

### Tabelas com Controle de Usuário
- **carrinho:** 4 políticas (CRUD próprio)
- **carrinho_itens:** 4 políticas (CRUD próprio)
- **clientes:** 3 políticas (SELECT all, INSERT/UPDATE próprio)
- **movimentacoes_estoque:** 1 política (user_id)

### Tabelas Restritas (Authenticated)
- fornecedores, historico_precos, produtos_composicao

---

## 🔄 TRIGGERS ATIVOS

1. **update_carrinho_updated_at** - carrinho
2. **update_carrinho_itens_updated_at** - carrinho_itens
3. **update_clientes_updated_at** - clientes
4. **trigger_atualizar_estoque** - movimentacoes_estoque (AFTER INSERT)
5. **trigger_alteracao_preco** - produtos (BEFORE UPDATE)

---

## 🔗 RELACIONAMENTOS (Foreign Keys)

```
historico_precos → produtos
movimentacoes_estoque → produtos
movimentacoes_estoque → fornecedores
produtos → categorias
produtos → cores
produtos → unidades
produtos_composicao → produtos (pai e filho)
carrinho → auth.users
carrinho_itens → auth.users
clientes → auth.users
```

---

## 🔧 FUNÇÕES PRINCIPAIS

1. **adicionar_ao_carrinho** - Adiciona produto ao carrinho
2. **atualizar_quantidade_carrinho** - Atualiza quantidade
3. **limpar_carrinho** - Limpa carrinho do usuário
4. **remover_do_carrinho** - Remove item específico
5. **get_cart_total** - Calcula total do carrinho
6. **gerar_codigo_produto** - Gera código único
7. **obter_estoque_produto** - Consulta estoque
8. **atualizar_estoque** - Trigger de atualização
9. **registrar_alteracao_preco** - Trigger de histórico
10. **update_updated_at_column** - Trigger genérico

---

## 🔍 VIEW: `v_rls_status`

Monitora status do RLS em todas as tabelas:
- ✅ RLS configurado
- ❌ RLS sem políticas
- ⚠️ RLS desabilitado

---

## ⚠️ OBSERVAÇÕES IMPORTANTES

### Tabelas Sem Foreign Key Explícita
- `carrinho.produto_id` (text) - não referencia produtos
- `carrinho_itens.produto_id` - referência implícita

### Campos JSONB
- `clientes.endereco` - Armazena múltiplos endereços
- `clientes.preferencias` - Configurações do usuário

### Enums Customizados
- `movimentacoes_estoque.tipo_movimentacao` - ENTRADA/SAÍDA

### Sequências
- `seq_produto_codigo` - Gera códigos únicos para produtos

---

**Documento gerado em:** 30/10/2025 12:00 UTC-03:00  
**Próxima atualização:** Conforme necessidade
