import React, { useState, useEffect } from 'react';
import { Search, Building2, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import { BACKEND_URL } from '../lib/config';

export default function ClientDirectory({ onSelectClient }: { onSelectClient: (client: any) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Intentamos cargar desde un endpoint del backend (que crearemos luego si es necesario)
      // Por ahora, como es frontend, simulamos la llamada. En producción deberías tener un GET /api/clientes
      const response = await fetch(`${BACKEND_URL}/api/clientes`);
      if (!response.ok) {
        throw new Error('Endpoint /api/clientes no disponible');
      }
      const data = await response.json();
      setClients(data.clientes || []);
    } catch (err: any) {
      console.error(err);
      setError('No se pudo conectar a la base de datos de clientes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter(c => 
    (c.razon_social || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.nit || '').includes(searchTerm)
  );

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Portafolio de Clientes</h2>
          <p className="text-slate-400 text-sm mt-1">Busca y audita análisis financieros previamente guardados.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchClients} 
            className="p-2 text-slate-400 hover:text-white bg-[#161b22] border border-slate-800 rounded-lg transition-colors"
            title="Actualizar lista"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar por NIT o Empresa..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#161b22] border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 bg-[#161b22] border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            Cargando portafolio...
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-rose-400">
            <AlertCircle size={32} className="mb-2" />
            <p>{error}</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            No hay clientes analizados en la base de datos todavía.
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead className="bg-[#0d1117] border-b border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="p-4 font-semibold text-slate-300 text-sm">Empresa</th>
                  <th className="p-4 font-semibold text-slate-300 text-sm">NIT</th>
                  <th className="p-4 font-semibold text-slate-300 text-sm">Sector (CIIU)</th>
                  <th className="p-4 font-semibold text-slate-300 text-sm">Tamaño</th>
                  <th className="p-4 font-semibold text-slate-300 text-sm">Score Riesgo</th>
                  <th className="p-4 font-semibold text-slate-300 text-sm">Fecha</th>
                  <th className="p-4 font-semibold text-slate-300 text-sm">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client, i) => (
                  <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 text-white font-medium flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg"><Building2 size={16} /></div>
                      {client.razon_social}
                    </td>
                    <td className="p-4 text-slate-400 text-sm">{client.nit}</td>
                    <td className="p-4 text-slate-400 text-sm">CIIU: {client.codigo_ciiu || 'N/A'}</td>
                    <td className="p-4 text-slate-400 text-sm">{client.tamano_empresa || 'N/A'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-md ${
                        client.zona_riesgo === 'Segura' ? 'bg-emerald-500/20 text-emerald-400' : 
                        client.zona_riesgo === 'Gris' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-rose-500/20 text-rose-400'
                      }`}>
                        {client.zona_riesgo || client.score_riesgo}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-sm">
                      {new Date(client.fecha_analisis).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => onSelectClient(client)} 
                        className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
                      >
                        Ver Auditoría <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
