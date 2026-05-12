import { toast as sonner } from 'sonner';

// Proxy para manter a API existente (toast.success / error / info / warning)
// enquanto usa o Sonner como renderer
const toast = {
  success: (message, duration = 3000) => sonner.success(message, { duration }),
  error:   (message, duration = 4000) => sonner.error(message,   { duration }),
  info:    (message, duration = 3000) => sonner.info(message,    { duration }),
  warning: (message, duration = 3500) => sonner.warning(message, { duration }),
};

export default toast;
