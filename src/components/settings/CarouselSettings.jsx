import { useState, useRef } from 'react';
import { Plus, Trash2, ImageIcon, AlertCircle, Upload, Link, Loader2 } from 'lucide-react';
import { useOrdersContext } from '../../context/OrdersContext';
import { apiFetch } from '../../lib/supabase';
import Button from '../shared/Button';
import './CarouselSettings.css';

function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1200;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function CarouselSettings() {
  const { restaurantSettings, updateSettings } = useOrdersContext();
  const images = restaurantSettings.carouselImages || [];

  const [adding, setAdding]         = useState(false);
  const [urlInput, setUrlInput]     = useState('');
  const [tituloInput, setTituloInput] = useState('');
  const [uploading, setUploading]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [dragOver, setDragOver]     = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) { alert('Arquivo muito grande. Máximo: 10 MB'); return; }
    setUploading(true);
    setPreviewError(false);
    try {
      const base64 = await compressImage(file);
      const res = await apiFetch('/menu/products/upload-image', {
        method: 'POST',
        body: JSON.stringify({ base64 }),
      });
      if (res?.url) {
        setUrlInput(res.url);
      } else {
        alert('Erro ao fazer upload: ' + (res?.message || 'tente novamente'));
      }
    } catch (err) {
      alert('Erro ao fazer upload: ' + (err?.message || String(err)));
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleAdd = async () => {
    const url = urlInput.trim();
    if (!url || previewError) return;
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

  const cancelAdding = () => {
    setAdding(false);
    setUrlInput('');
    setTituloInput('');
    setPreviewError(false);
  };

  return (
    <div className="crs-wrap">
      <p className="crs-hint">
        As imagens aparecem em ordem no carrossel do cardápio do cliente.
        Enquanto não houver imagens cadastradas, o carrossel não é exibido.
      </p>

      {images.length === 0 && !adding ? (
        <div className="crs-empty">
          <ImageIcon size={36} strokeWidth={1.5} />
          <p>Nenhuma imagem cadastrada ainda.</p>
          <p style={{ fontSize: 'var(--font-xs)' }}>O carrossel não aparece no cardápio até você adicionar a primeira imagem.</p>
        </div>
      ) : (
        <div className="crs-list">
          {images.map((img, idx) => (
            <div key={img.id} className="crs-item">
              <div className="crs-thumb">
                <img src={img.url} alt={img.titulo || `Slide ${idx + 1}`} />
              </div>
              <div className="crs-item-info">
                <div className="crs-item-titulo">
                  {img.titulo || <em className="crs-no-title">Sem título</em>}
                </div>
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
          {/* Drop zone */}
          <div
            className={`crs-drop-zone ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''} ${urlInput ? 'has-image' : ''}`}
            onClick={() => !uploading && fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files?.[0])}
            />
            {uploading ? (
              <div className="crs-dz-content">
                <Loader2 size={28} className="crs-spin" />
                <span>Enviando imagem...</span>
              </div>
            ) : urlInput && !previewError ? (
              <div className="crs-dz-preview">
                <img
                  src={urlInput}
                  alt="preview"
                  onError={() => setPreviewError(true)}
                  onLoad={() => setPreviewError(false)}
                />
                <div className="crs-dz-preview-overlay">
                  <Upload size={18} />
                  <span>Clique para trocar</span>
                </div>
              </div>
            ) : (
              <div className="crs-dz-content">
                <Upload size={28} strokeWidth={1.5} />
                <strong>Clique ou arraste uma imagem</strong>
                <span>JPG, PNG ou WebP · máx 10 MB</span>
              </div>
            )}
          </div>

          {/* URL fallback */}
          <div className="crs-url-row">
            <Link size={14} className="crs-url-icon" />
            <input
              className="crs-input crs-url-input"
              placeholder="Ou cole uma URL de imagem..."
              value={urlInput}
              onChange={e => { setUrlInput(e.target.value); setPreviewError(false); }}
            />
          </div>

          {previewError && urlInput && (
            <div className="crs-preview-error">
              <AlertCircle size={14} />
              <span>URL inválida ou imagem inacessível.</span>
            </div>
          )}

          <input
            className="crs-input"
            placeholder="Título do slide (opcional)"
            value={tituloInput}
            onChange={e => setTituloInput(e.target.value)}
          />

          <div className="crs-form-btns">
            <Button
              onClick={handleAdd}
              disabled={!urlInput.trim() || previewError || saving || uploading}
            >
              {saving ? 'Salvando...' : 'Adicionar slide'}
            </Button>
            <button className="crs-cancel-btn" onClick={cancelAdding}>Cancelar</button>
          </div>
        </div>
      ) : (
        <Button icon={<Plus size={15} />} onClick={() => setAdding(true)}>
          Adicionar imagem
        </Button>
      )}
    </div>
  );
}
