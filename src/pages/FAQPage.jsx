import { useState } from 'react';
import { ChevronDown, HelpCircle, Search } from 'lucide-react';
import './FAQPage.css';

const CATEGORIES = [
  {
    id: 'cardapio',
    emoji: '🍔',
    label: 'Cardápio & Produtos',
    items: [
      {
        q: 'Como adicionar um novo produto ao cardápio?',
        a: 'Acesse a aba "Cardápio" no menu lateral e clique em "+ Novo Produto". Preencha o nome, descrição, preço, categoria e foto. Clique em "Salvar" para publicar imediatamente no cardápio público.',
      },
      {
        q: 'Como editar ou excluir um produto existente?',
        a: 'Na aba "Cardápio", clique no card do produto que deseja alterar. No modal de edição, altere as informações e salve. Para excluir, use o botão "Excluir" no rodapé do modal — essa ação é irreversível.',
      },
      {
        q: 'Como criar categorias no cardápio?',
        a: 'Ao cadastrar ou editar um produto, você define a categoria dele no campo "Categoria". Novas categorias são criadas automaticamente ao salvar um produto com um nome de categoria inédito.',
      },
      {
        q: 'Como adicionar variações e complementos a um produto?',
        a: 'No modal de edição do produto, você encontra as seções "Variações" (ex.: tamanho P/M/G) e "Complementos" (ex.: extras, molhos). Adicione as opções com nome e preço adicional se houver.',
      },
      {
        q: 'Como colocar um produto em destaque ou marcá-lo como popular?',
        a: 'No modal de edição do produto, ative o toggle "Destaque" ou "Popular". Produtos marcados aparecem em seção especial no cardápio público para atrair mais atenção dos clientes.',
      },
    ],
  },
  {
    id: 'pedidos',
    emoji: '📋',
    label: 'Pedidos & Entregas',
    items: [
      {
        q: 'Como acompanhar os pedidos em tempo real?',
        a: 'A aba "Pedidos" atualiza automaticamente a cada poucos segundos. Os pedidos são organizados por status: Pendente → Preparando → Pronto → Entregue. Clique em qualquer pedido para ver todos os detalhes.',
      },
      {
        q: 'Como criar um pedido manualmente para um cliente?',
        a: 'Na aba "Pedidos", clique em "+ Novo Pedido". Selecione os itens do cardápio, informe os dados do cliente (nome, telefone, endereço), escolha a forma de pagamento e confirme.',
      },
      {
        q: 'Como configurar a taxa e o tempo estimado de entrega?',
        a: 'Acesse "Configurações" → aba "Operacional". Defina o valor fixo da taxa de entrega e o tempo estimado (ex.: 30 a 45 min). Essas informações aparecem automaticamente no resumo enviado ao cliente.',
      },
      {
        q: 'Como gerenciar os entregadores?',
        a: 'Acesse a aba "Entregas" no menu lateral. Lá você pode cadastrar entregadores, atribuir pedidos a eles e acompanhar o status de cada entrega em andamento.',
      },
      {
        q: 'O cliente recebe confirmação automática do pedido?',
        a: 'Sim. Quando um pedido é confirmado, o sistema envia automaticamente um resumo via WhatsApp com os itens, total, forma de pagamento e estimativa de entrega — tudo sem você precisar digitar nada.',
      },
    ],
  },
  {
    id: 'pagamentos',
    emoji: '💳',
    label: 'Pagamentos',
    items: [
      {
        q: 'Como configurar quais formas de pagamento aceitar?',
        a: 'Acesse "Configurações" → aba "Pagamentos". Ative ou desative individualmente: Pix, Cartão de Crédito, Cartão de Débito e Dinheiro. Somente as formas ativas aparecem para o cliente no checkout.',
      },
      {
        q: 'Como adicionar a chave Pix do restaurante?',
        a: 'Em "Configurações" → "Pagamentos", insira sua chave Pix no campo correspondente. Ela é exibida para o cliente na confirmação do pedido quando ele escolhe pagar via Pix.',
      },
      {
        q: 'Como criar cupons de desconto?',
        a: 'Acesse a aba "Cupons" no menu lateral. Clique em "+ Novo Cupom", defina o código, o tipo de desconto (percentual ou valor fixo), validade e limite de uso. O cliente insere o código no checkout.',
      },
      {
        q: 'Como acompanhar o faturamento do restaurante?',
        a: 'A aba "Dashboard" exibe o faturamento por período (hoje, 7 dias, 30 dias), ticket médio, volume de pedidos e mix de pagamentos. Para detalhes financeiros completos, acesse a aba "Financeiro".',
      },
    ],
  },
  {
    id: 'atendimento',
    emoji: '💬',
    label: 'Atendimento & WhatsApp',
    items: [
      {
        q: 'Como responder clientes pelo WhatsApp direto na plataforma?',
        a: 'Acesse a aba "Atendimento" no menu lateral. As conversas chegam automaticamente. Selecione a conversa do cliente e use o campo no rodapé para enviar mensagens em tempo real via WhatsApp.',
      },
      {
        q: 'Como aceitar ou encerrar um atendimento?',
        a: 'Na conversa aberta, use o botão "Aceitar" para mover o status de Pendente para Atendendo. Quando resolver o problema do cliente, clique em "Encerrar". Conversas encerradas ficam no histórico.',
      },
      {
        q: 'Como fazer um pedido para um cliente diretamente pelo chat?',
        a: 'Na aba "Atendimento", selecione a conversa e clique em "Fazer Pedido". O cardápio abre em um modal, você monta o pedido e confirma. O resumo é enviado automaticamente ao cliente via WhatsApp.',
      },
      {
        q: 'O sistema avisa quando chega uma nova mensagem?',
        a: 'Sim. Uma notificação aparece no canto da tela quando um cliente envia mensagem. O contador de não lidas fica visível na aba "Atendimento" no menu lateral.',
      },
    ],
  },
  {
    id: 'configuracoes',
    emoji: '⚙️',
    label: 'Configurações Gerais',
    items: [
      {
        q: 'Como abrir ou fechar o restaurante para receber pedidos?',
        a: 'Acesse "Configurações" → aba "Operacional". Use o toggle "Restaurante Aberto" para ativar ou desativar o recebimento de pedidos. Quando fechado, o cardápio público exibe um aviso de loja fechada.',
      },
      {
        q: 'Como alterar o nome, logo e cores do restaurante?',
        a: 'Acesse "Configurações" → aba "Perfil". Atualize o nome, descrição, upload do logo e a cor principal. As alterações refletem imediatamente no cardápio público dos clientes.',
      },
      {
        q: 'Como cadastrar o endereço do restaurante?',
        a: 'Em "Configurações" → "Perfil", preencha o campo "Endereço". Ele é usado automaticamente na mensagem enviada ao cliente quando ele escolhe a opção de retirada no local.',
      },
      {
        q: 'Como adicionar colaboradores ou atendentes ao sistema?',
        a: 'Atualmente o sistema opera com um perfil de administrador por restaurante. Para adicionar mais usuários, entre em contato com o suporte da Pedi&Recebe.',
      },
    ],
  },
];

