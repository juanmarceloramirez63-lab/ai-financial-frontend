"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { BACKEND_URL } from '../lib/config';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  TrendingUp, AlertTriangle, ShieldCheck, HelpCircle, Download, 
  Search, Sliders, Loader2, Sparkles, Filter
} from 'lucide-react';

interface StatItem {
  id: string;
  name: string;
  level: number;
  media_simple: number;
  media_ponderada: number;
  mediana: number;
  p25: number;
  p75: number;
  p90: number;
  desviacion_estandar: number;
}

interface StressResult {
  shock_aplicado: {
    revenue_pct: number;
    costs_pct: number;
    expenses_pct: number;
  };
  resumen: {
    total_empresas: number;
    con_perdidas_base: number;
    con_perdidas_sim: number;
    nuevas_empresas_perdida: number;
    pct_empresas_afectadas: number;
  };
  percentiles_utilidad: {
    p25_base: number;
    p25_sim: number;
    p50_base: number;
    p50_sim: number;
    p75_base: number;
    p75_sim: number;
  };
}

interface AlertResult {
  vulnerabilidad_sistemica: boolean;
  prueba_acida_p75: number;
  razon_corriente_p25: number;
  mensaje: string;
}

interface CompanyItem {
  nit: string;
  razon_social: string;
}

