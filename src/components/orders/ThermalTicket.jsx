import './ThermalTicket.css';

const TYPE_LABEL = { delivery: 'Delivery 🛵', pickup: 'Retirada 🏪', local: 'Mesa 🍽️' };

function line(char = '-', len = 32) {
  return char.repeat(len);
}

function fmt(val) {
  return `R$ ${Number(val || 0).toFixed(2).replace('.', ',')}`;
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function ThermalTicket({ order, restaurantName }) {
  if (!order) return null;

  const items = (order.items || []).filter(i => i && typeof i === 'object' && !Array.isArray(i));
  const customer = order.customer || {};
  const hasDelivery = order.type === 'delivery';
  const hasMesa = order.type === 'local';

  return (
    <div id="thermal-ticket-root" className="thermal-ticket">

      {/* Header */}
      <div className="tt-center tt-bold tt-lg">{restaurantName || 'RESTAURANTE'}</div>
      <div className="tt-sep">{line('=')}</div>

      {/* Pedido info */}
      <div className="tt-row">
        <span className="tt-bold">PEDIDO #{(order.confirmCode || order.id || '').slice(-6).toUpperCase()}</span>
        <span>{fmtDate(order.createdAt)}</span>
      </div>
      <div className="tt-row">
        <span className="tt-bold">TIPO:</span>
        <span>{TYPE_LABEL[order.type] || order.type || '—'}</span>
      </div>
      {hasMesa && order.mesa_id && (
        <div className="tt-row"><span className="tt-bold">MESA:</span><span>{order.mesa_id}</span></div>
      )}

      <div className="tt-sep">{line()}</div>

      {/* Cliente */}
      <div className="tt-bold tt-sm">CLIENTE</div>
      <div className="tt-line">{customer.name || '—'}</div>
      {customer.phone && <div className="tt-line tt-sm">{customer.phone}</div>}
      {hasDelivery && customer.address && (
        <div className="tt-line tt-sm">{customer.address}</div>
      )}

      <div className="tt-sep">{line()}</div>

      {/* Itens */}
      <div className="tt-bold tt-sm">ITENS</div>
      {items.length === 0 && <div className="tt-line tt-sm">—</div>}
      {items.map((item, i) => {
        const name  = item.nome || item.name || '?';
        const qty   = item.qty  || item.quantity || item.qtd || 1;
        const price = item.unitPrice ?? item.price ?? item.preco ?? 0;
        const subtotal = Number(price) * Number(qty);
        const extras = [
          item.variation,
          ...(Array.isArray(item.complements) ? item.complements.map(c => c.name || c) : []),
        ].filter(Boolean);
        const obs = item.obs || item.observacao;

        return (
          <div key={i} className="tt-item">
            <div className="tt-row">
              <span>{qty}x {name}</span>
              <span>{fmt(subtotal)}</span>
            </div>
            {extras.length > 0 && (
              <div className="tt-extra tt-sm"> + {extras.join(' • ')}</div>
            )}
            {obs && <div className="tt-extra tt-sm"> obs: {obs}</div>}
          </div>
        );
      })}

      <div className="tt-sep">{line()}</div>

      {/* Totais */}
      {order.discounts > 0 && (
        <div className="tt-row tt-sm">
          <span>Subtotal</span><span>{fmt(order.subtotal)}</span>
        </div>
      )}
      {order.discounts > 0 && (
        <div className="tt-row tt-sm">
          <span>Desconto</span><span>- {fmt(order.discounts)}</span>
        </div>
      )}
      <div className="tt-row tt-bold">
        <span>TOTAL</span><span>{fmt(order.total)}</span>
      </div>
      <div className="tt-row tt-sm">
        <span>Pagamento</span><span>{order.payment || '—'}</span>
      </div>

      <div className="tt-sep">{line('=')}</div>
      <div className="tt-center tt-sm">Obrigado pela preferência!</div>
      <div className="tt-spacer" />
    </div>
  );
}