export default function FAQPage() {
  const [search, setSearch] = useState('');
  const [openItem, setOpenItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const q = search.toLowerCase();

  const filtered = CATEGORIES.map(cat => ({
    ...cat,
    items: cat.items.filter(
      item =>
        item.q.toLowerCase().includes(q) ||
        item.a.toLowerCase().includes(q)
    ),
  })).filter(cat =>
    (activeCategory === 'all' || cat.id === activeCategory) && cat.items.length > 0
  );

  const toggleItem = (key) => setOpenItem(prev => (prev === key ? null : key));

  return (
    <div className="faq-page">
      {/* Hero */}
      <div className="faq-hero">
        <div className="faq-hero-icon">
          <HelpCircle size={32} />
        </div>
        <h1 className="faq-hero-title">Central de Ajuda</h1>
        <p className="faq-hero-sub">Encontre respostas rápidas para as dúvidas mais comuns do restaurante</p>

        <div className="faq-search-wrap">
          <Search size={16} className="faq-search-icon" />
          <input
            className="faq-search-input"
            type="text"
            placeholder="Buscar dúvida..."
            value={search}
            onChange={e => { setSearch(e.target.value); setActiveCategory('all'); }}
          />
        </div>
      </div>

      {/* Category pills */}
      {!search && (
        <div className="faq-cats">
          <button
            className={`faq-cat-btn${activeCategory === 'all' ? ' active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            Todas
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`faq-cat-btn${activeCategory === cat.id ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* FAQ list */}
      <div className="faq-sections">
        {filtered.length === 0 && (
          <div className="faq-empty">
            <HelpCircle size={36} />
            <p>Nenhum resultado para "{search}"</p>
          </div>
        )}
        {filtered.map(cat => (
          <div key={cat.id} className="faq-section">
            <div className="faq-section-title">
              <span className="faq-section-emoji">{cat.emoji}</span>
              {cat.label}
            </div>
            <div className="faq-card">
              {cat.items.map((item, i) => {
                const key = `${cat.id}-${i}`;
                const isOpen = openItem === key;
                return (
                  <div key={key} className={`faq-row${isOpen ? ' open' : ''}`}>
                    <button className="faq-row-q" onClick={() => toggleItem(key)}>
                      <span className="faq-row-text">{item.q}</span>
                      <ChevronDown size={16} className="faq-row-chevron" />
                    </button>
                    {isOpen && (
                      <div className="faq-row-a">{item.a}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="faq-footer">
        <p>Não encontrou o que precisava?</p>
        <p className="faq-footer-sub">Entre em contato com o suporte da Pedi&Recebe pelo WhatsApp ou email.</p>
      </div>
    </div>
  );
}
