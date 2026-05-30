import React from 'react';
import { AlertTriangle, ShieldCheck, AlertOctagon, Info } from 'lucide-react';

export default function FraudDashboard({ fraudData }: { fraudData: any }) {
  if (!fraudData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full">
        <ShieldCheck className="w-16 h-16 text-slate-700 mb-4" />
        <h3 className="text-xl font-medium text-white mb-2">Auditoría Forense Inactiva</h3>
        <p className="text-slate-400">Sube un documento para que la IA realice el análisis de fraude.</p>
      </div>
    );
  }

  const { resumen, alertas } = fraudData;

  const scoreColor = resumen.color === 'red' ? 'text-rose-500' : 
                     resumen.color === 'yellow' ? 'text-amber-500' : 'text-emerald-500';
                     
  const scoreBgColor = resumen.color === 'red' ? 'bg-rose-500/10 border-rose-500/20' : 
                       resumen.color === 'yellow' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20';

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="w-8 h-8 text-indigo-400" />
        <h2 className="text-2xl font-semibold text-white">Auditoría Forense y Detección de Fraude</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score de Riesgo */}
        <div className={`col-span-1 border rounded-xl p-6 shadow-xl flex flex-col items-center justify-center text-center ${scoreBgColor}`}>
          <h3 className="text-slate-300 font-medium mb-4">Nivel de Riesgo Contable</h3>
          <div className={`text-6xl font-bold mb-2 ${scoreColor}`}>
            {resumen.score}
            <span className="text-2xl text-slate-500">/100</span>
          </div>
          <div className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-semibold uppercase tracking-wider
            ${resumen.color === 'red' ? 'border-rose-500/50 text-rose-400' : 
              resumen.color === 'yellow' ? 'border-amber-500/50 text-amber-400' : 'border-emerald-500/50 text-emerald-400'}`}>
            {resumen.nivel}
          </div>
        </div>

        {/* Resumen */}
        <div className="col-span-2 bg-[#161b22] border border-slate-800 rounded-xl p-6 shadow-xl">
          <h3 className="text-lg font-medium text-white mb-4">Interpretación del Análisis</h3>
          <p className="text-slate-400 leading-relaxed mb-6">
            El motor forense evalúa los estados financieros extraídos en busca de anomalías, como descuadres en la ecuación contable básica, márgenes de rentabilidad inusualmente altos o niveles extremos de inventario que puedan sugerir manipulación de ganancias.
          </p>
          
          <div className="flex items-start gap-3 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-indigo-200">
              {alertas.length === 0 
                ? "No se detectaron 'Red Flags' (banderas rojas) evidentes en el último período analizado."
                : `Se detectaron ${alertas.length} posibles anomalías o riesgos que requieren revisión manual por un auditor.`}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Alertas */}
      <div className="bg-[#161b22] border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 className="text-lg font-medium text-white">Red Flags Detectadas</h3>
          <span className="bg-slate-800 text-slate-300 py-1 px-3 rounded-full text-xs font-medium">
            {alertas.length} hallazgos
          </span>
        </div>
        
        <div className="divide-y divide-slate-800/50">
          {alertas.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Los estados financieros parecen consistentes.</p>
            </div>
          ) : (
            alertas.map((alerta: any, idx: number) => (
              <div key={idx} className="p-6 flex items-start gap-4 hover:bg-slate-800/20 transition-colors">
                <div className={`mt-1 p-2 rounded-lg flex-shrink-0 ${alerta.severidad === 'ALTA' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {alerta.severidad === 'ALTA' ? <AlertOctagon size={20} /> : <AlertTriangle size={20} />}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-slate-200 font-medium">{alerta.tipo.replace(/_/g, ' ')}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider border ${alerta.severidad === 'ALTA' ? 'border-rose-500/30 text-rose-400 bg-rose-500/10' : 'border-amber-500/30 text-amber-400 bg-amber-500/10'}`}>
                      {alerta.severidad}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm">{alerta.mensaje}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
