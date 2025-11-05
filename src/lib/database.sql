-- Tabela para produtos
CREATE TABLE IF NOT EXISTS produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 0,
  categoria VARCHAR(100) NOT NULL,
  imagem_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_nome ON produtos(nome);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_produtos_updated_at 
    BEFORE UPDATE ON produtos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir produtos completos com imagens reais
INSERT INTO produtos (nome, descricao, preco, quantidade, categoria, imagem_url) VALUES
('Prancha Shortboard Pro 6.2', 'Prancha profissional para surfistas experientes. Construção em fibra de vidro com tecnologia avançada para máxima performance em ondas críticas.', 1299.99, 15, 'Pranchas', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500&h=300&fit=crop'),
('Longboard Classic 9.6', 'Longboard clássico perfeito para iniciantes e cruising. Design tradicional com estabilidade excepcional para ondas pequenas e médias.', 899.99, 8, 'Pranchas', 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=500&h=300&fit=crop'),
('Wetsuit Premium 4/3mm', 'Wetsuit de alta qualidade para águas frias. Neoprene flexível e durável com costuras seladas para máximo conforto térmico.', 599.99, 12, 'Wetsuits', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=300&fit=crop'),
('Leash Surf Premium 6ft', 'Leash resistente para pranchas de surf. Cabo em espiral de alta qualidade com sistema de liberação rápida para segurança máxima.', 89.99, 25, 'Acessórios', 'https://images.unsplash.com/photo-1502933691298-84fc14542831?w=500&h=300&fit=crop'),
('Kit Quilhas FCS II', 'Set completo de quilhas FCS II para máxima performance. Três quilhas de fibra de carbono para controle e velocidade excepcionais.', 159.99, 18, 'Acessórios', 'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=500&h=300&fit=crop'),
('Cera Surf Tropical Premium', 'Cera especial para águas tropicais com aderência perfeita. Fórmula exclusiva que mantém o grip mesmo nas condições mais quentes.', 24.99, 50, 'Acessórios', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop');

-- Tabela para movimentações de estoque
CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  produto_nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  motivo VARCHAR(100) NOT NULL,
  observacoes TEXT,
  usuario VARCHAR(100) DEFAULT 'Sistema',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance na tabela de movimentações
CREATE INDEX IF NOT EXISTS idx_movimentacoes_produto_id ON movimentacoes_estoque(produto_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo ON movimentacoes_estoque(tipo);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_created_at ON movimentacoes_estoque(created_at DESC);

-- Inserir algumas movimentações de exemplo
INSERT INTO movimentacoes_estoque (produto_id, produto_nome, tipo, quantidade, motivo, observacoes, usuario) VALUES
((SELECT id FROM produtos WHERE nome = 'Prancha Shortboard Pro 6.2' LIMIT 1), 'Prancha Shortboard Pro 6.2', 'entrada', 10, 'Compra de fornecedor', 'Lote recebido em perfeitas condições', 'Admin'),
((SELECT id FROM produtos WHERE nome = 'Longboard Classic 9.6' LIMIT 1), 'Longboard Classic 9.6', 'entrada', 5, 'Compra de fornecedor', 'Entrega programada', 'Admin'),
((SELECT id FROM produtos WHERE nome = 'Wetsuit Premium 4/3mm' LIMIT 1), 'Wetsuit Premium 4/3mm', 'saida', 2, 'Venda', 'Vendido para cliente premium', 'Vendedor'),
((SELECT id FROM produtos WHERE nome = 'Leash Surf Premium 6ft' LIMIT 1), 'Leash Surf Premium 6ft', 'entrada', 15, 'Reposição de estoque', 'Estoque baixo - reposição automática', 'Sistema'),
((SELECT id FROM produtos WHERE nome = 'Kit Quilhas FCS II' LIMIT 1), 'Kit Quilhas FCS II', 'saida', 3, 'Venda', 'Venda online', 'E-commerce');

-- Tabela para clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  sobrenome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  cpf VARCHAR(14),
  data_nascimento DATE,
  genero VARCHAR(20),
  foto_perfil TEXT,
  endereco JSONB DEFAULT '{}',
  preferencias JSONB DEFAULT '{}',
  tipo_usuario VARCHAR(20) DEFAULT 'cliente' CHECK (tipo_usuario IN ('cliente', 'admin')),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance na tabela de clientes
CREATE INDEX IF NOT EXISTS idx_clientes_auth_user_id ON clientes(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_tipo_usuario ON clientes(tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON clientes(ativo);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf);

-- Trigger para atualizar updated_at automaticamente na tabela clientes
CREATE TRIGGER update_clientes_updated_at 
    BEFORE UPDATE ON clientes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Função para criar perfil de cliente automaticamente após registro
CREATE OR REPLACE FUNCTION create_client_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO clientes (auth_user_id, nome, sobrenome, telefone, tipo_usuario)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Cliente'),
    COALESCE(NEW.raw_user_meta_data->>'sobrenome', ''),
    COALESCE(NEW.raw_user_meta_data->>'telefone', ''),
    COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'cliente')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_client_profile();

-- Inserir alguns clientes de exemplo (simulando registros)
INSERT INTO clientes (nome, sobrenome, telefone, endereco, tipo_usuario) VALUES
('João', 'Silva', '(11) 99999-1234', '{"rua": "Rua das Ondas, 123", "cidade": "São Paulo", "cep": "01234-567", "estado": "SP"}', 'cliente'),
('Maria', 'Santos', '(21) 98888-5678', '{"rua": "Av. Atlântica, 456", "cidade": "Rio de Janeiro", "cep": "22070-900", "estado": "RJ"}', 'cliente'),
('Pedro', 'Costa', '(47) 97777-9012', '{"rua": "Rua do Surf, 789", "cidade": "Florianópolis", "cep": "88010-000", "estado": "SC"}', 'cliente'),
('Admin', 'Sistema', '(11) 99999-0000', '{"rua": "Sede da Empresa", "cidade": "São Paulo", "cep": "01000-000", "estado": "SP"}', 'admin');
