# 📊 Fluxo de Dados do Cliente - Onde São Salvos

## 🔄 **Processo Completo de Registro:**

### 1. **Frontend (Register.tsx)**
```javascript
// Dados coletados no formulário
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      nome: nome,
      sobrenome: sobrenome,
      telefone: telefone
    }
  }
})
```

### 2. **Supabase Auth (Tabela: `auth.users`)**
- ✅ **Email e senha** (criptografada)
- ✅ **Metadados** em `raw_user_meta_data`:
  - nome
  - sobrenome  
  - telefone
- ✅ **ID único** gerado automaticamente

### 3. **Trigger Automático (SQL)**
```sql
-- Trigger dispara após INSERT em auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_client_profile();
```

### 4. **Função SQL (create_client_profile)**
```sql
-- Extrai metadados e cria perfil
INSERT INTO clientes (auth_user_id, nome, sobrenome, telefone, tipo_usuario)
VALUES (
  NEW.id,
  COALESCE(NEW.raw_user_meta_data->>'nome', 'Cliente'),
  COALESCE(NEW.raw_user_meta_data->>'sobrenome', ''),
  COALESCE(NEW.raw_user_meta_data->>'telefone', ''),
  'cliente'
);
```

### 5. **Tabela Final (`clientes`)**
- ✅ **auth_user_id** (referência para auth.users)
- ✅ **nome, sobrenome, telefone** (dos metadados)
- ✅ **Campos extras**: cpf, data_nascimento, genero, foto_perfil, endereco
- ✅ **tipo_usuario**: 'cliente'

## 🔍 **Para Verificar os Dados:**

### Execute no Supabase SQL Editor:
```sql
-- Ver usuários recentes
SELECT id, email, raw_user_meta_data FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- Ver clientes recentes  
SELECT * FROM clientes ORDER BY created_at DESC LIMIT 5;
```

## ⚠️ **Possíveis Problemas:**

1. **Dados só em auth.users** = Trigger não funcionou
2. **Nenhum dado** = Confirmação de email habilitada
3. **Erro no console** = Função SQL com problema

## 🛠️ **Soluções:**

- Execute `SETUP_CLIENTES_COMPLETE.sql`
- Desabilite confirmação de email no Supabase
- Use `VERIFICAR_DADOS_CLIENTE.sql` para diagnosticar
