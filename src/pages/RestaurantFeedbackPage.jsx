import { useState, useRef } from 'react';
import { Lightbulb, Bug, Send, CheckCircle, ImagePlus, X, AlertCircle, Megaphone } from 'lucide-react';
import { API_URL } from '../lib/supabase';
import { useOrdersContext } from '../context/OrdersContext';
import TopBar from '../components/layout/TopBar';
import './RestaurantFeedbackPage.css';

const MAX_CHARS = 1000;
const MAX_IMAGES = 4;

const TIPOS = [
  {
    key: 'sugestao',
    icon: '💡',
    name: 'Sugestão',
    desc: 'Ideia para melhorar o sistema',
    color: '#FFC107',
  },
  {
    key: 'bug',
    icon: '🐛',
    name: 'Bug / Erro',
    desc: 'Algo não está funcionando',
    color: '#E53935',
  },
];

async function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 800;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) { height = Math.round((height * MAX_DIM) / width); width = MAX_DIM; }
          else { width = Math.round((width * MAX_DIM) / height); height = MAX_DIM; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.65));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function RestaurantFeedbackPage({ onMenuToggle }) {
  const { restaurantSettings } = useOrdersContext();
  const [tipo, setTipo] = useState('sugestao');
  const [mensagem, setMensagem] = useState('');
  const [imagens, setImagens] = useState([]); // [{ preview: base64, data: base64 }]
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleFiles = async (files) => {
    const slots = MAX_IMAGES - imagens.length;
    if (slots <= 0) return;
    const accepted = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, slots);
    const compressed = await Promise.all(accepted.map(compressImage));
    setImagens(prev => [...prev, ...compressed.map(data => ({ data, preview: data }))]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (idx) => setImagens(prev => prev.filter((_, i) => i !== idx));

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
          imagens: imagens.map(i => i.data),
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setDone(true);
        setMensagem('');
        setImagens([]);
      } else {
        setError(data?.message || 'Erro ao enviar. Tente novamente.');
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const charsLeft = MAX_CHARS - mensagem.length;

  return (
    <>
      <TopBar title="Feedback" subtitle="Envie sugestões ou reporte problemas" onMenuClick={onMenuToggle} />

      <div className="rfp-page">
        {/* Hero */}
        <div className="rfp-hero">
          <div className="rfp-hero-icon">
            <Megaphone size={28} />
          </div>
          <div className="rfp-hero-text">
            <h2>Sua opinião importa</h2>
            <p>Ajude-nos a melhorar o sistema. Reporte problemas ou sugira novas funcionalidades e nossa equipe irá analisar.</p>
          </div>
        </div>

        {/* Form or Success */}
        <div className="rfp-card">
          {done ? (
            <div className="rfp-success">
              <div className="rfp-success-circle">
                <CheckCircle size={40} />
              </div>
              <h3>Feedback enviado!</h3>
              <p>Obrigado por nos ajudar a evoluir. Sua mensagem foi recebida pelo time e será analisada em breve.</p>
              <button className="rfp-success-again" onClick={() => setDone(false)}>
                Enviar outro feedback
              </button>
            </div>
          ) : (
            <>
              {/* Tipo */}
              <div>
                <p className="rfp-label">Tipo de feedback</p>
                <div className="rfp-tipo-grid">
                  {TIPOS.map(t => (
                    <button
                      key={t.key}
                      className={`rfp-tipo-btn ${tipo === t.key ? 'active' : ''}`}
                      data-tipo={t.key}
                      onClick={() => setTipo(t.key)}
                      style={tipo === t.key ? { '--tipo-color': t.color } : {}}
                    >
                      <div
                        className="rfp-tipo-icon"
                        style={{
                          background: tipo === t.key ? `${t.color}18` : 'var(--bg-primary, #fff)',
                          fontSize: '1.5rem',
                        }}
                      >
                        {t.icon}
                      </div>
                      <span className="rfp-tipo-name">{t.name}</span>
                      <span className="rfp-tipo-desc">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mensagem */}
              <div>
                <p className="rfp-label">
                  {tipo === 'sugestao' ? 'Descreva sua sugestão' : 'Descreva o problema encontrado'}
                </p>
                <div className="rfp-textarea-wrap">
                  <textarea
                    className="rfp-textarea"
                    value={mensagem}
                    onChange={e => setMensagem(e.target.value.slice(0, MAX_CHARS))}
                    placeholder={
                      tipo === 'sugestao'
                        ? 'Ex: Seria ótimo ter uma funcionalidade que...'
                        : 'Ex: Ao clicar em X acontece Y, na tela Z...'
                    }
                    rows={6}
                  />
                  <span className={`rfp-char-count ${charsLeft < 50 ? 'warn' : ''}`}>
                    {charsLeft}
                  </span>
                </div>
              </div>

              {/* Image upload */}
              <div>
                <p className="rfp-label">Imagens (opcional · máx. {MAX_IMAGES})</p>

                {imagens.length < MAX_IMAGES && (
                  <div
                    className={`rfp-upload-zone ${dragOver ? 'drag-over' : ''}`}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    <div className="rfp-upload-icon">
                      <ImagePlus size={22} />
                    </div>
                    <span className="rfp-upload-title">Clique ou arraste uma imagem</span>
                    <span className="rfp-upload-hint">PNG, JPG, GIF · até {MAX_IMAGES - imagens.length} restante{MAX_IMAGES - imagens.length !== 1 ? 's' : ''}</span>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      onChange={e => handleFiles(e.target.files)}
                    />
                  </div>
                )}

                {imagens.length > 0 && (
                  <div className="rfp-thumbs" style={{ marginTop: imagens.length < MAX_IMAGES ? 12 : 0 }}>
                    {imagens.map((img, idx) => (
                      <div key={idx} className="rfp-thumb">
                        <img src={img.preview} alt={`screenshot ${idx + 1}`} />
                        <button className="rfp-thumb-remove" onClick={() => removeImage(idx)}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="rfp-error">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                className="rfp-submit"
                onClick={handleSubmit}
                disabled={!mensagem.trim() || submitting}
              >
                {submitting ? (
                  <>
                    <span className="rfp-spinner" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Enviar Feedback
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
