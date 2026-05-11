import { API_URL, getStoredToken } from './supabase';

let _reporting = false;

export async function reportError({ message, page, component, stack, context }) {
  if (_reporting) return;
  _reporting = true;
  try {
    const token = getStoredToken();
    if (!token) return; // não autenticado — não reporta

    await fetch(`${API_URL}/errors/client`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message,
        page,
        component,
        stack: stack ? stack.slice(0, 2000) : undefined,
        context,
      }),
    });
  } catch {
    // silencia — nunca deixa o reporter quebrar o app
  } finally {
    _reporting = false;
  }
}
