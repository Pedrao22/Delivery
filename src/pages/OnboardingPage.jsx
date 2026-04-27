import { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';
import './OnboardingPage.css';

const SEGMENTS = [
  { id: 'hamburgueria',  label: 'Hamburgueria',      emoji: '🍔' },
  { id: 'pizzaria',      label: 'Pizzaria',           emoji: '🍕' },
  { id: 'japonesa',      label: 'Culinária Japonesa', emoji: '🍣' },
  { id: 'churrasco',     label: 'Churrascaria',       emoji: '🥩' },
  { id: 'cafeteria',     label: 'Cafeteria',          emoji: '☕' },
  { id: 'acai',          label: 'Açaí & Bebidas',     emoji: '🧋' },
  { id: 'lanchonete',    label: 'Lanchonete',         emoji: '🥪' },
  { id: 'restaurante',   label: 'Restaurante',        emoji: '🍱' },
  { id: 'fit',           label: 'Fit & Saudável',     emoji: '🥗' },
  { id: 'padaria',       label: 'Padaria & Doces',    emoji: '🍰' },
  { id: 'mexicano',      label: 'Mexicano',           emoji: '🌮' },
  { id: 'outro',         label: 'Outro',              emoji: '🍽️' },
];

const SERVICE_TYPES = [
  { id: 'delivery', label: 'Delivery',         emoji: '🛵', desc: 'Entrega no endereço' },
  { id: 'pickup',   label: 'Retirada',         emoji: '🏃', desc: 'Cliente retira no local' },
  { id: 'local',    label: 'Consumo no local', emoji: '🪑', desc: 'Mesas e salão' },
];

const DELIVERY_TIMES = [
  { id: '15-20',  label: 'Até 20 min',   desc: 'Para lanches rápidos' },
  { id: '20-40',  label: '20 a 40 min',  desc: 'Tempo médio padrão' },
  { id: '40-60',  label: '40 a 60 min',  desc: 'Pratos elaborados' },
  { id: '60+',    label: 'Mais de 1h',   desc: 'Pedidos especiais' },
];

const TOTAL_STEPS = 4;

export default function OnboardingPage({ onComplete }) {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);

  const [name, setName]             = useState('');
  const [segment, setSegment]       = useState(null);
  const [services, setServices]     = useState(['delivery']);
  const [deliveryTime, setDeliveryTime] = useState('20-40');

  const toggleService = (id) => {
    setServices(prev =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter(s => s !== id) : prev) : [...prev, id]
    );
  };

  const canNext = () => {
    if (step === 1) return name.trim().length >= 2;
    if (step === 2) return !!segment;
    return true;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(s => s + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    const seg = SEGMENTS.find(s => s.id === segment);
    const timeMap = { '15-20': 'Até 20 min', '20-40': '20 a 40 min', '40-60': '40 a 60 min', '60+': 'Mais de 1h' };

    const settings = {
      name: name.trim(),
      logo: seg?.emoji || '🍽️',
      primaryColor: '#FFC400',
      segment: segment,
      serviceTypes: services,
      deliveryTime: timeMap[deliveryTime] || '30 a 45 min',
      isOpen: true,
      minOrder: 0,
      payments: { pix: true, card: true, cash: true, pix_counter: true },
    };

    setDone(true);
    setTimeout(() => onComplete(settings), 2200);
  };

  if (done) {
    return (
      <div className="ob-done">
        <div className="ob-done-inner">
          <div className="ob-done-icon">🎉</div>
          <h1>Tudo pronto, {name}!</h1>
          <p>Seu sistema está configurado e pronto para uso.<br />Configure seu cardápio e comece a receber pedidos.</p>
          <div className="ob-done-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="ob-page">
      {/* Progress */}
      <div className="ob-progress-wrap">
        <div className="ob-progress-bar">
          <div className="ob-progress-fill" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>
        <span className="ob-progress-label">{step} de {TOTAL_STEPS}</span>
      </div>

      <div className="ob-card">
        {/* Step 1 — Nome */}
        {step === 1 && (
          <div className="ob-step" key="step1">
            <div className="ob-step-icon">👋</div>
            <h2>Vamos começar!</h2>
            <p>Qual é o nome do seu estabelecimento?</p>
            <div className="ob-input-wrap">
              <input
                type="text"
                className="ob-input"
                placeholder="Ex: Burger do João, Pizzaria Bella..."
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && canNext() && handleNext()}
                autoFocus
                maxLength={60}
              />
            </div>
          </div>
        )}

        {/* Step 2 — Segmento */}
        {step === 2 && (
          <div className="ob-step" key="step2">
            <div className="ob-step-icon">🏷️</div>
            <h2>Qual é o segmento?</h2>
            <p>Escolha o tipo de culinária do seu negócio</p>
            <div className="ob-segment-grid">
              {SEGMENTS.map(s => (
                <button
                  key={s.id}
                  className={`ob-segment-card ${segment === s.id ? 'selected' : ''}`}
                  onClick={() => setSegment(s.id)}
                >
                  <span className="ob-segment-emoji">{s.emoji}</span>
                  <span className="ob-segment-label">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — Tipo de atendimento */}
        {step === 3 && (
          <div className="ob-step" key="step3">
            <div className="ob-step-icon">📋</div>
            <h2>Como você atende?</h2>
            <p>Selecione todos os tipos que se aplicam ao seu negócio</p>
            <div className="ob-service-list">
              {SERVICE_TYPES.map(s => (
                <button
                  key={s.id}
                  className={`ob-service-card ${services.includes(s.id) ? 'selected' : ''}`}
                  onClick={() => toggleService(s.id)}
                >
                  <span className="ob-service-emoji">{s.emoji}</span>
                  <div className="ob-service-info">
                    <strong>{s.label}</strong>
                    <span>{s.desc}</span>
                  </div>
                  <div className="ob-service-check">
                    {services.includes(s.id) && <Check size={14} />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4 — Tempo de entrega */}
        {step === 4 && (
          <div className="ob-step" key="step4">
            <div className="ob-step-icon">⏱️</div>
            <h2>Tempo de atendimento</h2>
            <p>Qual o tempo médio até o cliente receber o pedido?</p>
            <div className="ob-time-list">
              {DELIVERY_TIMES.map(t => (
                <button
                  key={t.id}
                  className={`ob-time-card ${deliveryTime === t.id ? 'selected' : ''}`}
                  onClick={() => setDeliveryTime(t.id)}
                >
                  <div className="ob-time-info">
                    <strong>{t.label}</strong>
                    <span>{t.desc}</span>
                  </div>
                  {deliveryTime === t.id && <Check size={16} className="ob-time-check" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="ob-nav">
          {step > 1 ? (
            <button className="ob-btn-back" onClick={() => setStep(s => s - 1)}>
              <ChevronLeft size={18} /> Voltar
            </button>
          ) : <div />}

          <button
            className="ob-btn-next"
            onClick={handleNext}
            disabled={!canNext()}
          >
            {step === TOTAL_STEPS ? (
              <><Sparkles size={16} /> Finalizar</>
            ) : (
              <>Continuar <ChevronRight size={18} /></>
            )}
          </button>
        </div>
      </div>

      {/* Step dots */}
      <div className="ob-dots">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div key={i} className={`ob-dot ${i + 1 === step ? 'active' : i + 1 < step ? 'done' : ''}`} />
        ))}
      </div>
    </div>
  );
}
