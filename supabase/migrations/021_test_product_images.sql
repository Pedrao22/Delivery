-- Adiciona imagens reais (Unsplash) nos produtos de teste
UPDATE produtos
SET imagem_url = CASE nome
  WHEN 'Coca-Cola 350ml'
    THEN 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=500&h=400&fit=crop&q=80'
  WHEN 'Pepsi 350ml'
    THEN 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=500&h=400&fit=crop&q=80'
  WHEN 'Suco Natural 300ml'
    THEN 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&h=400&fit=crop&q=80'
  WHEN 'Água Mineral 500ml'
    THEN 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=500&h=400&fit=crop&q=80'
  WHEN 'X-Burguer'
    THEN 'https://images.unsplash.com/photo-1568901346375-9b15d7b6f159?w=500&h=400&fit=crop&q=80'
  WHEN 'Frango Grelhado'
    THEN 'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=500&h=400&fit=crop&q=80'
  WHEN 'Batata Frita P'
    THEN 'https://images.unsplash.com/photo-1576107232684-1279f0a8bf01?w=500&h=400&fit=crop&q=80'
  WHEN 'Combo X-Burguer + Batata + Bebida'
    THEN 'https://images.unsplash.com/photo-1552611052-33e04de5552b?w=500&h=400&fit=crop&q=80'
  WHEN 'Açaí 300ml'
    THEN 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=500&h=400&fit=crop&q=80'
  WHEN 'Brownie'
    THEN 'https://images.unsplash.com/photo-1564355808539-0776c7c67f9b?w=500&h=400&fit=crop&q=80'
  ELSE imagem_url
END
WHERE nome IN (
  'Coca-Cola 350ml', 'Pepsi 350ml', 'Suco Natural 300ml', 'Água Mineral 500ml',
  'X-Burguer', 'Frango Grelhado', 'Batata Frita P',
  'Combo X-Burguer + Batata + Bebida', 'Açaí 300ml', 'Brownie'
)
AND restaurante_id = (
  SELECT id FROM restaurantes WHERE status = 'active' ORDER BY criado_em LIMIT 1
);
