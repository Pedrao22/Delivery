import React, { useState } from 'react';
import {
  Building2, CreditCard, Palette, Clock,
  Save, Globe, Phone, MapPin, Check,
  Camera, Briefcase, Bell, QrCode, Wallet, Info,
  Sparkles, ShieldCheck, Zap, DollarSign,
  Lock, Eye, EyeOff, KeyRound
} from 'lucide-react';
import { useOrdersContext } from '../context/OrdersContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/supabase';
import Button from '../components/shared/Button';
import './SettingsPage.css';

const tabs = [
  { id: 'general', label: 'Informações Gerais', icon: Building2 },
  { id: 'payments', label: 'Pagamentos', icon: CreditCard },
  { id: 'branding', label: 'Identidade Visual', icon: Palette },
  { id: 'ops', label: 'Operacional', icon: Clock },
  { id: 'security', label: 'Segurança', icon: Lock },
];

export default function SettingsPage() {
  const { restaurantSettings, updateSettings } = useOrdersContext();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState(restaurantSettings);
  const [saveStatus, setSaveStatus] = useState(null);

  // Password change state
  const [pwForm, setPwForm] = useState({ newPassword: '', confirmPassword: '' });
  const [pwStatus, setPwStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [pwError, setPwError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Sync locally when settings change in context
  React.useEffect(() => {
    setFormData(restaurantSettings);
  }, [restaurantSettings]);

  const handleSave = async () => {
    setSaveStatus('loading');
    try {
      await updateSettings(formData);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handlePasswordChange = async () => {
    setPwError('');
    if (pwForm.newPassword.length < 6) {
      setPwError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('As senhas não coincidem.');
      return;
    }
    setPwStatus('loading');
    try {
      await apiFetch('/auth/password', {
        method: 'PATCH',
        body: JSON.stringify({ password: pwForm.newPassword }),
      });
      setPwStatus('success');
      setPwForm({ newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwStatus(null), 4000);
    } catch (err) {
      setPwError(err.message || 'Erro ao alterar senha.');
      setPwStatus('error');
      setTimeout(() => setPwStatus(null), 4000);
    }
  };

  const togglePayment = (method) => {
    setFormData(prev => ({
      ...prev,
      payments: {
        ...prev.payments,
        [method]: !prev.payments[method]
      }
    }));
  };

  const renderInput = (label, icon, value, key, type = "text", placeholder = "", extra = {}) => (
    <div className="settings-form-group">
      <label>{label}</label>
      <div className="settings-input-wrapper">
        {icon && React.createElement(icon, { size: 18, className: "settings-input-icon" })}
        <input 
          type={type} 
          className="settings-input"
          value={value}
          placeholder={placeholder}
          onChange={e => setFormData({...formData, [key]: e.target.value})}
          {...extra}
        />
      </div>
    </div>
  );

  return (
    <div className="settings-container">
      <header className="settings-header">
        <div className="settings-header-info">
          <h2>Configurações</h2>
          <p>Gerencie a identidade e o funcionamento do seu negócio</p>
        </div>
        <button 
          className={`settings-order-btn ${saveStatus === 'success' ? 'success' : ''}`}
          onClick={handleSave}
          style={{
            background: saveStatus === 'success' ? 'var(--success)' : 'var(--accent)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: 'var(--radius-lg)',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          {saveStatus === 'success' ? <><Check size={18} /> Salvo!</> : <><Save size={18} /> Salvar Alterações</>}
        </button>
      </header>

      <div className="settings-grid">
        <aside className="settings-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
          
          <div style={{ marginTop: 'auto', padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent)', fontWeight: 700 }}>
              <Sparkles size={16} />
              <span style={{ fontSize: '0.75rem' }}>Plano Prime Ativo</span>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Você tem acesso a todas as funcionalidades premium.</p>
          </div>
        </aside>

        <main className="settings-card">
          {activeTab === 'general' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <h3 className="settings-section-title"><Building2 size={20} /> Informações do Negócio</h3>
              <div className="settings-form-grid">
                {renderInput("Nome do Restaurante", Building2, formData.name, "name", "text", "Ex: Pedi&Recebe")}
                {renderInput("CNPJ / CPF", Briefcase, formData.cnpj, "cnpj", "text", "00.000.000/0000-00")}
                {renderInput("WhatsApp / Telefone", Phone, formData.phone, "phone")}
                {renderInput("E-mail de Contato", Bell, "contato@pedirecebe.com.br", "email", "email")}
              </div>
              <div className="settings-form-group" style={{ marginTop: 'var(--space-6)' }}>
                <label>Endereço Completo</label>
                <div className="settings-input-wrapper">
                  <MapPin size={18} className="settings-input-icon" style={{ top: '16px', transform: 'none' }} />
                  <textarea 
                    className="settings-input settings-textarea"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    placeholder="Rua, número, bairro, cidade..."
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <h3 className="settings-section-title"><CreditCard size={20} /> Meios de Pagamento</h3>
              
              <div className="settings-payment-grid">
                {[
                  { id: 'pix_online', label: 'Pix Online', icon: QrCode },
                  { id: 'pix_balcao', label: 'Pix Balcão', icon: QrCode },
                  { id: 'card_debit', label: 'Débito', icon: Wallet },
                  { id: 'card_credit', label: 'Crédito', icon: CreditCard },
                  { id: 'cash', label: 'Dinheiro', icon: Info },
                ].map(method => (
                  <div 
                    key={method.id}
                    className={`payment-toggle ${formData.payments[method.id] ? 'active' : ''}`}
                    onClick={() => togglePayment(method.id)}
                  >
                    <div className="payment-toggle-info">
                      <method.icon size={20} />
                      <span>{method.label}</span>
                    </div>
                    <div className="payment-checkbox">
                      {formData.payments[method.id] && <Check size={14} />}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ 
                marginTop: 'var(--space-8)', 
                padding: 'var(--space-6)', 
                background: 'var(--bg-secondary)', 
                borderRadius: 'var(--radius-xl)',
                border: '2px dashed var(--border-light)'
              }}>
                <h4 style={{ fontSize: 'var(--font-sm)', fontWeight: 800, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={16} color="var(--accent)" /> Configuração Rápida de Recebimento
                </h4>
                {renderInput("Chave PIX", QrCode, formData.pixKey, "pixKey", "text", "E-mail, CPF ou Aleatória")}
                <p style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>As chaves cadastradas serão utilizadas para gerar QR codes de pagamento.</p>
              </div>
            </div>
          )}

          {activeTab === 'branding' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <h3 className="settings-section-title"><Palette size={20} /> Identidade Visual</h3>
              
              <div className="branding-preview">
                <div className="logo-container" style={{ background: `linear-gradient(135deg, ${formData.primaryColor}22, ${formData.primaryColor}44)` }}>
                  {formData.logo}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontWeight: 700, marginBottom: 'var(--space-2)' }}>Ícone Representativo</h4>
                  <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-4)' }}>Escolha um ícone que combine com seu negócio para aparecer na aba do cliente.</p>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {['🍔', '🍕', '🍣', '🥗', '🍦', '🍩', '🍰', '☕', '🥤', '🍺', '🍸', '🍱'].map(emoji => (
                      <button 
                        key={emoji}
                        onClick={() => setFormData({...formData, logo: emoji})}
                        style={{ 
                          fontSize: '1.5rem', 
                          width: '56px',
                          height: '56px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '16px',
                          border: formData.logo === emoji ? `2px solid var(--accent)` : '1px solid var(--border-light)',
                          background: formData.logo === emoji ? 'var(--accent-lighter)' : 'var(--surface)',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: formData.logo === emoji ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                          transform: formData.logo === emoji ? 'scale(1.05)' : 'scale(1)'
                        }}
                        onMouseEnter={(e) => {
                          if (formData.logo !== emoji) e.currentTarget.style.background = 'var(--bg-secondary)';
                        }}
                        onMouseLeave={(e) => {
                          if (formData.logo !== emoji) e.currentTarget.style.background = 'var(--surface)';
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 'var(--space-8)' }}>
                <h4 style={{ fontWeight: 700, marginBottom: 'var(--space-4)' }}>Cor de Destaque</h4>
                <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
                  {['#e74c3c', '#27ae60', '#2980b9', '#f39c12', '#8e44ad', '#2c3e50', '#ff4757', '#1e90ff'].map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData({...formData, primaryColor: color})}
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: color,
                        border: formData.primaryColor === color ? '4px solid white' : 'none',
                        boxShadow: formData.primaryColor === color ? `0 0 0 3px ${color}` : 'var(--shadow-sm)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    />
                  ))}
                  <div style={{ height: '30px', width: '1px', background: 'var(--border-light)', margin: '0 8px' }} />
                  <input 
                    type="color" 
                    value={formData.primaryColor}
                    onChange={e => setFormData({...formData, primaryColor: e.target.value})}
                    style={{ width: '44px', height: '44px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ops' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <h3 className="settings-section-title"><Clock size={20} /> Operações</h3>
              
              <div className="settings-form-grid">
                {renderInput("Valor Mínimo (R$)", DollarSign, formData.minOrder, "minOrder", "number")}
                {renderInput("Tempo de Entrega", Clock, formData.deliveryTime, "deliveryTime", "text", "Ex: 40-50 min")}
              </div>

              <div className={`ops-status-card ${formData.isOpen ? 'open' : 'closed'}`}>
                <div>
                  <span className="status-badge" style={{ background: formData.isOpen ? 'var(--success)' : 'var(--danger)', color: 'white' }}>
                    {formData.isOpen ? 'Ativo' : 'Pausado'}
                  </span>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Sua Loja está {formData.isOpen ? 'ABERTA' : 'FECHADA'}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '350px' }}>
                    {formData.isOpen ? 'Os clientes podem realizar pedidos normalmente pelo site.' : 'Novos pedidos estão temporariamente bloqueados para os clientes.'}
                  </p>
                </div>
                <button 
                  onClick={() => setFormData({...formData, isOpen: !formData.isOpen})}
                  style={{
                    padding: '16px 32px',
                    borderRadius: 'var(--radius-xl)',
                    border: 'none',
                    background: formData.isOpen ? 'white' : 'var(--success)',
                    color: formData.isOpen ? 'var(--danger)' : 'white',
                    fontWeight: 900,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s'
                  }}
                >
                  {formData.isOpen ? 'FECHAR AGORA' : 'ABRIR AGORA'}
                </button>
              </div>
              
              <div style={{ marginTop: 'var(--space-8)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <ShieldCheck size={20} color="var(--success)" />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>As alterações de status são aplicadas instantaneamente em todos os canais de venda.</span>
              </div>
            </div>
          )}
          {activeTab === 'security' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <h3 className="settings-section-title"><Lock size={20} /> Segurança da Conta</h3>

              <div style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Conta: <strong>{profile?.email || '—'}</strong>
                </p>
              </div>

              <h4 style={{ fontWeight: 700, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={18} color="var(--accent)" /> Alterar Senha
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: '420px' }}>
                <div className="settings-form-group">
                  <label>Nova Senha</label>
                  <div className="settings-input-wrapper" style={{ position: 'relative' }}>
                    <Lock size={18} className="settings-input-icon" />
                    <input
                      type={showNew ? 'text' : 'password'}
                      className="settings-input"
                      placeholder="Mínimo 6 caracteres"
                      value={pwForm.newPassword}
                      onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                      style={{ paddingRight: '44px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(v => !v)}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}
                    >
                      {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="settings-form-group">
                  <label>Confirmar Nova Senha</label>
                  <div className="settings-input-wrapper" style={{ position: 'relative' }}>
                    <Lock size={18} className="settings-input-icon" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      className="settings-input"
                      placeholder="Repita a nova senha"
                      value={pwForm.confirmPassword}
                      onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
                      style={{ paddingRight: '44px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {pwError && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 600 }}>{pwError}</p>
                )}

                {pwStatus === 'success' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontWeight: 700, fontSize: '0.9rem' }}>
                    <Check size={18} /> Senha alterada com sucesso!
                  </div>
                )}

                <button
                  onClick={handlePasswordChange}
                  disabled={pwStatus === 'loading' || !pwForm.newPassword}
                  style={{
                    padding: '14px 28px',
                    background: pwStatus === 'success' ? 'var(--success)' : 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: pwStatus === 'loading' ? 'wait' : 'pointer',
                    opacity: (!pwForm.newPassword || pwStatus === 'loading') ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                    boxShadow: 'var(--shadow-md)',
                    alignSelf: 'flex-start',
                  }}
                >
                  {pwStatus === 'loading' ? (
                    <>
                      <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                      Salvando...
                    </>
                  ) : pwStatus === 'success' ? (
                    <><Check size={18} /> Salvo!</>
                  ) : (
                    <><Lock size={18} /> Alterar Senha</>
                  )}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
