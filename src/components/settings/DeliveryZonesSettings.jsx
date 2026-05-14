import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, Check, X, MapPin, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../../lib/supabase';
import { useOrdersContext } from '../../context/OrdersContext';
import './DeliveryZonesSettings.css';

function ZoneRow({ zone, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ label: zone.label || '', min_km: zone.min_km, max_km: zone.max_km, fee: zone.fee });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(zone.id, { ...form, min_km: parseFloat(form.min_km), max_km: parseFloat(form.max_km), fee: parseFloat(form.fee) });
    setSaving(false);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="dz-row editing">
        <input className="dz-input sm" placeholder="Rótulo (ex: Zona 1)" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
        <div className="dz-range-wrap">
          <input className="dz-input num" type="number" min="0" step="0.5" placeholder="De (km)" value={form.min_km} onChange={e => setForm(f => ({ ...f, min_km: e.target.value }))} />
          <span className="dz-range-sep">–</span>
          <input className="dz-input num" type="number" min="0" step="0.5" placeholder="Até (km)" value={form.max_km} onChange={e => setForm(f => ({ ...f, max_km: e.target.value }))} />
        </div>
        <div className="dz-fee-wrap">
          <span className="dz-fee-prefix">R$</span>
          <input className="dz-input num" type="number" min="0" step="0.50" placeholder="Taxa" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} />
        </div>
        <div className="dz-row-actions">
          <button className="dz-icon-btn save" onClick={handleSave} disabled={saving} title="Salvar">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          </button>
          <button className="dz-icon-btn cancel" onClick={() => setEditing(false)} title="Cancelar">
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dz-row">
      <div className="dz-zone-label">{form.label || `${zone.min_km}–${zone.max_km} km`}</div>
      <div className="dz-zone-range">
        <MapPin size={12} />
        {zone.min_km} – {zone.max_km} km
      </div>
      <div className="dz-zone-fee">R$ {parseFloat(zone.fee).toFixed(2).replace('.', ',')}</div>
      <div className="dz-row-actions">
        <button className="dz-icon-btn edit" onClick={() => setEditing(true)} title="Editar">
          <Pencil size={14} />
        </button>
        <button className="dz-icon-btn delete" onClick={() => onDelete(zone.id)} title="Excluir">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default function DeliveryZonesSettings() {
  const { restaurantSettings } = useOrdersContext();

  const [zones, setZones]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [geocoding, setGeocoding]     = useState(false);
  const [geocodeMsg, setGeocodeMsg]   = useState(null);
  const [hasCoords, setHasCoords]     = useState(false);
  const [adding, setAdding]           = useState(false);
  const [newForm, setNewForm]         = useState({ label: '', min_km: '', max_km: '', fee: '' });
  const [saving, setSaving]           = useState(false);
  const [testAddr, setTestAddr]       = useState('');
  const [testResult, setTestResult]   = useState(null);
  const [testing, setTesting]         = useState(false);

  const loadZones = async () => {
    setLoading(true);
    try {
      const d = await apiFetch('/delivery-zones');
      setZones(d?.data ?? []);
    } catch {}
    finally { setLoading(false); }
  };

  // Check if restaurant already has coords
  useEffect(() => {
    setHasCoords(!!(restaurantSettings?.lat && restaurantSettings?.lng));
    loadZones();
  }, []);

  const handleGeocode = async () => {
    setGeocoding(true);
    setGeocodeMsg(null);
    try {
      const d = await apiFetch('/delivery-zones/geocode-restaurant', { method: 'POST' });
      if (d?.data) {
        setHasCoords(true);
        setGeocodeMsg({ ok: true, text: `Localização salva: ${d.data.lat.toFixed(5)}, ${d.data.lng.toFixed(5)}` });
      } else {
        setGeocodeMsg({ ok: false, text: 'Endereço não encontrado. Verifique o endereço em Configurações → Geral.' });
      }
    } catch {
      setGeocodeMsg({ ok: false, text: 'Erro ao geocodificar endereço.' });
    } finally {
      setGeocoding(false);
      setTimeout(() => setGeocodeMsg(null), 6000);
    }
  };

  const handleAdd = async () => {
    if (!newForm.min_km || !newForm.max_km || newForm.fee === '') return;
    setSaving(true);
    try {
      const d = await apiFetch('/delivery-zones', {
        method: 'POST',
        body: JSON.stringify({
          label: newForm.label || undefined,
          min_km: parseFloat(newForm.min_km),
          max_km: parseFloat(newForm.max_km),
          fee: parseFloat(newForm.fee),
          sort_order: zones.length,
        }),
      });
      if (d?.data) {
        setZones(prev => [...prev, d.data]);
        setNewForm({ label: '', min_km: '', max_km: '', fee: '' });
        setAdding(false);
      }
    } catch {}
    finally { setSaving(false); }
  };

  const handleUpdate = async (id, data) => {
    try {
      const d = await apiFetch(`/delivery-zones/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      if (d?.data) setZones(prev => prev.map(z => z.id === id ? d.data : z));
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir esta zona de entrega?')) return;
    try {
      await apiFetch(`/delivery-zones/${id}`, { method: 'DELETE' });
      setZones(prev => prev.filter(z => z.id !== id));
    } catch {}
  };

  const handleTest = async () => {
    if (!testAddr.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const d = await apiFetch('/delivery-zones/calculate', {
        method: 'POST',
        body: JSON.stringify({ address: testAddr }),
      });
      setTestResult(d?.data ?? null);
    } catch {
      setTestResult({ error: 'Erro ao calcular. Tente novamente.' });
    } finally { setTesting(false); }
  };

  const sortedZones = [...zones].sort((a, b) => a.min_km - b.min_km);

  return (
    <div className="dz-wrap">
      {/* Header */}
      <div className="dz-section-header">
        <div>
          <div className="dz-section-title">Zonas de Entrega por Km</div>
          <div className="dz-section-sub">Defina faixas de distância e o valor da taxa para cada uma</div>
        </div>
      </div>

      {/* Restaurant location status */}
      <div className={`dz-location-card ${hasCoords ? 'ok' : 'warn'}`}>
        <div className="dz-location-left">
          <MapPin size={18} />
          <div>
            <div className="dz-location-title">
              {hasCoords ? 'Localização do restaurante configurada' : 'Localização do restaurante não configurada'}
            </div>
            <div className="dz-location-sub">
              {hasCoords
                ? 'As distâncias serão calculadas a partir da coordenada salva.'
                : 'Configure o endereço em Geral e clique em "Definir Localização" para ativar o cálculo automático.'}
            </div>
          </div>
        </div>
        <button className="dz-geocode-btn" onClick={handleGeocode} disabled={geocoding}>
          {geocoding ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {hasCoords ? 'Atualizar Localização' : 'Definir Localização'}
        </button>
      </div>

      {geocodeMsg && (
        <div className={`dz-msg ${geocodeMsg.ok ? 'ok' : 'err'}`}>
          {geocodeMsg.ok ? <Check size={14} /> : <AlertTriangle size={14} />}
          {geocodeMsg.text}
        </div>
      )}

      {/* Zones list */}
      <div className="dz-card">
        <div className="dz-list-header">
          <span>Rótulo</span>
          <span>Distância</span>
          <span>Taxa</span>
          <span />
        </div>

        {loading ? (
          <div className="dz-loading"><Loader2 size={20} className="animate-spin" /></div>
        ) : sortedZones.length === 0 ? (
          <div className="dz-empty">
            <MapPin size={28} />
            <p>Nenhuma zona configurada ainda.</p>
            <p>Adicione faixas de km abaixo para ativar o cálculo automático.</p>
          </div>
        ) : (
          sortedZones.map(z => (
            <ZoneRow key={z.id} zone={z} onSave={handleUpdate} onDelete={handleDelete} />
          ))
        )}

        {/* Add new */}
        {adding ? (
          <div className="dz-row adding">
            <input className="dz-input sm" placeholder="Rótulo (ex: Centro)" value={newForm.label} onChange={e => setNewForm(f => ({ ...f, label: e.target.value }))} />
            <div className="dz-range-wrap">
              <input className="dz-input num" type="number" min="0" step="0.5" placeholder="De (km)" value={newForm.min_km} onChange={e => setNewForm(f => ({ ...f, min_km: e.target.value }))} />
              <span className="dz-range-sep">–</span>
              <input className="dz-input num" type="number" min="0" step="0.5" placeholder="Até (km)" value={newForm.max_km} onChange={e => setNewForm(f => ({ ...f, max_km: e.target.value }))} />
            </div>
            <div className="dz-fee-wrap">
              <span className="dz-fee-prefix">R$</span>
              <input className="dz-input num" type="number" min="0" step="0.50" placeholder="Taxa" value={newForm.fee} onChange={e => setNewForm(f => ({ ...f, fee: e.target.value }))} />
            </div>
            <div className="dz-row-actions">
              <button className="dz-icon-btn save" onClick={handleAdd} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              </button>
              <button className="dz-icon-btn cancel" onClick={() => setAdding(false)}>
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <button className="dz-add-btn" onClick={() => setAdding(true)}>
            <Plus size={14} /> Adicionar Zona
          </button>
        )}
      </div>

      {/* Example */}
      {zones.length === 0 && (
        <div className="dz-example">
          <div className="dz-example-title">Exemplo de configuração:</div>
          {[{ r: '0 – 5 km', f: 'R$ 5,00' }, { r: '5 – 10 km', f: 'R$ 8,00' }, { r: '10 – 15 km', f: 'R$ 12,00' }].map((e, i) => (
            <div key={i} className="dz-example-row">
              <span>{e.r}</span><span className="dz-example-fee">{e.f}</span>
            </div>
          ))}
        </div>
      )}

      {/* Test calculator */}
      <div className="dz-card dz-test-card">
        <div className="dz-test-title">🧪 Testar Cálculo de Distância</div>
        <div className="dz-test-row">
          <input
            className="dz-input full"
            placeholder="Ex: Rua das Flores, 123, São Paulo - SP"
            value={testAddr}
            onChange={e => setTestAddr(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTest()}
          />
          <button className="dz-test-btn" onClick={handleTest} disabled={testing || !testAddr.trim()}>
            {testing ? <Loader2 size={14} className="animate-spin" /> : 'Calcular'}
          </button>
        </div>
        {testResult && (
          <div className={`dz-test-result ${testResult.error ? 'err' : testResult.out_of_range ? 'warn' : 'ok'}`}>
            {testResult.error ? (
              <><AlertTriangle size={14} /> {testResult.error}</>
            ) : testResult.out_of_range ? (
              <><AlertTriangle size={14} /> Fora da área de entrega ({testResult.distance_km} km estimado)</>
            ) : (
              <>
                <Check size={14} />
                <span><strong>{testResult.distance_km} km</strong> estimado</span>
                <span className="dz-test-sep">·</span>
                <span>Taxa: <strong>R$ {parseFloat(testResult.fee).toFixed(2).replace('.', ',')}</strong></span>
                {testResult.zone?.label && <span className="dz-test-sep">·</span>}
                {testResult.zone?.label && <span className="dz-test-zone">{testResult.zone.label}</span>}
              </>
            )}
          </div>
        )}
        <p className="dz-test-note">A distância é estimada via linha reta × fator de rota (1,3×). O endereço do restaurante deve estar configurado.</p>
      </div>
    </div>
  );
}
