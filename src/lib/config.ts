const isLocal = typeof window !== 'undefined' 
  ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  : true;

export const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 
  process.env.NEXT_PUBLIC_BACKEND_URL || 
  process.env.BACKEND_URL || 
  (isLocal ? 'http://127.0.0.1:8000' : 'https://ai-financial-backend-oe8s.onrender.com');

