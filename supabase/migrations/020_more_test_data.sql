-- Mais dados de teste: produtos no cardápio + itens de estoque + vínculos
DO $$
DECLARE
  v_rest_id   UUID;
  v_cat_beb   UUID;
  v_cat_lan   UUID;
  v_cat_sob   UUID;

  -- produtos
  v_p_pepsi   UUID;
  v_p_suco    UUID;
  v_p_agua    UUID;
  v_p_burger  UUID;
  v_p_frango  UUID;
  v_p_batata  UUID;
  v_p_combo   UUID;
  v_p_acai    UUID;
  v_p_brownie UUID;

  -- estoque
  v_e_pepsi   UUID;
  v_e_suco    UUID;
  v_e_agua    UUID;
  v_e_pao     UUID;
  v_e_carne   UUID;
  v_e_frango  UUID;
  v_e_batata  UUID;
  v_e_acai    UUID;
  v_e_brownie UUID;
BEGIN
  SELECT id INTO v_rest_id FROM restaurantes WHERE status = 'active' ORDER BY criado_em LIMIT 1;
  IF v_rest_id IS NULL THEN RETURN; END IF;

  -- ── Categorias ──────────────────────────────────────────────
  SELECT id INTO v_cat_beb FROM categorias
  WHERE restaurante_id = v_rest_id AND nome = 'Bebidas' AND deletado_em IS NULL LIMIT 1;
  IF v_cat_beb IS NULL THEN
    INSERT INTO categorias (restaurante_id, nome, icone, slug, ordem, ativo)
    VALUES (v_rest_id, 'Bebidas', '🥤', 'bebidas', 1, true)
    RETURNING id INTO v_cat_beb;
  END IF;

  INSERT INTO categorias (restaurante_id, nome, icone, slug, ordem, ativo)
  VALUES (v_rest_id, 'Lanches', '🍔', 'lanches', 2, true)
  RETURNING id INTO v_cat_lan;

  INSERT INTO categorias (restaurante_id, nome, icone, slug, ordem, ativo)
  VALUES (v_rest_id, 'Sobremesas', '🍨', 'sobremesas', 3, true)
  RETURNING id INTO v_cat_sob;

  -- ── Produtos ────────────────────────────────────────────────
  INSERT INTO produtos (restaurante_id, categoria_id, nome, descricao, preco, imagem_emoji, ativo)
  VALUES (v_rest_id, v_cat_beb, 'Pepsi 350ml', 'Refrigerante gelado', 6.50, '🥤', true)
  RETURNING id INTO v_p_pepsi;

  INSERT INTO produtos (restaurante_id, categoria_id, nome, descricao, preco, imagem_emoji, ativo)
  VALUES (v_rest_id, v_cat_beb, 'Suco Natural 300ml', 'Laranja, limão ou maracujá', 9.00, '🍊', true)
  RETURNING id INTO v_p_suco;

  INSERT INTO produtos (restaurante_id, categoria_id, nome, descricao, preco, imagem_emoji, ativo)
  VALUES (v_rest_id, v_cat_beb, 'Água Mineral 500ml', 'Água gelada sem gás', 4.00, '💧', true)
  RETURNING id INTO v_p_agua;

  INSERT INTO produtos (restaurante_id, categoria_id, nome, descricao, preco, imagem_emoji, ativo, bestseller)
  VALUES (v_rest_id, v_cat_lan, 'X-Burguer', 'Pão, hambúrguer 180g, queijo, alface e tomate', 24.90, '🍔', true, true)
  RETURNING id INTO v_p_burger;

  INSERT INTO produtos (restaurante_id, categoria_id, nome, descricao, preco, imagem_emoji, ativo)
  VALUES (v_rest_id, v_cat_lan, 'Frango Grelhado', 'Peito grelhado temperado com ervas', 22.00, '🍗', true)
  RETURNING id INTO v_p_frango;

  INSERT INTO produtos (restaurante_id, categoria_id, nome, descricao, preco, imagem_emoji, ativo)
  VALUES (v_rest_id, v_cat_lan, 'Batata Frita P', 'Porção pequena crocante', 12.00, '🍟', true)
  RETURNING id INTO v_p_batata;

  INSERT INTO produtos (restaurante_id, categoria_id, nome, descricao, preco, imagem_emoji, ativo, bestseller)
  VALUES (v_rest_id, v_cat_lan, 'Combo X-Burguer + Batata + Bebida', 'X-Burguer + batata P + Pepsi 350ml', 38.90, '🎁', true, true)
  RETURNING id INTO v_p_combo;

  INSERT INTO produtos (restaurante_id, categoria_id, nome, descricao, preco, imagem_emoji, ativo)
  VALUES (v_rest_id, v_cat_sob, 'Açaí 300ml', 'Com granola e banana', 16.00, '🫐', true)
  RETURNING id INTO v_p_acai;

  INSERT INTO produtos (restaurante_id, categoria_id, nome, descricao, preco, imagem_emoji, ativo)
  VALUES (v_rest_id, v_cat_sob, 'Brownie', 'Brownie de chocolate quente', 11.00, '🍫', true)
  RETURNING id INTO v_p_brownie;

  -- ── Estoque ─────────────────────────────────────────────────
  INSERT INTO estoque (restaurante_id, nome, categoria, quantidade, quantidade_minima, unidade, custo_unitario)
  VALUES (v_rest_id, 'Pepsi 350ml', 'Bebidas', 40, 5, 'un', 3.00)
  RETURNING id INTO v_e_pepsi;

  INSERT INTO estoque (restaurante_id, nome, categoria, quantidade, quantidade_minima, unidade, custo_unitario)
  VALUES (v_rest_id, 'Suco Natural 300ml', 'Bebidas', 20, 3, 'un', 4.50)
  RETURNING id INTO v_e_suco;

  INSERT INTO estoque (restaurante_id, nome, categoria, quantidade, quantidade_minima, unidade, custo_unitario)
  VALUES (v_rest_id, 'Água Mineral 500ml', 'Bebidas', 60, 10, 'un', 1.50)
  RETURNING id INTO v_e_agua;

  INSERT INTO estoque (restaurante_id, nome, categoria, quantidade, quantidade_minima, unidade, custo_unitario)
  VALUES (v_rest_id, 'Pão de Hambúrguer', 'Frios', 30, 5, 'un', 1.20)
  RETURNING id INTO v_e_pao;

  INSERT INTO estoque (restaurante_id, nome, categoria, quantidade, quantidade_minima, unidade, custo_unitario)
  VALUES (v_rest_id, 'Hambúrguer 180g', 'Carnes', 30, 5, 'un', 7.00)
  RETURNING id INTO v_e_carne;

  INSERT INTO estoque (restaurante_id, nome, categoria, quantidade, quantidade_minima, unidade, custo_unitario)
  VALUES (v_rest_id, 'Peito de Frango 200g', 'Carnes', 25, 5, 'un', 6.00)
  RETURNING id INTO v_e_frango;

  INSERT INTO estoque (restaurante_id, nome, categoria, quantidade, quantidade_minima, unidade, custo_unitario)
  VALUES (v_rest_id, 'Batata Frita Porção P', 'Congelados', 50, 8, 'un', 3.50)
  RETURNING id INTO v_e_batata;

  INSERT INTO estoque (restaurante_id, nome, categoria, quantidade, quantidade_minima, unidade, custo_unitario)
  VALUES (v_rest_id, 'Açaí 300ml', 'Congelados', 15, 3, 'un', 7.00)
  RETURNING id INTO v_e_acai;

  INSERT INTO estoque (restaurante_id, nome, categoria, quantidade, quantidade_minima, unidade, custo_unitario)
  VALUES (v_rest_id, 'Brownie Unidade', 'Panificação', 20, 4, 'un', 4.00)
  RETURNING id INTO v_e_brownie;

  -- ── Vínculos produto ↔ estoque ───────────────────────────────
  INSERT INTO produto_estoque (produto_id, estoque_id, quantidade) VALUES (v_p_pepsi,   v_e_pepsi,   1);
  INSERT INTO produto_estoque (produto_id, estoque_id, quantidade) VALUES (v_p_suco,    v_e_suco,    1);
  INSERT INTO produto_estoque (produto_id, estoque_id, quantidade) VALUES (v_p_agua,    v_e_agua,    1);
  INSERT INTO produto_estoque (produto_id, estoque_id, quantidade) VALUES (v_p_burger,  v_e_pao,     1);
  INSERT INTO produto_estoque (produto_id, estoque_id, quantidade) VALUES (v_p_burger,  v_e_carne,   1);
  INSERT INTO produto_estoque (produto_id, estoque_id, quantidade) VALUES (v_p_frango,  v_e_frango,  1);
  INSERT INTO produto_estoque (produto_id, estoque_id, quantidade) VALUES (v_p_batata,  v_e_batata,  1);
  -- Combo consome: 1 pão + 1 carne + 1 batata + 1 Pepsi
  INSERT INTO produto_estoque (produto_id, estoque_id, quantidade) VALUES (v_p_combo,   v_e_pao,     1);
  INSERT INTO produto_estoque (produto_id, estoque_id, quantidade) VALUES (v_p_combo,   v_e_carne,   1);
  INSERT INTO produto_estoque (produto_id, estoque_id, quantidade) VALUES (v_p_combo,   v_e_batata,  1);
  INSERT INTO produto_estoque (produto_id, estoque_id, quantidade) VALUES (v_p_combo,   v_e_pepsi,   1);
  INSERT INTO produto_estoque (produto_id, estoque_id, quantidade) VALUES (v_p_acai,    v_e_acai,    1);
  INSERT INTO produto_estoque (produto_id, estoque_id, quantidade) VALUES (v_p_brownie, v_e_brownie, 1);
END $$;
