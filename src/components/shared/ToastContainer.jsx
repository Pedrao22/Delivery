import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import toast from '../../lib/toast';
import './ToastContainer.css';

const ICONS = {
  success: <CheckCircle size={18} />,
  error:   <XCircle    size={18} />,
  info:    <Info       size={18} />,
  warning: <AlertTriangle size={18} />,
};

function Toast({ id, type, message, duration, onRemove }) {
  const [exiting, setExiting] = useState(false);

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => onRemove(id), 220);
  };

  useEffect(() => {
    const t = setTimeout(dismiss, duration);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line

  return (
    <div className={`toast toast-${type} ${exiting ? 'exiting' : ''}`}>
      <span className="toast-icon">{ICONS[type]}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={dismiss}><X size={12} /></button>
      <div className="toast-progress" style={{ animationDuration: `${duration}ms` }} />
    </div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    return toast._subscribe((t) => {
      setToasts(prev => [...prev, t]);
    });
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <Toast key={t.id} {...t} onRemove={remove} />
      ))}
    </div>
  );
}
