import React from 'react';
import './PrintReceipt.css';

export default function PrintReceipt({ order, settings }) {
  if (!order) return null;

  const qrCodeUrl = settings.pixKey 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(settings.pixKey)}`
    : null;

  return (
    <div className="print-receipt-container">
      <div className="receipt-header">
        <span className="receipt-logo">{settings.logo || '🍔'}</span>
        <h1>{settings.name || 'Pedi&Recebe'}</h1>
        <p>{settings.address}</p>
        <p>{settings.phone}</p>
        <div className="receipt-divider"></div>
        <div className="receipt-order-info">
          <span className="receipt-code">PEDIDO {order.codigo}</span>
          <span className="receipt-date">{new Date(order.criado_em || Date.now()).toLocaleString('pt-BR')}</span>
        </div>
      </div>

      <div className="receipt-section">
        <div className="receipt-divider"></div>
        <div className="receipt-items">
          <div className="item-header">
            <span>Qtd Item</span>
            <span>Total</span>
          </div>
          {order.items?.map((item, i) => (
            <div key={i} className="item-row">
              <div className="item-details">
                <span className="item-name">{item.qty}x {item.nome}</span>
                {item.variation && <span className="item-sub">Sabor/Tam: {item.variation}</span>}
                {item.complements?.length > 0 && (
                  <span className="item-sub">Adicionais: {item.complements.join(', ')}</span>
                )}
                {item.obs && <span className="item-obs">Obs: {item.obs}</span>}
              </div>
              <span className="item-price">R$ {(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="receipt-divider"></div>
      </div>

      <div className="receipt-summary">
        <div className="summary-row">
          <span>Subtotal</span>
          <span>R$ {(order.total - (order.delivery_fee || 0) + (order.discounts || 0)).toFixed(2)}</span>
        </div>
        {order.delivery_fee > 0 && (
          <div className="summary-row">
            <span>Taxa de Entrega</span>
            <span>R$ {parseFloat(order.delivery_fee).toFixed(2)}</span>
          </div>
        )}
        {order.discounts > 0 && (
          <div className="summary-row discount">
            <span>Desconto</span>
            <span>- R$ {parseFloat(order.discounts).toFixed(2)}</span>
          </div>
        )}
        <div className="summary-total">
          <span>TOTAL</span>
          <span>R$ {parseFloat(order.total).toFixed(2)}</span>
        </div>
      </div>

      <div className="receipt-customer">
        <div className="receipt-divider"></div>
        <h4>DADOS DE ENTREGA</h4>
        <p><strong>Cliente:</strong> {order.cliente_nome}</p>
        <p><strong>Telefone:</strong> {order.cliente_telefone}</p>
        {order.cliente_endereco && (
          <p><strong>Endereço:</strong> {order.cliente_endereco}</p>
        )}
        {order.tipo && <p><strong>Tipo:</strong> {order.tipo.toUpperCase()}</p>}
        <p><strong>Pagamento:</strong> {order.pagamento}</p>
      </div>

      {qrCodeUrl && order.pagamento?.toLowerCase().includes('pix') && (
        <div className="receipt-pix">
          <div className="receipt-divider"></div>
          <p>PAGUE COM PIX</p>
          <img src={qrCodeUrl} alt="QR Code PIX" />
          <span className="pix-key-label">{settings.pixKey}</span>
        </div>
      )}

      <div className="receipt-footer">
        <div className="receipt-divider"></div>
        <p>Obrigado pela preferência!</p>
        <p>www.pedirecebe.com.br</p>
      </div>
    </div>
  );
}
