# 🚀 Guia de Instalação - WaveSurf

**Conformidade**: Global Rules - Seção 26 (Onboarding e Conhecimento)  
**Data**: 05/11/2025  
**Tempo Estimado**: 30-45 minutos

---

## 📋 Pré-requisitos

### Software Necessário

| Software | Versão Mínima | Recomendada | Link |
|----------|---------------|-------------|------|
| Node.js | 18.0.0 | 20.x LTS | [nodejs.org](https://nodejs.org) |
| npm | 9.0.0 | 10.x | (incluído com Node.js) |
| Git | 2.30.0 | Latest | [git-scm.com](https://git-scm.com) |

### Contas Necessárias

- ✅ Conta GitHub (para clonar o repositório)
- ✅ Conta Supabase (gratuita) - [supabase.com](https://supabase.com)

### Conhecimentos Recomendados

- JavaScript/TypeScript básico
- React básico
- SQL básico (para configuração do banco)
- Terminal/Command Line

---

## 🎯 Instalação Rápida (Quick Start)

### Passo 1: Clone o Repositório

```bash
# Clone via HTTPS
git clone https://github.com/Arthur-Hyppolito/PI_5_Semestre.git

# OU via SSH (se configurado)
git clone git@github.com:Arthur-Hyppolito/PI_5_Semestre.git

# Entre no diretório
cd PI_5_Semestre
```

### Passo 2: Instale as Dependências

```bash
# Usando npm
npm install

# OU usando yarn (se preferir)
yarn install
```

**Tempo estimado**: 2-5 minutos

### Passo 3: Configure as Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
# URL do seu projeto Supabase
VITE_SUPABASE_URL=https://seu-projeto-ref.supabase.co

# Chave pública anon do Supabase
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### Passo 4: Inicie o Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse: **http://localhost:8080/projeto/wave-surf/**

---

## 🗄️ Configuração do Banco de Dados

### Passo 1: Crie um Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Crie uma organização (se não tiver)
4. Clique em "New Project"
5. Preencha:
   - **Name**: WaveSurf
   - **Database Password**: (escolha uma senha forte)
   - **Region**: South America (São Paulo) - recomendado
   - **Pricing Plan**: Free (suficiente para desenvolvimento)
6. Clique em "Create new project"

**Tempo estimado**: 2-3 minutos

### Passo 2: Obtenha as Credenciais

1. No dashboard do Supabase, vá em **Settings** > **API**
2. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
3. Cole no arquivo `.env`

### Passo 3: Execute os Scripts SQL

#### 3.1 Estrutura Base

1. No Supabase, vá em **SQL Editor**
2. Clique em "New query"
3. Copie o conteúdo de `src/lib/database.sql`
4. Cole no editor
5. Clique em "Run"

**Tempo estimado**: 1-2 minutos

#### 3.2 Funções e Triggers

1. Abra `sistema/banco-de-dados.md`
2. Localize a seção "Funções SQL"
3. Copie cada função SQL
4. Execute no SQL Editor do Supabase

**Principais funções**:
```sql
-- 1. Função auxiliar de admin
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM clientes 
    WHERE auth_user_id = user_id 
    AND tipo_usuario = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- 2. Adicionar ao carrinho
CREATE OR REPLACE FUNCTION adicionar_ao_carrinho(...)
-- (copie a função completa do arquivo)

-- 3. Processar checkout
CREATE OR REPLACE FUNCTION processar_checkout_atomico(...)
-- (copie a função completa do arquivo)
```

**Tempo estimado**: 5-10 minutos

#### 3.3 Políticas RLS

1. Ainda em `sistema/banco-de-dados.md`
2. Localize a seção "Row Level Security (RLS)"
3. Execute cada política:

```sql
-- Exemplo: RLS para produtos
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "produtos_publicos_leitura"
ON produtos FOR SELECT
USING (true);

CREATE POLICY "apenas_admins_editam_produtos"
ON produtos FOR ALL
USING (is_admin_user(auth.uid()));
```

**Tempo estimado**: 5-10 minutos

### Passo 4: Crie o Primeiro Usuário Admin

1. No Supabase, vá em **Authentication** > **Users**
2. Clique em "Add user" > "Create new user"
3. Preencha:
   - **Email**: admin@wavesurf.com
   - **Password**: (escolha uma senha forte)
   - **Auto Confirm User**: ✅ Marque
4. Clique em "Create user"
5. Copie o **User UID**

6. No **SQL Editor**, execute:

```sql
-- Insira o perfil de admin
INSERT INTO clientes (
  auth_user_id,
  nome,
  sobrenome,
  tipo_usuario,
  ativo
) VALUES (
  'cole-o-user-uid-aqui',
  'Admin',
  'WaveSurf',
  'admin',
  true
);
```

**Tempo estimado**: 2-3 minutos

---

## ✅ Verificação da Instalação

### 1. Teste o Frontend

```bash
# Servidor deve estar rodando
npm run dev
```

Acesse: http://localhost:8080/projeto/wave-surf/

**Checklist**:
- ✅ Página inicial carrega
- ✅ Header e Footer aparecem
- ✅ Produtos são listados (pode estar vazio)
- ✅ Botão "Login" funciona

### 2. Teste a Autenticação

1. Clique em "Login"
2. Entre com:
   - Email: admin@wavesurf.com
   - Senha: (a que você criou)
3. Deve redirecionar para o Backoffice

**Checklist**:
- ✅ Login bem-sucedido
- ✅ Redireciona para `/backoffice`
- ✅ Dashboard carrega
- ✅ Menu lateral aparece

### 3. Teste o Banco de Dados

No **SQL Editor** do Supabase:

```sql
-- Verifica tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Deve retornar ~57 tabelas
```

```sql
-- Verifica funções criadas
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Deve retornar ~68 funções
```

```sql
-- Verifica políticas RLS
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

-- Deve retornar ~41 políticas
```

---

## 🐛 Troubleshooting

### Erro: "Module not found"

```bash
# Limpe o cache e reinstale
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Supabase connection failed"

**Causa**: Credenciais incorretas no `.env`

**Solução**:
1. Verifique se copiou corretamente do Supabase
2. Certifique-se que não há espaços extras
3. Reinicie o servidor dev (`npm run dev`)

### Erro: "RLS policy violation"

**Causa**: Políticas RLS não configuradas

**Solução**:
1. Execute todos os scripts de RLS
2. Verifique se a função `is_admin_user()` existe
3. Teste no SQL Editor:

```sql
SELECT is_admin_user('seu-user-uid-aqui');
-- Deve retornar true para admin
```

### Erro: "Function does not exist"

**Causa**: Funções SQL não criadas

**Solução**:
1. Execute todas as funções de `sistema/banco-de-dados.md`
2. Verifique se não há erros de sintaxe
3. Use `CREATE OR REPLACE FUNCTION` para sobrescrever

### Porta 8080 já em uso

```bash
# Encontre o processo usando a porta
lsof -i :8080

# Mate o processo
kill -9 <PID>

# OU use outra porta
npm run dev -- --port 3000
```

---

## 🔧 Configurações Opcionais

### ESLint

```bash
# Execute o linter
npm run lint

# Corrija automaticamente
npm run lint -- --fix
```

### TypeScript

```bash
# Verifique tipos
npx tsc --noEmit
```

### Build de Produção

```bash
# Build para produção
npm run build

# Preview do build
npm run preview
```

---

## 📚 Próximos Passos

Após a instalação bem-sucedida:

1. ✅ Leia o [Guia de Desenvolvimento](./04-DESENVOLVIMENTO.md)
2. ✅ Explore a [Arquitetura](./02-ARQUITETURA.md)
3. ✅ Configure [Testes](./09-TESTES.md)
4. ✅ Adicione produtos de exemplo no Backoffice

---

## 🆘 Suporte

- **Documentação**: `/Doc/`
- **Issues**: [GitHub Issues](https://github.com/Arthur-Hyppolito/PI_5_Semestre/issues)
- **Logs Técnicos**: `/sistema/PROJECT_LOG.md`

---

## ✅ Checklist Final

Antes de começar a desenvolver, certifique-se:

- [ ] Node.js 18+ instalado
- [ ] Repositório clonado
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` configurado
- [ ] Projeto Supabase criado
- [ ] Scripts SQL executados (tabelas, funções, RLS)
- [ ] Usuário admin criado
- [ ] Servidor dev rodando (`npm run dev`)
- [ ] Login funciona
- [ ] Backoffice acessível

---

**Tempo Total Estimado**: 30-45 minutos  
**Última Atualização**: 05/11/2025