export default function StatisticalAnalysisDashboard({
  selectedDept,
  setSelectedDept,
  selectedTamano,
  setSelectedTamano,
  selectedYear,
  setSelectedYear,
  selectedCiiu
}: any) {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<StatItem[]>([]);
  const [stressData, setStressData] = useState<StressResult | null>(null);
  const [alertData, setAlertData] = useState<AlertResult | null>(null);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [companyDetails, setCompanyDetails] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Sliders del Simulador de Estrés (Por defecto 0% para ver situación base limpia)
  const [shockRevenue, setShockRevenue] = useState(0);
  const [shockCosts, setShockCosts] = useState(0);
  const [shockExpenses, setShockExpenses] = useState(0);

  // Cargar datos del análisis estadístico
  const loadStats = async () => {
    setLoading(true);
    try {
      const payload: any = {
        shocks: {
          revenue: shockRevenue,
          costs: shockCosts,
          expenses: shockExpenses
        }
      };
      if (selectedDept && selectedDept !== 'TODOS') payload.ciudad = selectedDept; 
      if (selectedTamano && selectedTamano !== 'TODOS') payload.tamano = selectedTamano;
      if (selectedYear && selectedYear !== 'TODOS') payload.anio = parseInt(selectedYear);
      if (selectedCiiu && selectedCiiu !== 'TODOS') payload.sector = selectedCiiu;

      const res = await fetch(`${BACKEND_URL}/api/bi/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.error) {
          setStatsData([]);
          setStressData(null);
          setAlertData(null);
          setCompanies([]);
        } else {
          setStatsData(data.stats || []);
          setStressData(data.stress || null);
          setAlertData(data.alerta || null);
          setCompanies(data.empresas || []);
        }
      }
    } catch (e) {
      console.error("Error al obtener estadísticas:", e);
    } finally {
      setLoading(false);
    }
  };

  // Escuchar cambios en los filtros globales vinculados
  useEffect(() => {
    loadStats();
  }, [selectedDept, selectedTamano, selectedYear, selectedCiiu]);

  // Ejecutar el estrés manual al pulsar el botón
  const handleApplyStress = () => {
    loadStats();
  };

  // Calcular la desviación estándar de la empresa seleccionada frente al grupo
  const gapAnalysis = useMemo(() => {
    if (!selectedCompany || !companyDetails || statsData.length === 0) return null;
    
    const results: any[] = [];
    
    statsData.forEach(stat => {
      let empValue = 0;
      if (stat.id === 'roa') empValue = companyDetails.roa || 0;
      else if (stat.id === 'roe') empValue = companyDetails.roe || 0;
      else if (stat.id === 'endeudamiento') empValue = companyDetails.endeudamiento_total || 0;
      else if (stat.id === 'prueba_acida') empValue = companyDetails.prueba_acida || 0;
      else if (stat.id === 'razon_corriente') empValue = companyDetails.liquidez_corriente || 0;
      else if (stat.id === 'activo') empValue = companyDetails.activo_total || 0;
      else if (stat.id === 'pasivo') empValue = companyDetails.pasivo_total || 0;
      else if (stat.id === 'patrimonio') empValue = companyDetails.patrimonio || 0;
      else if (stat.id === 'ingresos') empValue = companyDetails.ventas || 0;
      else if (stat.id === 'utilidad_neta') empValue = companyDetails.utilidad_neta || 0;
      
      const median = stat.mediana;
      const stdDev = stat.desviacion_estandar;
      
      const zScore = stdDev > 0 ? (empValue - median) / stdDev : 0;
      
      results.push({
        id: stat.id,
        name: stat.name,
        empValue,
        median,
        zScore,
        severity: Math.abs(zScore) > 2.0 ? 'crítica' : Math.abs(zScore) > 1.0 ? 'moderada' : 'normal'
      });
    });
    
    return results;
  }, [selectedCompany, companyDetails, statsData]);

  // Selección de empresa para Benchmark
  const handleSelectCompany = async (nit: string) => {
    setSelectedCompany(nit);
    if (!nit) {
      setCompanyDetails(null);
      return;
    }
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/clientes`);
      if (res.ok) {
        const data = await res.json();
        const found = data.clientes?.find((c: any) => c.nit === nit);
        if (found) {
          const diag = found.diagnostico;
          const raw = found.datos_extraidos;
          const recent = raw?.datos_comparativos ? maxBy(raw.datos_comparativos, 'anio') : {};
          
          setCompanyDetails({
            razon_social: found.razon_social,
            roa: diag?.rentabilidad?.roa || 0,
            roe: diag?.rentabilidad?.roe || 0,
            endeudamiento_total: diag?.endeudamiento?.endeudamiento_total || 0,
            prueba_acida: diag?.liquidez?.prueba_acida || 0,
            liquidez_corriente: diag?.liquidez?.liquidez_corriente || 0,
            activo_total: recent?.activo_total || 0,
            pasivo_total: recent?.pasivo_total || 0,
            patrimonio: recent?.patrimonio || 0,
            ventas: recent?.ventas || 0,
            utilidad_neta: recent?.utilidad_neta || 0
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const maxBy = (arr: any[], key: string) => {
    return arr.reduce((a, b) => (a[key] > b[key] ? a : b), arr[0]);
  };

  // Filtrado de la lista de empresas por búsqueda
  const filteredCompanies = useMemo(() => {
    if (!searchQuery) return companies.slice(0, 50); 
    return companies.filter(c => 
      c.razon_social.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.nit.includes(searchQuery)
    ).slice(0, 50);
  }, [companies, searchQuery]);

  // Exportar estadísticas a CSV
  const handleExportCSV = () => {
    if (statsData.length === 0) return;
    
    const headers = ["Cuenta", "Nivel", "Media Simple", "Media Ponderada", "Mediana", "Percentil 25", "Percentil 75", "Percentil 90", "Desviación Estándar"];
    const rows = statsData.map(s => [
      s.name,
      `Nivel ${s.level}`,
      s.media_simple.toString(),
      s.media_ponderada.toString(),
      s.mediana.toString(),
      s.p25.toString(),
      s.p75.toString(),
      s.p90.toString(),
      s.desviacion_estandar.toString()
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analisis_estadistico_${selectedDept}_${selectedTamano}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val: number) => {
    if (Math.abs(val) >= 1e9) return `$ ${(val / 1e9).toFixed(2)}B`;
    if (Math.abs(val) >= 1e6) return `$ ${(val / 1e6).toFixed(2)}M`;
    return `$ ${val.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
  };

  // Gráfica What-If (Antes vs Después)
  const stressChartData = useMemo(() => {
    if (!stressData) return [];
    const p = stressData.percentiles_utilidad;
    return [
      { name: 'P25', 'Antes': p.p25_base, 'Después': p.p25_sim },
      { name: 'P50 (Med)', 'Antes': p.p50_base, 'Después': p.p50_sim },
      { name: 'P75', 'Antes': p.p75_base, 'Después': p.p75_sim }
    ];
  }, [stressData]);

  return (
    <div className="p-8 space-y-8 bg-[#000033] min-h-screen text-slate-200">
      
      {/* HEADER DE FILTROS VINCULADOS GLOBALES */}
      <div className="bg-[#000022] border border-[#4fc3f7]/20 p-5 rounded-2xl shadow-xl flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-white uppercase text-xs tracking-wider">Filtros Activos (BI Sincronizados)</h3>
        </div>
        
        <div className="flex flex-wrap gap-6 text-xs font-bold text-slate-300">
          <div>
            <span className="text-slate-500 uppercase tracking-widest text-[9px] block">Departamento/Ciudad</span>
            <span className="text-[#ffff00]">{selectedDept === 'TODOS' ? 'TODOS' : selectedDept}</span>
          </div>
          <div>
            <span className="text-slate-500 uppercase tracking-widest text-[9px] block">Tamaño Empresa</span>
            <span className="text-[#ffff00]">{selectedTamano}</span>
          </div>
          <div>
            <span className="text-slate-500 uppercase tracking-widest text-[9px] block">Año(s)</span>
            <span className="text-[#ffff00]">{selectedYear}</span>
          </div>
          <div>
            <span className="text-slate-500 uppercase tracking-widest text-[9px] block">Sector CIIU</span>
            <span className="text-[#ffff00]">{selectedCiiu === 'TODOS' ? 'TODOS' : selectedCiiu}</span>
          </div>
        </div>
      </div>

      {/* ALERTAS DE CONCENTRACIÓN Y VULNERABILIDAD */}
      {alertData && (
        <div className={`p-6 rounded-2xl border ${
          alertData.vulnerabilidad_sistemica 
            ? 'bg-rose-950/30 border-rose-500/30 text-rose-200' 
            : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-200'
        } shadow-lg flex items-start gap-4 transition-all duration-300`}>
          {alertData.vulnerabilidad_sistemica ? (
            <AlertTriangle className="w-10 h-10 text-rose-500 shrink-0 mt-1" />
          ) : (
            <ShieldCheck className="w-10 h-10 text-emerald-500 shrink-0 mt-1" />
          )}
          <div className="space-y-1">
            <h4 className="font-bold text-lg text-white">
              {alertData.vulnerabilidad_sistemica ? "Vulnerabilidad Sistémica Detectada" : "Rango de Estabilidad Seguro"}
            </h4>
            <p className="text-sm leading-relaxed">{alertData.mensaje}</p>
            <div className="flex items-center gap-6 mt-3 text-xs font-mono">
              <div>
                <span>Percentil 75 Prueba Ácida: </span>
                <span className={`font-bold ${alertData.prueba_acida_p75 < 1.0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {alertData.prueba_acida_p75.toFixed(2)}
                </span>
              </div>
              <div>
                <span>Percentil 25 Razón Corriente: </span>
                <span className={`font-bold ${alertData.razon_corriente_p25 < 0.8 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {alertData.razon_corriente_p25.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* TABLA PRINCIPAL DE TENDENCIA CENTRAL */}
        <div className="xl:col-span-2 bg-[#161b22] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 relative">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-indigo-400" />
                Estructura de Cuentas y Tendencia Central
              </h3>
              <p className="text-xs text-slate-400">Distribución de percentiles y medias ponderadas por activos/ingresos</p>
            </div>
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-2 rounded-lg transition-colors font-medium text-xs shadow-md"
            >
              <Download size={14} />
              Exportar CSV
            </button>
          </div>

          <div className="overflow-x-auto relative">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                  <th className="py-3 px-4">Cuenta Financiera</th>
                  <th className="py-3 px-4 text-right">Media Simple</th>
                  <th className="py-3 px-4 text-right">Media Pond.</th>
                  <th className="py-3 px-4 text-right text-indigo-400">Mediana</th>
                  <th className="py-3 px-4 text-right">Percentil 25</th>
                  <th className="py-3 px-4 text-right">Percentil 75</th>
                  <th className="py-3 px-4 text-right">Percentil 90</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  // Skeleton placeholders para evitar que la tabla se vea estática o desaparezca
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse bg-slate-900/10">
                      <td className="py-4 px-4"><div className="h-3 bg-slate-800 rounded w-44"></div></td>
                      <td className="py-4 px-4"><div className="h-3 bg-slate-800 rounded w-20 ml-auto"></div></td>
                      <td className="py-4 px-4"><div className="h-3 bg-slate-800 rounded w-20 ml-auto"></div></td>
                      <td className="py-4 px-4"><div className="h-3 bg-slate-800 rounded w-20 ml-auto"></div></td>
                      <td className="py-4 px-4"><div className="h-3 bg-slate-800 rounded w-20 ml-auto"></div></td>
                      <td className="py-4 px-4"><div className="h-3 bg-slate-800 rounded w-20 ml-auto"></div></td>
                      <td className="py-4 px-4"><div className="h-3 bg-slate-800 rounded w-20 ml-auto"></div></td>
                    </tr>
                  ))
                ) : statsData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-bold">
                      No se encontraron datos para los filtros seleccionados
                    </td>
                  </tr>
                ) : (
                  statsData.map((s, idx) => {
                    const isPercentage = s.id.includes('roa') || s.id.includes('roe') || s.id.includes('endeudamiento');
                    const formatter = (v: number) => isPercentage ? `${(v * 100).toFixed(1)}%` : formatCurrency(v);
                    
                    return (
                      <tr key={s.id || idx} className={`hover:bg-slate-800/30 transition-colors ${s.level === 1 ? 'font-bold text-white bg-slate-900/10' : 'text-slate-300'}`}>
                        <td className="py-3 px-4 flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${s.level === 1 ? 'bg-indigo-500' : 'bg-slate-500'}`}></span>
                          {s.name}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">{formatter(s.media_simple)}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-400">{formatter(s.media_ponderada)}</td>
                        <td className="py-3 px-4 text-right font-mono text-indigo-400 font-bold">{formatter(s.mediana)}</td>
                        <td className="py-3 px-4 text-right font-mono">{formatter(s.p25)}</td>
                        <td className="py-3 px-4 text-right font-mono">{formatter(s.p75)}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-400">{formatter(s.p90)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* COLUMNA DERECHA: SIMULADOR DE ESTRÉS MACRO */}
        <div className="bg-[#161b22] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 flex flex-col justify-between relative">
          {loading && (
            <div className="absolute inset-0 bg-[#161b22]/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
              <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sliders className="w-6 h-6 text-rose-400" />
                Simulador de Estrés What-If
              </h3>
              <p className="text-xs text-slate-400">Aplica choques porcentuales en variables agregadas de la región o sector</p>
            </div>

            {/* CONTROLES DE SHOCK */}
            <div className="space-y-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Choque en Ingresos Operativos</span>
                  <span className={`font-mono font-bold ${shockRevenue < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{shockRevenue}%</span>
                </div>
                <input 
                  type="range" min="-50" max="50" value={shockRevenue} 
                  onChange={(e) => setShockRevenue(parseInt(e.target.value))}
                  className="w-full accent-rose-500" 
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Choque en Costos de Venta</span>
                  <span className={`font-mono font-bold ${shockCosts > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>+{shockCosts}%</span>
                </div>
                <input 
                  type="range" min="-50" max="50" value={shockCosts} 
                  onChange={(e) => setShockCosts(parseInt(e.target.value))}
                  className="w-full accent-orange-500" 
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Choque en Gastos Operacionales</span>
                  <span className={`font-mono font-bold ${shockExpenses > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>+{shockExpenses}%</span>
                </div>
                <input 
                  type="range" min="-50" max="50" value={shockExpenses} 
                  onChange={(e) => setShockExpenses(parseInt(e.target.value))}
                  className="w-full accent-orange-500" 
                />
              </div>

              <button 
                onClick={handleApplyStress}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors font-bold text-xs shadow-lg shadow-rose-900/30"
              >
                Recalcular Escenario de Estrés
              </button>
            </div>

            {/* RESULTADOS DE ESTRÉS */}
            {stressData && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#000022] p-4 rounded-xl border border-slate-800 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Empresas con Pérdida (Antes)</p>
                    <p className="text-xl font-bold font-mono text-slate-300 mt-1">{stressData.resumen.con_perdidas_base}</p>
                  </div>
                  <div className="bg-rose-950/20 p-4 rounded-xl border border-rose-950 text-center">
                    <p className="text-[10px] font-black text-rose-400 uppercase">Simulación Estrés (Pérdidas)</p>
                    <p className="text-xl font-bold font-mono text-rose-500 mt-1">{stressData.resumen.con_perdidas_sim}</p>
                  </div>
                </div>

                <div className="bg-rose-950/10 border border-rose-500/20 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-sm text-white">Margen Comprometido</h5>
                    <p className="text-[10px] text-rose-300">Empresas que entran a zona de pérdida neta</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-rose-500 font-mono">+{stressData.resumen.nuevas_empresas_perdida}</span>
                    <p className="text-[10px] text-slate-400">({stressData.resumen.pct_empresas_afectadas.toFixed(1)}%)</p>
                  </div>
                </div>

                {/* COMPARATIVE MINI CHART */}
                <div className="h-44 bg-[#0f111a] rounded-xl p-2 border border-slate-800">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stressChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b', fontSize: 10}} axisLine={false} tickLine={false} />
                      <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(v) => `$ ${(v/1e6).toFixed(0)}M`} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f111a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: 10 }} />
                      <Legend wrapperStyle={{ fontSize: 9, paddingTop: 5 }} />
                      <Bar dataKey="Antes" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Después" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ANÁLISIS DE BRECHA */}
      <div className="bg-[#161b22] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Search className="w-6 h-6 text-emerald-400" />
            Análisis de Brecha (Benchmarking Dinámico de Empresa)
          </h3>
          <p className="text-xs text-slate-400">Evalúa la posición de una empresa analizada respecto al comportamiento de su grupo de pares (filtros activos)</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Selector de Empresa */}
          <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800 flex flex-col gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Buscar Empresa en Portafolio</span>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input 
                  type="text" 
                  placeholder="NIT o Razón Social..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#161b22] text-white text-xs p-2.5 pl-9 rounded-lg border border-[#4fc3f7]/20 outline-none w-full"
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-52 divide-y divide-slate-800">
              {filteredCompanies.map(c => (
                <button
                  key={c.nit}
                  onClick={() => handleSelectCompany(c.nit)}
                  className={`w-full text-left py-2 px-3 hover:bg-slate-800/50 transition-colors text-xs flex flex-col gap-1 ${
                    selectedCompany === c.nit ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : ''
                  }`}
                >
                  <span className="font-bold text-white block truncate">{c.razon_social}</span>
                  <span className="text-[10px] text-slate-400">NIT: {c.nit}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Z-Scores y Tabla de Desviaciones */}
          <div className="lg:col-span-3 bg-slate-900/30 p-6 rounded-xl border border-slate-800 flex flex-col justify-between">
            {gapAnalysis ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h4 className="font-black text-white text-sm">{companyDetails?.razon_social}</h4>
                  <span className="text-xs text-slate-400">Desviaciones estándar respecto a la Mediana de Pares</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {gapAnalysis.filter(res => ['roa', 'roe', 'endeudamiento', 'prueba_acida', 'ingresos'].includes(res.id)).map(item => {
                    const isPercentage = item.id.includes('roa') || item.id.includes('roe') || item.id.includes('endeudamiento');
                    const formatter = (v: number) => isPercentage ? `${(v * 100).toFixed(1)}%` : formatCurrency(v);
                    
                    return (
                      <div key={item.id} className="bg-[#161b22] p-4 rounded-xl border border-slate-800/80 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.name}</span>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-lg font-black text-white">{formatter(item.empValue)}</span>
                            <span className="text-xs text-slate-500">vs Med: {formatter(item.median)}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`inline-flex items-center text-xs font-mono font-bold px-2 py-1 rounded-md ${
                            item.severity === 'crítica' 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                              : item.severity === 'moderada'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {item.zScore > 0 ? '+' : ''}{item.zScore.toFixed(2)} SD
                          </span>
                          <p className="text-[9px] text-slate-500 uppercase mt-1">Dist. Mediana</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <HelpCircle className="w-12 h-12 mb-3 text-slate-600 animate-bounce" />
                <p className="text-sm font-bold">Selecciona una empresa del panel lateral para iniciar el Análisis de Brecha</p>
                <p className="text-[10px] text-slate-600">Compara métricas específicas contra percentiles regionales y sectoriales dinámicos</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
