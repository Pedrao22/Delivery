import { useState, useMemo } from 'react';
import { 
  MessageSquare, Search, Send, UserPlus, 
  MoreVertical, Phone, Video, Smile, Paperclip,
  CheckCheck, ShoppingBag
} from 'lucide-react';
import { useOrdersContext } from '../context/OrdersContext';
import { useNavigate } from 'react-router-dom';
import SearchInput from '../components/shared/SearchInput';
import Button from '../components/shared/Button';
import './ChatPage.css';

export default function ChatPage() {
  const { leads, addLeadMessage, markLeadAsRead } = useOrdersContext();
  const [search, setSearch] = useState('');
  const [activeLeadId, setActiveLeadId] = useState(null);
  const [input, setInput] = useState('');
  const navigate = useNavigate();

  const filteredLeads = useMemo(() => {
    return leads.filter(l => 
      l.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      l.customer.phone.includes(search)
    );
  }, [leads, search]);

  const activeLead = useMemo(() => 
    leads.find(l => l.id === activeLeadId), 
  [leads, activeLeadId]);

  const handleSelectLead = (id) => {
    setActiveLeadId(id);
    markLeadAsRead(id);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !activeLeadId) return;
    addLeadMessage(activeLeadId, input, 'admin');
    setInput('');
  };

  const handleConvertToOrder = () => {
    if (!activeLead) return;
    // Redirect to PDV with customer info pre-filled
    navigate('/pdv', { state: { customer: activeLead.customer, fromLead: activeLead.id } });
  };

  return (
    <div className="chat-page">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2><MessageSquare className="text-accent" /> Conversas</h2>
          <SearchInput 
            value={search} 
            onChange={setSearch} 
            placeholder="Buscar leads..." 
          />
        </div>

        <div className="chat-list">
          {filteredLeads.map(lead => {
            const initials = lead.customer.name.split(' ').map(n => n[0]).join('').slice(0, 2);
            return (
              <div 
                key={lead.id} 
                className={`chat-item ${activeLeadId === lead.id ? 'active' : ''} ${lead.unread ? 'unread' : ''}`}
                onClick={() => handleSelectLead(lead.id)}
              >
                <div className="chat-item-avatar">{initials}</div>
                <div className="chat-item-info">
                  <div className="chat-item-header">
                    <span className="chat-item-name">{lead.customer.name}</span>
                    <span className="chat-item-time">{lead.time}</span>
                  </div>
                  <div className="chat-item-msg">{lead.lastMessage}</div>
                </div>
                {lead.unread && <div className="chat-unread-dot" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      {activeLeadId ? (
        <div className="chat-main">
          <header className="chat-main-header">
            <div className="chat-header-user">
              <div className="chat-item-avatar">
                {activeLead.customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div className="chat-header-name">{activeLead.customer.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--success)' }}>online agora</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button 
                variant="outline" 
                icon={<ShoppingBag size={18} />} 
                onClick={handleConvertToOrder}
              >
                Gerar Pedido
              </Button>
              <Button variant="ghost" size="sm" icon={<Phone size={18} />} />
              <Button variant="ghost" size="sm" icon={<MoreVertical size={18} />} />
            </div>
          </header>

          <div className="chat-messages">
            {activeLead.chat.map((msg, i) => (
              <div key={i} className={`chat-bubble ${msg.sender}`}>
                <div className="bubble-text">{msg.text}</div>
                <div className="bubble-time">
                  {msg.time}
                  {msg.sender === 'admin' && <CheckCheck size={12} style={{ marginLeft: 4, color: '#34b7f1' }} />}
                </div>
              </div>
            ))}
          </div>

          <form className="chat-footer" onSubmit={handleSend}>
            <button type="button" className="text-tertiary"><Smile size={24} /></button>
            <button type="button" className="text-tertiary"><Paperclip size={24} /></button>
            <div className="chat-input-wrapper">
              <input 
                type="text" 
                placeholder="Digite uma mensagem..." 
                value={input}
                onChange={e => setInput(e.target.value)}
              />
            </div>
            <button type="submit" className="chat-send-btn">
              <Send size={20} />
            </button>
          </form>
        </div>
      ) : (
        <div className="chat-empty">
          <div className="chat-empty-icon">
            <MessageSquare size={120} style={{ opacity: 0.05 }} />
          </div>
          <h3>Suas conversas com leads</h3>
          <p>Selecione um cliente no menu lateral para iniciar o atendimento.</p>
        </div>
      )}
    </div>
  );
}
