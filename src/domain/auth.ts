type TokenListener = () => void;

const TOKEN_KEY = 'auth_token'; // si el equipo usa otro nombre, centralizar aquí
let listeners: TokenListener[] = [];

export function getToken(): string | null {
  try { 
    return localStorage.getItem(TOKEN_KEY); 
  } catch { 
    return null; 
  }
}

export function setToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    listeners.forEach(fn => fn());
  } catch {}
}

export function onTokenChange(fn: TokenListener) {
  listeners.push(fn);
  return () => { 
    listeners = listeners.filter(l => l !== fn); 
  };
}

// sincroniza entre pestañas
window.addEventListener('storage', (e) => {
  if (e.key === TOKEN_KEY) {
    listeners.forEach(fn => fn());
  }
});
