# 🗄️ Documentação do Esquema do Banco de Dados

## 📋 Visão Geral

Este documento descreve a estrutura completa do banco de dados Supabase (PostgreSQL) utilizado no projeto WaveSurf CMS.

**Última Atualização**: 13/09/2024  
**Versão do Schema**: 1.0  
**Ambiente**: Supabase PostgreSQL

---

## 📊 Tabelas Principais

### 1. `produtos`

Armazena informações dos produtos da loja de surf.

```sql
CREATE TABLE produtos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nome text NOT NULL,
    descricao text,
    preco numeric NOT NULL,
    quantidade integer NOT NULL DEFAULT 0,
    categoria text,
    imagem_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

#### Campos:
- **id**: Identificador único (UUID)
- **nome**: Nome do produto (obrigatório)
- **descricao**: Descrição detalhada do produto
- **preco**: Preço do produto (decimal)
- **quantidade**: Quantidade em estoque (inteiro, padrão 0)
- **categoria**: Categoria do produto (ex: "Pranchas", "Acessórios")
- **imagem_url**: URL da imagem do produto
- **created_at**: Data/hora de criação (automático)
- **updated_at**: Data/hora da última atualização (automático)

#### Índices:
- Primary key em `id`
- Índice em `categoria` para filtros
- Índice em `created_at` para ordenação

---

### 2. `clientes`

Armazena informações dos clientes/usuários do sistema.

```sql
CREATE TABLE clientes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    nome text NOT NULL,
    sobrenome text,
    telefone text,
    data_nascimento date,
    genero text,
    endereco jsonb,
    preferencias jsonb,
    tipo_usuario text DEFAULT 'cliente',
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

#### Campos:
- **id**: Identificador único (UUID)
- **auth_user_id**: Referência ao usuário do Supabase Auth
- **nome**: Nome do cliente (obrigatório)
- **sobrenome**: Sobrenome do cliente
- **telefone**: Número de telefone
- **data_nascimento**: Data de nascimento
- **genero**: Gênero do cliente
- **endereco**: Endereço completo (JSON)
- **preferencias**: Preferências do cliente (JSON)
- **tipo_usuario**: Tipo de usuário ('cliente' ou 'admin')
- **ativo**: Status ativo/inativo
- **created_at**: Data/hora de criação (automático)
- **updated_at**: Data/hora da última atualização (automático)

#### Relacionamentos:
- `auth_user_id` → `auth.users(id)` (Foreign Key com CASCADE DELETE)

#### Índices:
- Primary key em `id`
- Índice único em `auth_user_id`
- Índice em `tipo_usuario` para filtros de role
- Índice em `ativo` para filtros de status

---

### 3. `movimentacoes_estoque`

Registra todas as movimentações de entrada e saída do estoque.

```sql
CREATE TABLE movimentacoes_estoque (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    produto_id uuid REFERENCES produtos(id) ON DELETE CASCADE,
    produto_nome text NOT NULL,
    tipo text NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    quantidade integer NOT NULL CHECK (quantidade > 0),
    motivo text,
    observacoes text,
    usuario text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
```

#### Campos:
- **id**: Identificador único (UUID)
- **produto_id**: Referência ao produto movimentado
- **produto_nome**: Nome do produto (desnormalizado para histórico)
- **tipo**: Tipo de movimentação ('entrada' ou 'saida')
- **quantidade**: Quantidade movimentada (positivo)
- **motivo**: Motivo da movimentação
- **observacoes**: Observações adicionais
- **usuario**: Email/identificação do usuário responsável
- **created_at**: Data/hora da movimentação (automático)

#### Relacionamentos:
- `produto_id` → `produtos(id)` (Foreign Key com CASCADE DELETE)

#### Constraints:
- `tipo` deve ser 'entrada' ou 'saida'
- `quantidade` deve ser maior que 0

#### Índices:
- Primary key em `id`
- Índice em `produto_id` para consultas por produto
- Índice em `tipo` para filtros
- Índice em `created_at` para ordenação cronológica
- Índice em `usuario` para auditoria

---

## 🔐 Segurança e Permissões

### Row Level Security (RLS)

Todas as tabelas têm RLS habilitado para garantir que usuários só acessem dados apropriados.

#### Políticas para `produtos`:
```sql
-- Leitura: todos os usuários autenticados
CREATE POLICY "Produtos são visíveis para usuários autenticados" 
ON produtos FOR SELECT 
TO authenticated 
USING (true);

-- Escrita: apenas admins
CREATE POLICY "Apenas admins podem modificar produtos" 
ON produtos FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM clientes 
        WHERE auth_user_id = auth.uid() 
        AND tipo_usuario = 'admin'
    )
);
```

#### Políticas para `clientes`:
```sql
-- Usuários podem ver apenas seus próprios dados
CREATE POLICY "Usuários podem ver seus próprios dados" 
ON clientes FOR SELECT 
TO authenticated 
USING (auth_user_id = auth.uid());

-- Admins podem ver todos os clientes
CREATE POLICY "Admins podem ver todos os clientes" 
ON clientes FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM clientes 
        WHERE auth_user_id = auth.uid() 
        AND tipo_usuario = 'admin'
    )
);
```

