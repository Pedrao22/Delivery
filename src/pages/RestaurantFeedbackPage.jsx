import { useState } from 'react';
import { Lightbulb, Bug, Send, CheckCircle } from 'lucide-react';
import { API_URL } from '../lib/supabase';
import { useOrdersContext } from '../context/OrdersContext';
import TopBar from '../components/layout/TopBar';

export default function RestaurantFeedbackPage({ onMenuToggle }) {
  const { restaurantSettings } = useOrdersContext();
  const [tipo, setTipo] = useState('sugestao');
  const [mensagem, setMensagem] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!mensagem.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/public/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurante_id: restaurantSettings.id ?? null,
          tipo,
          mensagem: mensagem.trim(),
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setDone(true);
        setMensagem('');
      } else {
        setError(data?.message || 'Erro ao enviar. Tente novamente.');
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <TopBar title="Feedback" subtitle="Envie sugestões ou reporte problemas" onMenuClick={onMenuToggle} />

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 20px' }}>
        {done ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'var(--card-bg, rgba(255,255,255,0.04))',
            border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
            borderRadius: 16,
          }}>
            <CheckCircle size={52} style={{ color: 'var(--success, #27ae60)', marginBottom: 16 }} />
            <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)', fontWeight: 700 }}>
              Feedback enviado!
            </h3>
            <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Obrigado por nos ajudar a melhorar. Sua mensagem foi recebida pelo time.
            </p>
            <button
              onClick={() => setDone(false)}
              style={{
                padding: '10px 28px', borderRadius: 10, border: 'none',
                background: 'var(--accent, #e74c3c)', color: '#fff',
                fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
              }}
            >
              Enviar outro
            </button>
          </div>
        ) : (
          <div style={{
            background: 'var(--card-bg, rgba(255,255,255,0.04))',
            border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
            borderRadius: 16, padding: '28px 24px',
            display: 'flex', flexDirection: 'column', gap: 20,
          }}>
            <div>
              <p style={{ margin: '0 0 12px', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                Tipo de feedback
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { key: 'sugestao', icon: <Lightbulb size={16} />, label: 'Sugestão' },
                  { key: 'bug',      icon: <Bug size={16} />,       label: 'Bug / Erro' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setTipo(opt.key)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: 8, padding: '12px', borderRadius: 10, cursor: 'pointer',
                      fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.15s',
                      border: tipo === opt.key
                        ? `2px solid ${opt.key === 'bug' ? '#e74c3c' : 'var(--accent, #e74c3c)'}`
                        : '2px solid var(--border-color, rgba(255,255,255,0.1))',
                      background: tipo === opt.key
                        ? (opt.key === 'bug' ? 'rgba(231,76,60,0.1)' : 'rgba(231,76,60,0.1)')
                        : 'transparent',
                      color: tipo === opt.key
                        ? (opt.key === 'bug' ? '#e74c3c' : 'var(--accent, #e74c3c)')
                        : 'var(--text-secondary)',
                    }}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ margin: '0 0 8px', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                {tipo === 'sugestao' ? 'Descreva sua sugestão' : 'Descreva o problema encontrado'}
              </p>
              <textarea
                value={mensagem}
                onChange={e => setMensagem(e.target.value)}
                placeholder={
                  tipo === 'sugestao'
                    ? 'Ex: Seria ótimo ter uma funcionalidade para...'
                    : 'Ex: Ao clicar em X acontece Y...'
                }
                rows={6}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '12px 14px', borderRadius: 10,
                  border: '1.5px solid var(--border-color, rgba(255,255,255,0.1))',
                  background: 'var(--input-bg, rgba(255,255,255,0.05))',
                  color: 'var(--text-primary)', fontSize: '0.9rem',
                  resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                  lineHeight: 1.6,
                }}
              />
            </div>

            {error && (
              <p style={{ margin: 0, color: '#e74c3c', fontSize: '0.85rem', fontWeight: 600 }}>{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!mensagem.trim() || submitting}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '14px', borderRadius: 10, border: 'none',
                background: mensagem.trim() ? 'var(--accent, #e74c3c)' : 'var(--border-color, rgba(255,255,255,0.1))',
                color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                cursor: mensagem.trim() && !submitting ? 'pointer' : 'not-allowed',
                opacity: submitting ? 0.7 : 1, transition: 'all 0.15s',
              }}
            >
              <Send size={16} />
              {submitting ? 'Enviando...' : 'Enviar Feedback'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
