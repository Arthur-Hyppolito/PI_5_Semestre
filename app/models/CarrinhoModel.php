<?php

class CarrinhoModel
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function adicionarItem($idUsuario, $idProduto, $quantidade = 1)
    {
        $quantidade = (int) $quantidade;
        if ($quantidade <= 0) {
            $quantidade = 1;
        }

        // Verificar se o item já existe no carrinho
        $sql = "SELECT id_item_carrinho, quantidade FROM item_carrinho 
                WHERE id_usuario = :id_usuario AND id_produto = :id_produto";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':id_usuario', $idUsuario, PDO::PARAM_INT);
        $stmt->bindValue(':id_produto', $idProduto, PDO::PARAM_INT);
        $stmt->execute();

        $itemExistente = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($itemExistente) {
            // Atualizar quantidade existente
            $novaQuantidade = $itemExistente['quantidade'] + $quantidade;
            $sqlUpdate = "UPDATE item_carrinho 
                          SET quantidade = :quantidade, 
                              data_adicao = CURRENT_TIMESTAMP 
                          WHERE id_item_carrinho = :id_item";

            $stmtUpdate = $this->db->prepare($sqlUpdate);
            $stmtUpdate->bindValue(':quantidade', $novaQuantidade, PDO::PARAM_INT);
            $stmtUpdate->bindValue(':id_item', $itemExistente['id_item_carrinho'], PDO::PARAM_INT);

            return $stmtUpdate->execute();
        } else {
            // Inserir novo item
            $sqlInsert = "INSERT INTO item_carrinho (id_usuario, id_produto, quantidade, data_adicao) 
                          VALUES (:id_usuario, :id_produto, :quantidade, CURRENT_TIMESTAMP)";

            $stmtInsert = $this->db->prepare($sqlInsert);
            $stmtInsert->bindValue(':id_usuario', $idUsuario, PDO::PARAM_INT);
            $stmtInsert->bindValue(':id_produto', $idProduto, PDO::PARAM_INT);
            $stmtInsert->bindValue(':quantidade', $quantidade, PDO::PARAM_INT);

            return $stmtInsert->execute();
        }
    }

    // ...existing methods...
}