#### Políticas para `movimentacoes_estoque`:
```sql
-- Apenas admins podem ver movimentações
CREATE POLICY "Apenas admins podem ver movimentações" 
ON movimentacoes_estoque FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM clientes 
        WHERE auth_user_id = auth.uid() 
        AND tipo_usuario = 'admin'
    )
);
```

---

## ⚡ Triggers e Funções

### Trigger para atualização automática de timestamps

```sql
-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers nas tabelas
CREATE TRIGGER update_produtos_updated_at 
    BEFORE UPDATE ON produtos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at 
    BEFORE UPDATE ON clientes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 🔄 Realtime

### Configuração de Realtime

As seguintes tabelas têm realtime habilitado para atualizações em tempo real:

```sql
-- Habilitar realtime para produtos
ALTER PUBLICATION supabase_realtime ADD TABLE produtos;

-- Habilitar realtime para movimentações
ALTER PUBLICATION supabase_realtime ADD TABLE movimentacoes_estoque;
```

### Subscrições no Frontend

```typescript
// Exemplo de subscrição a produtos
const subscription = supabase
  .channel('produtos-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'produtos' }, 
    (payload) => {
      console.log('Produto alterado:', payload)
      // Atualizar estado local
    }
  )
  .subscribe()
```

---

## 💾 Storage

### Bucket para imagens de produtos

```sql
-- Bucket: product-images
-- Políticas:
-- - Upload: apenas admins
-- - Download: público (para exibição no e-commerce)
```

#### Estrutura de pastas:
```
product-images/
├── produtos/
│   ├── {produto-id}/
│   │   ├── main.jpg
│   │   ├── thumb.jpg
│   │   └── gallery/
│   │       ├── img1.jpg
│   │       └── img2.jpg
```

---

## 📈 Consultas Comuns

### Produtos com estoque baixo
```sql
SELECT id, nome, quantidade, categoria
FROM produtos 
WHERE quantidade <= 5 
ORDER BY quantidade ASC;
```

### Movimentações por período
```sql
SELECT 
    DATE(created_at) as data,
    tipo,
    COUNT(*) as total_movimentacoes,
    SUM(quantidade) as total_quantidade
FROM movimentacoes_estoque 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), tipo
ORDER BY data DESC;
```

### Produtos mais movimentados
```sql
SELECT 
    p.nome,
    COUNT(m.id) as total_movimentacoes,
    SUM(CASE WHEN m.tipo = 'entrada' THEN m.quantidade ELSE 0 END) as total_entradas,
    SUM(CASE WHEN m.tipo = 'saida' THEN m.quantidade ELSE 0 END) as total_saidas
FROM produtos p
LEFT JOIN movimentacoes_estoque m ON p.id = m.produto_id
WHERE m.created_at >= NOW() - INTERVAL '30 days'
GROUP BY p.id, p.nome
ORDER BY total_movimentacoes DESC
LIMIT 10;
```

---

## 🚀 Performance

### Índices Recomendados

```sql
-- Índices para otimização de consultas
CREATE INDEX idx_produtos_categoria ON produtos(categoria);
CREATE INDEX idx_produtos_quantidade ON produtos(quantidade);
CREATE INDEX idx_movimentacoes_produto_data ON movimentacoes_estoque(produto_id, created_at);
CREATE INDEX idx_movimentacoes_tipo_data ON movimentacoes_estoque(tipo, created_at);
CREATE INDEX idx_clientes_tipo_usuario ON clientes(tipo_usuario);
```

### Estatísticas de Uso

- **produtos**: ~50-200 registros (pequeno/médio porte)
- **clientes**: ~100-1000 registros
- **movimentacoes_estoque**: ~1000-10000 registros (histórico)

---

## 🔧 Manutenção

### Backup e Restore

```sql
-- Backup via pg_dump (exemplo)
pg_dump -h [host] -U [user] -d [database] > backup.sql

-- Restore
psql -h [host] -U [user] -d [database] < backup.sql
```

### Limpeza de Dados Antigos

```sql
-- Remover movimentações antigas (> 2 anos)
DELETE FROM movimentacoes_estoque 
WHERE created_at < NOW() - INTERVAL '2 years';
```

---

## 📝 Notas Importantes

1. **UUIDs**: Todas as tabelas usam UUID como chave primária para melhor distribuição e segurança
2. **Timestamps**: Todos os timestamps incluem timezone para consistência global
3. **JSONB**: Campos de endereço e preferências usam JSONB para flexibilidade
4. **Constraints**: Validações importantes estão no nível do banco para integridade
5. **Desnormalização**: `produto_nome` em movimentações preserva histórico mesmo se produto for deletado

---

## 🔄 Versionamento

| Versão | Data       | Mudanças                                    |
|--------|------------|---------------------------------------------|
| 1.0    | 13/09/2024 | Estrutura inicial com 3 tabelas principais |

---

_Esta documentação é mantida atualizada conforme mudanças no schema do banco de dados._
