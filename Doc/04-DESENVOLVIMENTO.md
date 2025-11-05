# 💻 Guia de Desenvolvimento - WaveSurf

**Conformidade**: Global Rules - Seções 2, 4, 5, 48, 49  
**Data**: 05/11/2025  
**Versão**: 4.4.10

---

## 📋 Índice

1. [Padrões de Código](#padrões-de-código)
2. [Estrutura de Pastas](#estrutura-de-pastas)
3. [Convenções de Nomenclatura](#convenções-de-nomenclatura)
4. [Fluxo de Trabalho Git](#fluxo-de-trabalho-git)
5. [Desenvolvimento de Features](#desenvolvimento-de-features)
6. [Boas Práticas](#boas-práticas)
7. [Code Review](#code-review)

---

## 📝 Padrões de Código

### TypeScript

**Sempre use TypeScript**, nunca `any`:

```typescript
// ❌ Evite
const user: any = await fetchUser();

// ✅ Correto
interface User {
  id: string;
  nome: string;
  email: string;
  tipo_usuario: 'cliente' | 'admin';
}

const user: User = await fetchUser();
```

### Componentes React

**Functional Components com TypeScript**:

```typescript
// ✅ Padrão recomendado
interface ProductCardProps {
  produto: Produto;
  onAddToCart: (id: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  produto, 
  onAddToCart 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{produto.nome}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{produto.descricao}</p>
        <Button onClick={() => onAddToCart(produto.id)}>
          Adicionar ao Carrinho
        </Button>
      </CardContent>
    </Card>
  );
};
```

### Hooks Customizados

**Sempre comece com `use`**:

```typescript
// ✅ Hook customizado
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Lógica de autenticação
  }, []);
  
  return { user, loading, isAdmin: user?.tipo_usuario === 'admin' };
};
```

### Async/Await

**Sempre use try/catch**:

```typescript
// ✅ Tratamento de erros robusto
const fetchProducts = async () => {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('ativo', true);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    toast.error('Falha ao carregar produtos');
    return [];
  }
};
```

---

## 📁 Estrutura de Pastas

### Organização Atual

```
src/
├── components/              # Componentes reutilizáveis
│   ├── ui/                 # shadcn/ui components (49 itens)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── Cart/               # Sistema de carrinho
│   │   ├── CartDrawer.tsx
│   │   ├── CartIcon.tsx
│   │   └── CartSidebar.tsx
│   ├── Header.tsx          # Componentes de layout
│   ├── Footer.tsx
│   ├── Hero.tsx
│   ├── Products.tsx
│   └── ...
├── pages/                  # Páginas da aplicação
│   ├── Index.tsx           # Home
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Backoffice.tsx      # Dashboard admin
│   ├── GerenciarProdutos.tsx
│   ├── GerenciarEstoque.tsx
│   └── ...
├── contexts/               # Contextos React
│   ├── AuthContext.tsx     # Estado de autenticação
│   └── CartContext.tsx     # Estado do carrinho
├── hooks/                  # Hooks customizados
│   ├── useAuth.ts
│   ├── useOperationGuard.ts
│   └── use-toast.ts
├── lib/                    # Utilitários e configurações
│   ├── supabase.ts         # Cliente Supabase
│   ├── utils.ts            # Helpers gerais
│   └── database.sql        # Schema SQL
└── assets/                 # Recursos estáticos
```

### Regras de Organização

1. **Componentes UI genéricos** → `components/ui/`
2. **Componentes de domínio** → `components/[Dominio]/`
3. **Páginas** → `pages/`
4. **Lógica de negócio** → `contexts/` ou `hooks/`
5. **Utilitários** → `lib/`

---

## 🏷️ Convenções de Nomenclatura

### Arquivos

```
PascalCase para componentes:
  ✅ ProductCard.tsx
  ✅ CartDrawer.tsx
  ✅ GerenciarProdutos.tsx

camelCase para hooks e utils:
  ✅ useAuth.ts
  ✅ useCart.ts
  ✅ utils.ts

kebab-case para componentes ui:
  ✅ button.tsx
  ✅ card.tsx
  ✅ dropdown-menu.tsx
```

### Variáveis e Funções

```typescript
// camelCase para variáveis e funções
const userName = 'João';
const fetchProducts = async () => {};

// PascalCase para componentes e tipos
interface UserProfile {}
const ProductCard: React.FC = () => {};

// UPPER_CASE para constantes
const MAX_ITEMS_PER_PAGE = 50;
const API_BASE_URL = 'https://api.example.com';
```

### Banco de Dados

```sql
-- snake_case para tabelas e colunas
CREATE TABLE carrinho_itens (
  user_id UUID,
  produto_id UUID,
  created_at TIMESTAMP
);

-- snake_case para funções
CREATE FUNCTION adicionar_ao_carrinho() ...
CREATE FUNCTION processar_checkout_atomico() ...
```

---

## 🔀 Fluxo de Trabalho Git

### Branches

```bash
# Branch principal
main                    # Código em produção

# Branches de feature
feature/adicionar-filtros-produtos
feature/sistema-cupons
feature/relatorios-vendas

# Branches de bugfix
fix/corrigir-calculo-estoque
fix/validacao-email

# Branches de hotfix
hotfix/seguranca-rls
hotfix/performance-queries
```

### Commits Convencionais

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Features
git commit -m "feat: adiciona filtro por categoria de produtos"
git commit -m "feat(carrinho): implementa cupons de desconto"

# Fixes
git commit -m "fix: corrige cálculo de estoque no checkout"
git commit -m "fix(auth): resolve erro de logout"

# Docs
git commit -m "docs: atualiza guia de instalação"
git commit -m "docs(api): adiciona exemplos de uso"

# Style
git commit -m "style: formata código com prettier"

# Refactor
git commit -m "refactor: extrai lógica de carrinho para hook"

# Test
git commit -m "test: adiciona testes para ProductCard"

# Chore
git commit -m "chore: atualiza dependências"
git commit -m "chore(deps): bump react to 18.3.1"
```

### Workflow Padrão

```bash
# 1. Crie uma branch a partir da main
git checkout main
git pull origin main
git checkout -b feature/minha-feature

# 2. Desenvolva e commite
git add .
git commit -m "feat: adiciona minha feature"

# 3. Push para o remoto
git push origin feature/minha-feature

# 4. Abra um Pull Request no GitHub

# 5. Após aprovação, merge na main
# (via GitHub interface)

# 6. Delete a branch local
git checkout main
git pull origin main
git branch -d feature/minha-feature
```

---

## 🚀 Desenvolvimento de Features

### 1. Planejamento

Antes de começar:
- [ ] Entenda o requisito completamente
- [ ] Verifique se não existe solução similar
- [ ] Identifique impactos em outras features
- [ ] Estime tempo necessário

### 2. Implementação Frontend

```typescript
// 1. Crie o componente
// src/components/MeuComponente.tsx

interface MeuComponenteProps {
  // Props tipadas
}

export const MeuComponente: React.FC<MeuComponenteProps> = (props) => {
  // Estado local
  const [loading, setLoading] = useState(false);
  
  // Hooks customizados
  const { user } = useAuth();
  
  // Handlers
  const handleAction = async () => {
    try {
      setLoading(true);
      // Lógica
    } catch (error) {
      toast.error('Erro ao executar ação');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    // JSX
  );
};
```

### 3. Implementação Backend (SQL)

```sql
-- 1. Crie a tabela (se necessário)
CREATE TABLE minha_tabela (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Crie índices
CREATE INDEX idx_minha_tabela_user_id ON minha_tabela(user_id);

-- 3. Habilite RLS
ALTER TABLE minha_tabela ENABLE ROW LEVEL SECURITY;

-- 4. Crie políticas
CREATE POLICY "usuarios_veem_proprios_dados"
ON minha_tabela FOR SELECT
USING (auth.uid() = user_id);

-- 5. Crie função (se necessário)
CREATE OR REPLACE FUNCTION minha_funcao(...)
RETURNS ... AS $$
BEGIN
  -- Lógica
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. Integração

```typescript
// lib/api/minhaFeature.ts

export const minhaFeatureAPI = {
  async listar() {
    const { data, error } = await supabase
      .from('minha_tabela')
      .select('*');
    
    if (error) throw error;
    return data;
  },
  
  async criar(dados: MeusDados) {
    const { data, error } = await supabase
      .from('minha_tabela')
      .insert(dados)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
```

---

## ✅ Boas Práticas

### 1. Sempre Valide Dados

```typescript
// ✅ Use Zod para validação
import { z } from 'zod';

const produtoSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  preco: z.number().positive('Preço deve ser positivo'),
  quantidade: z.number().int().min(0, 'Quantidade não pode ser negativa')
});

// Valide antes de enviar
const validado = produtoSchema.parse(formData);
```

### 2. Trate Erros Adequadamente

```typescript
// ✅ Tratamento específico por tipo de erro
try {
  await salvarProduto(produto);
  toast.success('Produto salvo com sucesso!');
} catch (error) {
  if (error instanceof z.ZodError) {
    toast.error('Dados inválidos: ' + error.errors[0].message);
  } else if (error.code === 'PGRST116') {
    toast.error('Produto não encontrado');
  } else {
    toast.error('Erro ao salvar produto');
    console.error(error);
  }
}
```

### 3. Use Loading States

```typescript
// ✅ Feedback visual durante operações
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await salvar();
  } finally {
    setLoading(false);
  }
};

return (
  <Button disabled={loading}>
    {loading ? 'Salvando...' : 'Salvar'}
  </Button>
);
```

### 4. Otimize Queries

```typescript
// ❌ Evite N+1 queries
for (const pedido of pedidos) {
  const itens = await buscarItensDoPedido(pedido.id);
}

// ✅ Use joins ou select aninhado
const { data } = await supabase
  .from('pedidos')
  .select(`
    *,
    itens:pedidos_itens(*)
  `);
```

### 5. Mantenha Componentes Pequenos

```typescript
// ❌ Componente muito grande (>300 linhas)
const PaginaProdutos = () => {
  // 500 linhas de código...
};

// ✅ Divida em componentes menores
const PaginaProdutos = () => {
  return (
    <>
      <ProdutosFiltros />
      <ProdutosLista />
      <ProdutosPaginacao />
    </>
  );
};
```

---

## 👀 Code Review

### Checklist do Revisor

- [ ] Código segue os padrões do projeto
- [ ] Não há `any` desnecessários
- [ ] Erros são tratados adequadamente
- [ ] Componentes são reutilizáveis
- [ ] Não há código duplicado
- [ ] Performance é adequada
- [ ] Segurança foi considerada (RLS, validações)
- [ ] Documentação está atualizada

### Checklist do Autor

Antes de abrir PR:
- [ ] Código compila sem erros (`npm run build`)
- [ ] Linter passa (`npm run lint`)
- [ ] Testei localmente
- [ ] Atualizei documentação (se necessário)
- [ ] Commit messages seguem padrão
- [ ] Branch está atualizada com main

---

## 🔧 Ferramentas de Desenvolvimento

### VS Code Extensions Recomendadas

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "supabase.supabase-vscode"
  ]
}
```

### Scripts Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia dev server

# Build
npm run build            # Build de produção
npm run preview          # Preview do build

# Qualidade
npm run lint             # Executa ESLint
npm run lint -- --fix    # Corrige automaticamente

# TypeScript
npx tsc --noEmit         # Verifica tipos
```

---

## 📚 Recursos Adicionais

- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)

---

**Última Atualização**: 05/11/2025  
**Próxima Revisão**: Mensal
