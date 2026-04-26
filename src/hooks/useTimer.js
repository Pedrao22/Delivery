import { useState, useEffect } from 'react';

export function useTimer(createdAt) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(createdAt).getTime();
    
    const update = () => {
      const now = Date.now();
      setElapsed(Math.floor((now - start) / 60000));
    };
    
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const getColor = () => {
    if (elapsed <= 15) return 'var(--success)';
    if (elapsed <= 30) return 'var(--warning)';
    return 'var(--danger)';
  };

  const getLabel = () => {
    if (elapsed < 1) return 'Agora';
    if (elapsed < 60) return `${elapsed} min`;
    const hours = Math.floor(elapsed / 60);
    const mins = elapsed % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  };

  const isUrgent = elapsed > 30;

  return { elapsed, color: getColor(), label: getLabel(), isUrgent };
}
