<?php

class CarrinhoController
{
    private $carrinhoModel;

    public function __construct($carrinhoModel)
    {
        $this->carrinhoModel = $carrinhoModel;
    }

    public function adicionarAoCarrinho()
    {
        if (!isset($_SESSION['id_usuario'])) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Usuário não autenticado']);
            exit;
        }

        $idUsuario = $_SESSION['id_usuario'];

        // Processar múltiplos produtos
        $produtosIds = isset($_POST['produto_id']) ? (array) $_POST['produto_id'] : [];
        $quantidades = isset($_POST['quantidade']) ? (array) $_POST['quantidade'] : [];

        if (empty($produtosIds)) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Nenhum produto selecionado']);
            exit;
        }

        $sucesso = true;
        $mensagens = [];

        foreach ($produtosIds as $index => $idProduto) {
            $quantidade = isset($quantidades[$index]) ? (int) $quantidades[$index] : 1;

            if ($quantidade <= 0) {
                $quantidade = 1;
            }

            $result = $this->carrinhoModel->adicionarItem($idUsuario, $idProduto, $quantidade);

            if (!$result) {
                $sucesso = false;
                $mensagens[] = "Erro ao adicionar produto ID $idProduto";
            }
        }

        header('Content-Type: application/json');
        if ($sucesso) {
            echo json_encode(['success' => true, 'message' => 'Produtos adicionados ao carrinho com sucesso']);
        } else {
            echo json_encode(['success' => false, 'message' => implode(', ', $mensagens)]);
        }
        exit;
    }
}