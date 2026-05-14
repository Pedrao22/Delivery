import { useState } from 'react';
import { Plus, Trash2, ImageIcon, AlertCircle } from 'lucide-react';
import { useOrdersContext } from '../../context/OrdersContext';
import Button from '../shared/Button';
import './CarouselSettings.css';

export default function CarouselSettings() {
  const { restaurantSettings, updateSettings } = useOrdersContext();
  const images = restaurantSettings.carouselImages || [];

  const [urlInput, setUrlInput] = useState('');
  const [tituloInput, setTituloInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const handleAdd = async () => {
    const url = urlInput.trim();
    if (!url) return;
    setSaving(true);
    const newSlide = { id: `${Date.now()}`, url, titulo: tituloInput.trim() };
    await updateSettings({ carouselImages: [...images, newSlide] });
    setUrlInput('');
    setTituloInput('');
    setPreviewError(false);
    setAdding(false);
    setSaving(false);
  };

  const handleRemove = async (id) => {
    await updateSettings({ carouselImages: images.filter(img => img.id !== id) });
  };

  const handleMoveUp = async (idx) => {
    if (idx === 0) return;
    const next = [...images];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    await updateSettings({ carouselImages: next });
  };

  const handleMoveDown = async (idx) => {
    if (idx === images.length - 1) return;
    const next = [...images];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    await updateSettings({ carouselImages: next });
  };

  return (
    <div className="crs-wrap">
      <p className="crs-hint">
        As imagens aparecem em ordem no carrossel do cardápio do cliente.
        Cole a URL de qualquer imagem hospedada (ex: upload no Supabase Storage, Imgur, etc).
      </p>

      {images.length === 0 ? (
        <div className="crs-empty">
          <ImageIcon size={36} strokeWidth={1.5} />
          <p>Nenhuma imagem cadastrada ainda.</p>
          <p>Quando vazio, o carrossel exibe automaticamente os produtos com foto.</p>
        </div>
      ) : (
        <div className="crs-list">
          {images.map((img, idx) => (
            <div key={img.id} className="crs-item">
              <div className="crs-thumb">
                <img src={img.url} alt={img.titulo || `Slide ${idx + 1}`} />
              </div>
              <div className="crs-item-info">
                <div className="crs-item-titulo">{img.titulo || <em className="crs-no-title">Sem título</em>}</div>
                <div className="crs-item-url">{img.url}</div>
              </div>
              <div className="crs-item-actions">
                <button
                  className="crs-order-btn"
                  onClick={() => handleMoveUp(idx)}
                  disabled={idx === 0}
                  title="Mover para cima"
                >▲</button>
                <button
                  className="crs-order-btn"
                  onClick={() => handleMoveDown(idx)}
                  disabled={idx === images.length - 1}
                  title="Mover para baixo"
                >▼</button>
                <button className="crs-remove-btn" onClick={() => handleRemove(img.id)} title="Remover">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="crs-form">
          <div className="crs-form-fields">
            <input
              className="crs-input"
              placeholder="URL da imagem (https://...)"
              value={urlInput}
              onChange={e => { setUrlInput(e.target.value); setPreviewError(false); }}
              autoFocus
            />
            <input
              className="crs-input"
              placeholder="Título do slide (opcional)"
              value={tituloInput}
              onChange={e => setTituloInput(e.target.value)}
            />
          </div>

          {urlInput.trim() && (
            <div className="crs-preview-box">
              {previewError ? (
                <div className="crs-preview-error">
                  <AlertCircle size={20} />
                  <span>Não foi possível carregar a imagem. Verifique a URL.</span>
                </div>
              ) : (
                <img
                  src={urlInput.trim()}
                  alt="preview"
                  onError={() => setPreviewError(true)}
                  onLoad={() => setPreviewError(false)}
                />
              )}
            </div>
          )}

          <div className="crs-form-btns">
            <Button
              onClick={handleAdd}
              disabled={!urlInput.trim() || previewError || saving}
            >
              {saving ? 'Salvando...' : 'Adicionar slide'}
            </Button>
            <button
              className="crs-cancel-btn"
              onClick={() => { setAdding(false); setUrlInput(''); setTituloInput(''); setPreviewError(false); }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <Button
          icon={<Plus size={15} />}
          onClick={() => setAdding(true)}
        >
          Adicionar imagem
        </Button>
      )}
    </div>
  );
}
