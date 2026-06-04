const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const BACKEND_URL = isLocalhost 
  ? 'http://localhost:8000' 
  : 'https://fearless-reflection-production-1454.up.railway.app';
