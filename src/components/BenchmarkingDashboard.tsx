import React from 'react';
import { Building2, TrendingUp, TrendingDown, Target, Info } from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Tooltip as RechartsTooltip, Legend
} from 'recharts';

export default function BenchmarkingDashboard({ benchmarkData }: { benchmarkData: any }) {
  if (!benchmarkData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full">
        <Building2 className="w-16 h-16 text-slate-700 mb-4" />
        <h3 className="text-xl font-medium text-white mb-2">Benchmarking Inactivo</h3>
        <p className="text-slate-400">Sube un documento para compararlo con el promedio del sector.</p>
      </div>
    );
  }

  const { sector_analizado, score_competitivo, comparaciones } = benchmarkData;

  // Preparar datos para el gráfico de radar
  // Normalizamos todo a escala 0-100% comparado con el sector para poder graficar diferentes unidades
  const radarData = Object.keys(comparaciones).map((key) => {
    const comp = comparaciones[key];
    const metricName = key.replace(/_/g, ' ').toUpperCase();
    
    // Si la empresa tiene más que el sector, el sector es 100 y la empresa > 100
    // Si es deuda, invertimos la lógica para el radar (más grande es "peor")
    let empresaNorm = 100;
    let sectorNorm = 100;
    
    if (comp.sector > 0) {
      empresaNorm = (comp.empresa / comp.sector) * 100;
    }

    // Tope visual en 200% para no distorsionar el radar
    empresaNorm = Math.min(Math.max(empresaNorm, 0), 200);

    return {
      metric: metricName,
      Empresa: Math.round(empresaNorm),
      Sector: 100, // Sector siempre es el baseline 100%
      realEmpresa: comp.empresa,
      realSector: comp.sector
    };
  });

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-8 h-8 text-indigo-400" />
        <h2 className="text-2xl font-semibold text-white">Benchmarking Sectorial ({sector_analizado})</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Radar Chart */}
        <div className="lg:col-span-2 bg-[#161b22] border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col">
          <h3 className="text-lg font-medium text-white mb-2">Perfil Competitivo (vs Sector Promedio)</h3>
          <p className="text-slate-400 text-sm mb-6">El polígono exterior representa el 100% de la media del sector.</p>
          
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f111a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                  formatter={(value: any, name: any, props: any) => {
                    const payload = props.payload;
                    return [`${name === 'Empresa' ? payload.realEmpresa : payload.realSector}`, name];
                  }}
                />
                <Legend />
                <Radar name="Promedio del Sector" dataKey="Sector" stroke="#64748b" fill="#64748b" fillOpacity={0.2} />
                <Radar name="Tu Empresa" dataKey="Empresa" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resumen & Score */}
        <div className="bg-[#161b22] border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col">
          <h3 className="text-lg font-medium text-white mb-6">Score de Competitividad</h3>
          
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="relative w-40 h-40 flex items-center justify-center mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-indigo-500 transition-all duration-1000 ease-out"
                  strokeWidth="3"
                  strokeDasharray={`${score_competitivo}, 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-bold text-white">{score_competitivo}</span>
                <span className="text-slate-400 text-sm">/ 100</span>
              </div>
            </div>
            
            <p className="text-center text-slate-300">
              La empresa supera al promedio del sector en <strong className="text-indigo-400">{(score_competitivo / 100) * Object.keys(comparaciones).length}</strong> de {Object.keys(comparaciones).length} indicadores clave.
            </p>
          </div>
        </div>
      </div>

      {/* Tabla Desglosada */}
      <div className="bg-[#161b22] border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <h3 className="text-lg font-medium text-white">Desglose de Indicadores</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-sm">
                <th className="px-6 py-4 font-medium">Métrica Financiera</th>
                <th className="px-6 py-4 font-medium text-right">Tu Empresa</th>
                <th className="px-6 py-4 font-medium text-right">Sector ({sector_analizado})</th>
                <th className="px-6 py-4 font-medium text-right">Brecha</th>
                <th className="px-6 py-4 font-medium text-center">Diagnóstico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {Object.keys(comparaciones).map((key) => {
                const comp = comparaciones[key];
                return (
                  <tr key={key} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 text-slate-200 capitalize">{key.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-4 text-right font-medium text-white">{comp.empresa}</td>
                    <td className="px-6 py-4 text-right text-slate-400">{comp.sector}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center gap-1 ${comp.es_mejor ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {comp.diferencia_pct > 0 ? '+' : ''}{comp.diferencia_pct}%
                        {comp.diferencia_pct > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {comp.es_mejor ? (
                        <span className="inline-flex px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-medium uppercase">Superior</span>
                      ) : (
                        <span className="inline-flex px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-xs font-medium uppercase">Inferior</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
