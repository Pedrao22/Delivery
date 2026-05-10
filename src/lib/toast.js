// Singleton event-based toast — call from anywhere without context
const listeners = new Set();

function emit(toast) {
  listeners.forEach(fn => fn(toast));
}

let _id = 0;

const toast = {
  success: (message, duration = 3000) => emit({ id: ++_id, type: 'success', message, duration }),
  error:   (message, duration = 4000) => emit({ id: ++_id, type: 'error',   message, duration }),
  info:    (message, duration = 3000) => emit({ id: ++_id, type: 'info',    message, duration }),
  warning: (message, duration = 3500) => emit({ id: ++_id, type: 'warning', message, duration }),
  _subscribe:   (fn) => { listeners.add(fn);    return () => listeners.delete(fn); },
};

export default toast;
