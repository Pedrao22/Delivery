export const customers = [
  { id: 1, name: 'Lucas Oliveira', phone: '(11) 98765-4321', address: 'Rua das Flores, 123 - Apt 42, Centro', orders: 15, points: 320, since: '2025-03' },
  { id: 2, name: 'Ana Beatriz', phone: '(11) 91234-5678', address: 'Av. Brasil, 456', orders: 8, points: 180, since: '2025-06' },
  { id: 3, name: 'Ricardo Santos', phone: '(11) 99876-1234', address: 'Av. Paulista, 1500 - Sala 301', orders: 22, points: 540, since: '2024-12' },
  { id: 4, name: 'Mariana Costa', phone: '(11) 97654-3210', address: 'Rua Augusta, 789', orders: 5, points: 90, since: '2025-08' },
  { id: 5, name: 'Fernando Almeida', phone: '(11) 95432-1098', address: 'Rua Augusta, 789 - Apt 15', orders: 31, points: 780, since: '2024-08' },
  { id: 6, name: 'Camila Rodrigues', phone: '(11) 98321-6543', address: 'Rua Oscar Freire, 200', orders: 12, points: 260, since: '2025-02' },
  { id: 7, name: 'Gabriel Martins', phone: '(11) 96789-0123', address: 'Rua Oscar Freire, 456', orders: 19, points: 440, since: '2024-11' },
  { id: 8, name: 'Juliana Souza', phone: '(11) 94567-8901', address: 'Rua Faria Lima, 1200', orders: 3, points: 50, since: '2025-09' },
  { id: 9, name: 'Pedro Henrique', phone: '(11) 93456-7890', address: 'Rua Consolação, 321 - Apt 7', orders: 27, points: 650, since: '2024-10' },
  { id: 10, name: 'Isabela Lima', phone: '(11) 92345-6789', address: 'Av. Rebouças, 500', orders: 6, points: 120, since: '2025-07' },
];

export const loyaltyTiers = [
  { name: 'Bronze', minPoints: 0, maxPoints: 199, color: '#CD7F32', benefits: ['5% de desconto em pedidos acima de R$50'] },
  { name: 'Prata', minPoints: 200, maxPoints: 499, color: '#C0C0C0', benefits: ['10% de desconto', 'Entrega grátis 1x/semana'] },
  { name: 'Ouro', minPoints: 500, maxPoints: 999, color: '#FFD700', benefits: ['15% de desconto', 'Entrega grátis', 'Sobremesa grátis 1x/mês'] },
  { name: 'Platina', minPoints: 1000, maxPoints: Infinity, color: '#E5E4E2', benefits: ['20% de desconto', 'Entrega grátis', 'Sobremesa grátis', 'Acesso antecipado a novidades'] },
];
