export const menuCategories = [
  { id: 'hamburgueres', name: 'Hambúrgueres', icon: '🍔' },
  { id: 'pizzas', name: 'Pizzas', icon: '🍕' },
  { id: 'bebidas', name: 'Bebidas', icon: '🥤' },
  { id: 'acompanhamentos', name: 'Acompanhamentos', icon: '🍟' },
  { id: 'sobremesas', name: 'Sobremesas', icon: '🍰' },
  { id: 'saladas', name: 'Saladas', icon: '🥗' },
];

export const menuItems = [
  // Hambúrgueres
  {
    id: 1,
    name: 'Smash Burger Clássico',
    description: 'Pão brioche, blend bovino 150g, queijo cheddar, cebola caramelizada, picles e molho especial',
    price: 32.90,
    category: 'hamburgueres',
    image: '🍔',
    bestseller: true,
    rating: 4.8,
    prepTime: '15-20 min',
    variations: [
      { id: 'v1', name: 'Simples', price: 0 },
      { id: 'v2', name: 'Duplo', price: 12 },
      { id: 'v3', name: 'Triplo', price: 22 },
    ],
    complements: [
      { id: 'c1', name: 'Bacon crocante', price: 5 },
      { id: 'c2', name: 'Ovo frito', price: 4 },
      { id: 'c3', name: 'Cebola crispy', price: 3 },
      { id: 'c4', name: 'Jalapeño', price: 3 },
      { id: 'c5', name: 'Queijo extra', price: 5 },
    ]
  },
  {
    id: 2,
    name: 'Burger BBQ Supremo',
    description: 'Pão australiano, blend 180g, onion rings, bacon, queijo prato e molho BBQ defumado',
    price: 38.90,
    category: 'hamburgueres',
    image: '🍔',
    bestseller: true,
    rating: 4.9,
    prepTime: '18-25 min',
    variations: [
      { id: 'v1', name: 'Simples', price: 0 },
      { id: 'v2', name: 'Duplo', price: 14 },
    ],
    complements: [
      { id: 'c1', name: 'Bacon extra', price: 5 },
      { id: 'c2', name: 'Cheddar extra', price: 5 },
      { id: 'c3', name: 'Onion rings extra', price: 6 },
    ]
  },
  {
    id: 3,
    name: 'Chicken Burger Crispy',
    description: 'Pão com gergelim, filé de frango empanado crocante, salada, tomate e maionese de ervas',
    price: 29.90,
    category: 'hamburgueres',
    image: '🍗',
    bestseller: false,
    rating: 4.6,
    prepTime: '15-20 min',
    variations: [
      { id: 'v1', name: 'Normal', price: 0 },
      { id: 'v2', name: 'Duplo', price: 10 },
    ],
    complements: [
      { id: 'c1', name: 'Bacon', price: 5 },
      { id: 'c2', name: 'Queijo cheddar', price: 5 },
    ]
  },
  {
    id: 4,
    name: 'Veggie Burger',
    description: 'Pão integral, hambúrguer de grão-de-bico e quinoa, rúcula, tomate seco e molho tahine',
    price: 31.90,
    category: 'hamburgueres',
    image: '🥬',
    bestseller: false,
    rating: 4.5,
    prepTime: '15 min',
    variations: [],
    complements: [
      { id: 'c1', name: 'Abacate', price: 4 },
      { id: 'c2', name: 'Cogumelos', price: 5 },
    ]
  },
  {
    id: 5,
    name: 'Burger Trufado',
    description: 'Pão negro, blend wagyu 200g, queijo brie, rúcula, tomate confit e aioli trufado',
    price: 49.90,
    category: 'hamburgueres',
    image: '🍔',
    bestseller: true,
    rating: 4.9,
    prepTime: '20-25 min',
    variations: [
      { id: 'v1', name: 'Simples', price: 0 },
      { id: 'v2', name: 'Duplo', price: 20 },
    ],
    complements: [
      { id: 'c1', name: 'Foie gras', price: 15 },
      { id: 'c2', name: 'Bacon trufado', price: 8 },
    ]
  },
  {
    id: 6,
    name: 'Smash Kids',
    description: 'Mini pão, blend 80g, queijo, ketchup e batata frita',
    price: 22.90,
    category: 'hamburgueres',
    image: '🍔',
    bestseller: false,
    rating: 4.7,
    prepTime: '10-15 min',
    variations: [],
    complements: [
      { id: 'c1', name: 'Nuggets (3un)', price: 6 },
      { id: 'c2', name: 'Suco natural', price: 5 },
    ]
  },

  // Pizzas
  {
    id: 7,
    name: 'Margherita Especial',
    description: 'Molho de tomate San Marzano, muçarela de búfala, manjericão fresco e azeite extra virgem',
    price: 45.90,
    category: 'pizzas',
    image: '🍕',
    bestseller: true,
    rating: 4.8,
    prepTime: '20-25 min',
    variations: [
      { id: 'v1', name: 'Médio (6 fatias)', price: 0 },
      { id: 'v2', name: 'Grande (8 fatias)', price: 12 },
      { id: 'v3', name: 'Família (12 fatias)', price: 22 },
    ],
    complements: [
      { id: 'c1', name: 'Borda recheada', price: 8 },
      { id: 'c2', name: 'Oregano extra', price: 2 },
    ]
  },
  {
    id: 8,
    name: 'Pepperoni Premium',
    description: 'Molho de tomate, muçarela, pepperoni importado e pimenta calabresa',
    price: 48.90,
    category: 'pizzas',
    image: '🍕',
    bestseller: true,
    rating: 4.9,
    prepTime: '20-25 min',
    variations: [
      { id: 'v1', name: 'Médio', price: 0 },
      { id: 'v2', name: 'Grande', price: 12 },
      { id: 'v3', name: 'Família', price: 22 },
    ],
    complements: [
      { id: 'c1', name: 'Borda recheada', price: 8 },
      { id: 'c2', name: 'Extra pepperoni', price: 6 },
    ]
  },
  {
    id: 9,
    name: 'Quatro Queijos',
    description: 'Muçarela, gorgonzola, parmesão e catupiry gratinado',
    price: 46.90,
    category: 'pizzas',
    image: '🧀',
    bestseller: false,
    rating: 4.7,
    prepTime: '20-25 min',
    variations: [
      { id: 'v1', name: 'Médio', price: 0 },
      { id: 'v2', name: 'Grande', price: 12 },
    ],
    complements: [
      { id: 'c1', name: 'Borda de cheddar', price: 9 },
    ]
  },
  {
    id: 10,
    name: 'Frango com Catupiry',
    description: 'Frango desfiado temperado, catupiry cremoso, milho e orégano',
    price: 44.90,
    category: 'pizzas',
    image: '🍕',
    bestseller: false,
    rating: 4.6,
    prepTime: '20-25 min',
    variations: [
      { id: 'v1', name: 'Médio', price: 0 },
      { id: 'v2', name: 'Grande', price: 12 },
      { id: 'v3', name: 'Família', price: 22 },
    ],
    complements: [
      { id: 'c1', name: 'Borda recheada', price: 8 },
    ]
  },
  {
    id: 11,
    name: 'Portuguesa Gourmet',
    description: 'Presunto parma, ovos caipira, cebola roxa, azeitona preta e muçarela',
    price: 47.90,
    category: 'pizzas',
    image: '🍕',
    bestseller: false,
    rating: 4.5,
    prepTime: '20-30 min',
    variations: [
      { id: 'v1', name: 'Médio', price: 0 },
      { id: 'v2', name: 'Grande', price: 12 },
    ],
    complements: [
      { id: 'c1', name: 'Borda de catupiry', price: 8 },
    ]
  },

  // Bebidas
  {
    id: 12,
    name: 'Coca-Cola',
    description: 'Coca-Cola gelada 350ml',
    price: 6.90,
    category: 'bebidas',
    image: '🥤',
    bestseller: true,
    rating: 4.5,
    prepTime: '1 min',
    variations: [
      { id: 'v1', name: '350ml', price: 0 },
      { id: 'v2', name: '600ml', price: 3 },
      { id: 'v3', name: '1L', price: 5 },
      { id: 'v4', name: '2L', price: 8 },
    ],
    complements: []
  },
  {
    id: 13,
    name: 'Suco Natural',
    description: 'Suco natural feito na hora - Laranja, Limão, Abacaxi ou Maracujá',
    price: 9.90,
    category: 'bebidas',
    image: '🧃',
    bestseller: false,
    rating: 4.8,
    prepTime: '5 min',
    variations: [
      { id: 'v1', name: 'Laranja', price: 0 },
      { id: 'v2', name: 'Limão', price: 0 },
      { id: 'v3', name: 'Abacaxi', price: 0 },
      { id: 'v4', name: 'Maracujá', price: 1 },
    ],
    complements: []
  },
  {
    id: 14,
    name: 'Milkshake Artesanal',
    description: 'Milkshake cremoso com calda e chantilly',
    price: 18.90,
    category: 'bebidas',
    image: '🥛',
    bestseller: true,
    rating: 4.9,
    prepTime: '8 min',
    variations: [
      { id: 'v1', name: 'Chocolate', price: 0 },
      { id: 'v2', name: 'Morango', price: 0 },
      { id: 'v3', name: 'Ovomaltine', price: 2 },
      { id: 'v4', name: 'Nutella', price: 4 },
    ],
    complements: [
      { id: 'c1', name: 'Cobertura extra', price: 3 },
      { id: 'c2', name: 'Calda de caramelo', price: 3 },
    ]
  },
  {
    id: 15,
    name: 'Água Mineral',
    description: 'Água mineral sem gás 500ml',
    price: 4.90,
    category: 'bebidas',
    image: '💧',
    bestseller: false,
    rating: 5.0,
    prepTime: '1 min',
    variations: [
      { id: 'v1', name: 'Sem gás', price: 0 },
      { id: 'v2', name: 'Com gás', price: 0 },
    ],
    complements: []
  },
  {
    id: 16,
    name: 'Cerveja Artesanal',
    description: 'Cerveja artesanal local - IPA, Pilsen ou Wheat',
    price: 14.90,
    category: 'bebidas',
    image: '🍺',
    bestseller: false,
    rating: 4.7,
    prepTime: '1 min',
    variations: [
      { id: 'v1', name: 'IPA', price: 0 },
      { id: 'v2', name: 'Pilsen', price: 0 },
      { id: 'v3', name: 'Wheat', price: 2 },
    ],
    complements: []
  },
  {
    id: 17,
    name: 'Chá Gelado',
    description: 'Chá gelado artesanal com frutas frescas',
    price: 8.90,
    category: 'bebidas',
    image: '🍵',
    bestseller: false,
    rating: 4.4,
    prepTime: '3 min',
    variations: [
      { id: 'v1', name: 'Pêssego', price: 0 },
      { id: 'v2', name: 'Limão', price: 0 },
      { id: 'v3', name: 'Frutos vermelhos', price: 2 },
    ],
    complements: []
  },

  // Acompanhamentos
  {
    id: 18,
    name: 'Batata Frita Crocante',
    description: 'Batata frita sequinha com tempero especial da casa',
    price: 16.90,
    category: 'acompanhamentos',
    image: '🍟',
    bestseller: true,
    rating: 4.7,
    prepTime: '10 min',
    variations: [
      { id: 'v1', name: 'Porção individual', price: 0 },
      { id: 'v2', name: 'Porção grande', price: 8 },
    ],
    complements: [
      { id: 'c1', name: 'Cheddar e bacon', price: 8 },
      { id: 'c2', name: 'Molho especial', price: 3 },
      { id: 'c3', name: 'Parmesão e trufas', price: 10 },
    ]
  },
  {
    id: 19,
    name: 'Onion Rings',
    description: 'Anéis de cebola empanados com especiarias',
    price: 18.90,
    category: 'acompanhamentos',
    image: '🧅',
    bestseller: false,
    rating: 4.6,
    prepTime: '10 min',
    variations: [
      { id: 'v1', name: 'Porção (8un)', price: 0 },
      { id: 'v2', name: 'Porção grande (14un)', price: 8 },
    ],
    complements: [
      { id: 'c1', name: 'Molho barbecue', price: 3 },
    ]
  },
  {
    id: 20,
    name: 'Nuggets Artesanais',
    description: 'Nuggets de frango artesanais com molho à escolha',
    price: 19.90,
    category: 'acompanhamentos',
    image: '🍗',
    bestseller: false,
    rating: 4.5,
    prepTime: '12 min',
    variations: [
      { id: 'v1', name: '6 unidades', price: 0 },
      { id: 'v2', name: '10 unidades', price: 8 },
    ],
    complements: [
      { id: 'c1', name: 'Molho honey mustard', price: 3 },
      { id: 'c2', name: 'Molho ranch', price: 3 },
    ]
  },
  {
    id: 21,
    name: 'Mandioca Frita',
    description: 'Mandioca frita crocante com tempero verde',
    price: 15.90,
    category: 'acompanhamentos',
    image: '🥔',
    bestseller: false,
    rating: 4.4,
    prepTime: '12 min',
    variations: [],
    complements: [
      { id: 'c1', name: 'Catupiry', price: 4 },
    ]
  },
  {
    id: 22,
    name: 'Mix de Petiscos',
    description: 'Combinação de batata, onion rings, nuggets e mandioca',
    price: 34.90,
    category: 'acompanhamentos',
    image: '🍽️',
    bestseller: true,
    rating: 4.8,
    prepTime: '15 min',
    variations: [],
    complements: [
      { id: 'c1', name: 'Molho extra', price: 3 },
    ]
  },

  // Sobremesas
  {
    id: 23,
    name: 'Brownie com Sorvete',
    description: 'Brownie quentinho de chocolate belga com sorvete de baunilha e calda',
    price: 22.90,
    category: 'sobremesas',
    image: '🍫',
    bestseller: true,
    rating: 4.9,
    prepTime: '10 min',
    variations: [
      { id: 'v1', name: 'Calda de chocolate', price: 0 },
      { id: 'v2', name: 'Calda de caramelo', price: 0 },
      { id: 'v3', name: 'Calda de morango', price: 0 },
    ],
    complements: [
      { id: 'c1', name: 'Sorvete extra', price: 5 },
      { id: 'c2', name: 'Chantilly', price: 3 },
    ]
  },
  {
    id: 24,
    name: 'Petit Gâteau',
    description: 'Bolo de chocolate com coração derretido, sorvete de creme e frutas vermelhas',
    price: 26.90,
    category: 'sobremesas',
    image: '🎂',
    bestseller: true,
    rating: 4.9,
    prepTime: '15 min',
    variations: [],
    complements: [
      { id: 'c1', name: 'Frutas frescas extra', price: 5 },
    ]
  },
  {
    id: 25,
    name: 'Cheesecake',
    description: 'Cheesecake cremoso com calda de frutas vermelhas',
    price: 19.90,
    category: 'sobremesas',
    image: '🍰',
    bestseller: false,
    rating: 4.7,
    prepTime: '5 min',
    variations: [
      { id: 'v1', name: 'Frutas vermelhas', price: 0 },
      { id: 'v2', name: 'Maracujá', price: 0 },
      { id: 'v3', name: 'Chocolate', price: 2 },
    ],
    complements: []
  },
  {
    id: 26,
    name: 'Açaí Premium',
    description: 'Açaí puro batido com frutas, granola e mel',
    price: 24.90,
    category: 'sobremesas',
    image: '🫐',
    bestseller: false,
    rating: 4.6,
    prepTime: '8 min',
    variations: [
      { id: 'v1', name: '300ml', price: 0 },
      { id: 'v2', name: '500ml', price: 8 },
      { id: 'v3', name: '700ml', price: 14 },
    ],
    complements: [
      { id: 'c1', name: 'Leite em pó', price: 2 },
      { id: 'c2', name: 'Paçoca', price: 3 },
      { id: 'c3', name: 'Nutella', price: 5 },
      { id: 'c4', name: 'Leite condensado', price: 3 },
    ]
  },

  // Saladas
  {
    id: 27,
    name: 'Caesar Salad',
    description: 'Alface romana, croutons, parmesão, frango grelhado e molho caesar',
    price: 28.90,
    category: 'saladas',
    image: '🥗',
    bestseller: true,
    rating: 4.7,
    prepTime: '10 min',
    variations: [
      { id: 'v1', name: 'Com frango', price: 0 },
      { id: 'v2', name: 'Com camarão', price: 12 },
    ],
    complements: [
      { id: 'c1', name: 'Bacon', price: 5 },
      { id: 'c2', name: 'Ovo cozido', price: 3 },
    ]
  },
  {
    id: 28,
    name: 'Salada Tropical',
    description: 'Mix de folhas, manga, abacate, tomate cereja, nozes e vinagrete de maracujá',
    price: 26.90,
    category: 'saladas',
    image: '🥗',
    bestseller: false,
    rating: 4.5,
    prepTime: '8 min',
    variations: [],
    complements: [
      { id: 'c1', name: 'Frango desfiado', price: 6 },
      { id: 'c2', name: 'Queijo cottage', price: 4 },
    ]
  },
  {
    id: 29,
    name: 'Bowl Proteico',
    description: 'Arroz integral, frango, ovo, abacate, edamame e molho teriyaki',
    price: 32.90,
    category: 'saladas',
    image: '🥙',
    bestseller: false,
    rating: 4.6,
    prepTime: '12 min',
    variations: [
      { id: 'v1', name: 'Com frango', price: 0 },
      { id: 'v2', name: 'Com salmão', price: 10 },
    ],
    complements: [
      { id: 'c1', name: 'Edamame extra', price: 4 },
    ]
  },
  {
    id: 30,
    name: 'Salada Caprese',
    description: 'Tomate italiano, muçarela de búfala, manjericão e redução balsâmica',
    price: 24.90,
    category: 'saladas',
    image: '🍅',
    bestseller: false,
    rating: 4.4,
    prepTime: '5 min',
    variations: [],
    complements: [
      { id: 'c1', name: 'Presunto parma', price: 8 },
    ]
  },
];
