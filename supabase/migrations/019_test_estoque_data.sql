-- Dados de teste: produto Coca-Cola + item de estoque + vínculo
DO $$
DECLARE
  v_rest_id   UUID;
  v_cat_id    UUID;
  v_prod_id   UUID;
  v_est_id    UUID;
BEGIN
  SELECT id INTO v_rest_id FROM restaurantes WHERE status = 'active' ORDER BY criado_em LIMIT 1;
  IF v_rest_id IS NULL THEN RETURN; END IF;

  -- Usar primeira categoria ativa ou criar "Bebidas"
  SELECT id INTO v_cat_id FROM categorias
  WHERE restaurante_id = v_rest_id AND ativo = true AND deletado_em IS NULL
  ORDER BY ordem LIMIT 1;

  IF v_cat_id IS NULL THEN
    INSERT INTO categorias (restaurante_id, nome, icone, slug, ordem, ativo)
    VALUES (v_rest_id, 'Bebidas', '🥤', 'bebidas', 99, true)
    RETURNING id INTO v_cat_id;
  END IF;

  -- Produto de teste no cardápio
  INSERT INTO produtos (restaurante_id, categoria_id, nome, descricao, preco, imagem_emoji, ativo)
  VALUES (v_rest_id, v_cat_id, 'Coca-Cola 350ml', 'Refrigerante gelado', 7.00, '🥤', true)
  RETURNING id INTO v_prod_id;

  -- Item de estoque de teste
  INSERT INTO estoque (restaurante_id, nome, categoria, quantidade, quantidade_minima, unidade, custo_unitario)
  VALUES (v_rest_id, 'Coca-Cola 350ml', 'Bebidas', 50, 5, 'un', 3.50)
  RETURNING id INTO v_est_id;

  -- Vínculo: 1 unidade de estoque consumida por venda
  INSERT INTO produto_estoque (produto_id, estoque_id, quantidade)
  VALUES (v_prod_id, v_est_id, 1);
END $$;
