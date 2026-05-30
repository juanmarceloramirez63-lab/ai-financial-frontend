import React, { useState } from 'react';

type EmpresaMetadata = { razon_social: string; nit: string; codigo_ciiu: string; };
type PeriodoData = { anio: number; [key: string]: number; };

interface HumanInTheLoopProps {
  initialData: { empresa: EmpresaMetadata, datos_comparativos: PeriodoData[] };
  documentUrls: string[];
  onConfirm: (validatedData: { empresa: EmpresaMetadata, datos_comparativos: PeriodoData[], tamanos_seleccionados: string[] }) => void;
  isLoading?: boolean;
}

export default function HumanInTheLoopForm({ initialData, documentUrls, onConfirm, isLoading }: HumanInTheLoopProps) {
  const [empresa, setEmpresa] = useState<EmpresaMetadata>(initialData?.empresa || { razon_social: '', nit: '', codigo_ciiu: '' });
  const [formData, setFormData] = useState<PeriodoData[]>(initialData?.datos_comparativos || []);
  const [activePdfIndex, setActivePdfIndex] = useState(0);
  
  // Opciones de tamaños para el benchmarking
  const [tamanosSeleccionados, setTamanosSeleccionados] = useState<string[]>(['Pequeña', 'Mediana']);
  const tamanosDisponibles = ['Micro', 'Pequeña', 'Mediana', 'Grande'];

  const toggleTamano = (tam: string) => {
    setTamanosSeleccionados(prev => 
      prev.includes(tam) ? prev.filter(t => t !== tam) : [...prev, tam]
    );
  };

  // Obtenemos los nombres de las métricas (excluyendo el año)
  const metricKeys = formData.length > 0 
    ? Object.keys(formData[0]).filter(k => k !== 'anio') 
    : [];

  const handleValueChange = (yearIndex: number, key: string, value: string) => {
    const updatedData = [...formData];
    updatedData[yearIndex] = {
      ...updatedData[yearIndex],
      [key]: parseFloat(value) || 0
    };
    setFormData(updatedData);
  };

  const handleYearChange = (yearIndex: number, value: string) => {
    const updatedData = [...formData];
    updatedData[yearIndex] = {
      ...updatedData[yearIndex],
      anio: parseInt(value, 10) || 0
    };
    setFormData(updatedData);
  };

  const formatLabel = (key: string) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({ empresa, datos_comparativos: formData, tamanos_seleccionados: tamanosSeleccionados });
  };

  return (
    <div className="flex h-[80vh] w-full bg-[#0d1117] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      
      {/* Lado Izquierdo: Visor Multidocumento */}
      <div className="w-[50%] h-full border-r border-slate-800 bg-[#161b22] flex flex-col">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center shrink-0">
          <h3 className="text-white font-medium">Documentos Fuente</h3>
          {documentUrls && documentUrls.length > 1 && (
            <select 
              value={activePdfIndex}
              onChange={(e) => setActivePdfIndex(Number(e.target.value))}
              className="bg-[#0d1117] text-slate-300 border border-slate-700 rounded p-1 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {documentUrls.map((_, i) => (
                <option key={i} value={i}>Documento {i + 1}</option>
              ))}
            </select>
          )}
        </div>
        <div className="flex-1 p-2 overflow-hidden">
          {documentUrls && documentUrls.length > 0 ? (
            <iframe 
              src={documentUrls[activePdfIndex]} 
              className="w-full h-full rounded border border-slate-700 bg-white"
              title={`Visor PDF ${activePdfIndex + 1}`}
            />
          ) : (
            <div className="text-slate-500 w-full h-full flex items-center justify-center">Sin documentos</div>
          )}
        </div>
      </div>

      {/* Lado Derecho: Metadatos y Tabla Multicolumna */}
      <div className="w-[50%] h-full flex flex-col bg-[#161b22]">
        
        {/* Nueva Sección Superior: Información de Empresa */}
        <div className="p-4 border-b border-slate-800 bg-[#0f111a] shrink-0">
          <h2 className="text-lg font-semibold text-white mb-3">Información del Cliente</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Razón Social</label>
              <input 
                type="text" value={empresa.razon_social || ''} onChange={e => setEmpresa({...empresa, razon_social: e.target.value})}
                className="w-full bg-[#161b22] border border-slate-700 rounded p-2 text-white text-sm outline-none focus:border-indigo-500 transition-colors" 
                placeholder="Nombre de la empresa"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">NIT</label>
              <input 
                type="text" value={empresa.nit || ''} onChange={e => setEmpresa({...empresa, nit: e.target.value})}
                className="w-full bg-[#161b22] border border-slate-700 rounded p-2 text-white text-sm outline-none focus:border-indigo-500 transition-colors" 
                placeholder="NIT de la empresa"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Código CIIU (Clave para Benchmarking Sectorial)</label>
              <input 
                type="text" value={empresa.codigo_ciiu || ''} onChange={e => setEmpresa({...empresa, codigo_ciiu: e.target.value})}
                placeholder="Ej. 6201 - Actividades de desarrollo de sistemas informáticos"
                className="w-full bg-indigo-900/10 border border-indigo-500/30 rounded p-2 text-indigo-300 font-medium text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors" 
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-0 custom-scrollbar flex flex-col">
          {formData.length === 0 ? (
            <div className="p-6 text-slate-400 text-center flex flex-col items-center justify-center flex-1">
              No se encontraron datos comparativos. Por favor revisa los documentos subidos.
            </div>
          ) : (
            <form id="multi-validation-form" onSubmit={handleSubmit} className="w-full min-w-max flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0d1117] sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-4 text-sm font-semibold text-slate-300 border-b border-slate-800 border-r border-slate-800/50">Métrica Financiera</th>
                    {formData.map((periodo, idx) => (
                      <th key={idx} className="p-4 text-center border-b border-slate-800 min-w-[140px]">
                        <input 
                          type="number"
                          value={periodo.anio}
                          onChange={(e) => handleYearChange(idx, e.target.value)}
                          className="w-24 text-center bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold rounded py-1 outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metricKeys.map((key) => (
                    <tr key={key} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                      <td className="p-3 pl-4 text-sm font-medium text-slate-400 border-r border-slate-800/50">
                        {formatLabel(key)}
                      </td>
                      {formData.map((periodo, idx) => (
                        <td key={`${idx}-${key}`} className="p-2">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600 text-xs">$</span>
                            <input
                              type="number"
                              step="any"
                              value={periodo[key]}
                              onChange={(e) => handleValueChange(idx, key, e.target.value)}
                              className="w-full bg-transparent border border-transparent hover:border-slate-700 focus:border-indigo-500 focus:bg-[#0d1117] rounded py-1 pl-6 pr-2 text-white text-right outline-none transition-all"
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </form>
          )}
        </div>

        {/* Benchmarking Size Selector & Submit Button */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 shrink-0">
          <div className="mb-4">
            <label className="text-xs font-medium text-slate-300 mb-2 block">
              Tamaños de Empresa para Benchmarking:
            </label>
            <div className="flex flex-wrap gap-2">
              {tamanosDisponibles.map(tam => (
                <button
                  key={tam}
                  type="button"
                  onClick={() => toggleTamano(tam)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                    tamanosSeleccionados.includes(tam)
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                      : 'bg-[#161b22] border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {tam}
                </button>
              ))}
            </div>
          </div>
          
          <button
            type="submit"
            form="multi-validation-form"
            disabled={isLoading || formData.length === 0}
            className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/20 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#161b22] focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Analizando Histórico y Guardando...' : 'Confirmar Datos y Analizar'}
          </button>
        </div>
      </div>
    </div>
  );
}
