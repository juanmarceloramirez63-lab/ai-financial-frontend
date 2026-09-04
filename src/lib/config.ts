const isServer = typeof window === 'undefined';
const isLocalBrowser = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const defaultBackend = (isServer || !isLocalBrowser)
  ? 'https://ai-financial-backend-oe8s.onrender.com'
  : 'http://127.0.0.1:8000';

export const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 
  process.env.NEXT_PUBLIC_BACKEND_URL || 
  process.env.BACKEND_URL || 
  defaultBackend;

