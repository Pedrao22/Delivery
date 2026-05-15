import { useState, useRef } from 'react';
import { Plus, Trash2, ImageIcon, AlertCircle, Upload, Link, Loader2 } from 'lucide-react';
import { useOrdersContext } from '../../context/OrdersContext';
import Button from '../shared/Button';
import './CarouselSettings.css';

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Imagem inválida'));
      img.onload = () => {
        const MAX = 700;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        if (width === 0 || height === 0) { reject(new Error('Dimensões inválidas')); return; }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function CarouselSettings() {
  const { restaurantSettings, updateSettings, refreshSettings } = useOrdersContext();
  const images = restaurantSettings.carouselImages || [];

  const [adding, setAdding]         = useState(false);
  const [fileBase64, setFileBase64] = useState('');   // base64 do arquivo escolhido
  const [urlInput, setUrlInput]     = useState('');   // URL digitada manualmente
  const [tituloInput, setTituloInput] = useState('');
  const [uploading, setUploading]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [dragOver, setDragOver]     = useState(false);
  const fileRef = useRef(null);

  // URL efetiva: arquivo carregado tem prioridade sobre URL digitada
  const effectiveUrl = fileBase64 || urlInput.trim();


  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) { alert('Arquivo muito grande. Máximo: 10 MB'); return; }
    setUploading(true);
    setPreviewError(false);
    try {
      const base64 = await compressImage(file);
      setFileBase64(base64);
      setUrlInput(''); // limpa URL manual ao escolher arquivo
    } catch (err) {
      alert('Erro ao processar imagem: ' + (err?.message || String(err)));
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
    const url = effectiveUrl;
    if (!url || previewError) return;
    setSaving(true);
    const newSlide = { id: `${Date.now()}`, url, titulo: tituloInput.trim() };
    await updateSettings({ carouselImages: [...images, newSlide] });
    await refreshSettings();
    setFileBase64('');
    setUrlInput('');
    setTituloInput('');
    setPreviewError(false);
    setAdding(false);
    setSaving(false);
  };

  const handleRemove = async (id) => {
    await updateSettings({ carouselImages: images.filter(img => img.id !== id) });
    await refreshSettings();
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
    setFileBase64('');
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
                <img
                  src={img.url}
                  alt={img.titulo || `Slide ${idx + 1}`}
                  onError={() => console.error('[Carousel] thumb load failed for id:', img.id, '| url prefix:', img.url?.substring(0, 40))}
                />
              </div>
              <div className="crs-item-info">
                <div className="crs-item-titulo">
                  {img.titulo || <em className="crs-no-title">Sem título</em>}
                </div>
                <div className="crs-item-url">
                  {img.url?.startsWith('data:') ? '📎 Imagem local (base64)' : img.url}
                </div>
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
            className={`crs-drop-zone ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''} ${effectiveUrl ? 'has-image' : ''}`}
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
                <span>Processando imagem...</span>
              </div>
            ) : effectiveUrl && !previewError ? (
              <div className="crs-dz-preview">
                <img
                  src={effectiveUrl}
                  alt="preview"
                  onError={() => { console.error('[Carousel] preview load failed'); setPreviewError(true); }}
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

          {/* URL manual (só aparece quando não há arquivo selecionado) */}
          {!fileBase64 && (
            <div className="crs-url-row">
              <Link size={14} className="crs-url-icon" />
              <input
                className="crs-input crs-url-input"
                placeholder="Ou cole uma URL de imagem..."
                value={urlInput}
                onChange={e => { setUrlInput(e.target.value); setPreviewError(false); }}
              />
            </div>
          )}

          {fileBase64 && (
            <div className="crs-url-row">
              <button
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                onClick={() => { setFileBase64(''); setPreviewError(false); }}
              >
                ✕ Remover imagem selecionada
              </button>
            </div>
          )}

          {previewError && effectiveUrl && (
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
              disabled={!effectiveUrl || previewError || saving || uploading}
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
