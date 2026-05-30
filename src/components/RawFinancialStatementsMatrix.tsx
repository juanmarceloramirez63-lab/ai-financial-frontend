import React, { useMemo } from 'react';

interface RawDataProps {
  rawData: any[];
}

type AccountNature = 'positive' | 'negative';

/**
 * COMPONENTE: RawFinancialStatementsMatrix (Versión Dinámica V2)
 * REFACTORIZACIÓN CRÍTICA: Mapeo Automático, Math.abs en Variación, Heurística de Naturaleza y Exportación CSV.
 */
export default function RawFinancialStatementsMatrix({ rawData }: RawDataProps) {
  // 1. Sanitización Inicial
  if (!rawData || !Array.isArray(rawData) || rawData.length < 2) {
    return (
      <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-800">
        <p className="text-slate-500 text-sm">Insuficientes datos históricos para el análisis comparativo.</p>
      </div>
    );
  }

  // 2. Procesamiento de Datos (Memorizado para estabilidad y performance)
  const processedData = useMemo(() => {
    // Ordenar por año para asegurar comparativa cronológica
    const sorted = [...rawData]
      .filter(d => d && typeof d.anio === 'number')
      .sort((a, b) => a.anio - b.anio);

    if (sorted.length < 2) return null;

    const y1 = sorted[0];
    const y2 = sorted[sorted.length - 1];

    // Descubrimiento dinámico de llaves (Excluyendo metadatos técnicos)
    const excludeKeys = ['id', 'anio', 'nit', 'created_at', 'empresa_id', 'updated_at', 'id_archivo', 'periodo'];
    const accountKeys = Object.keys(y2).filter(key => !excludeKeys.includes(key));

    // Heurística de Naturaleza Contable
    const getNature = (key: string): AccountNature => {
      const lowerKey = key.toLowerCase();
      const negativePatterns = ['costo', 'gasto', 'pasivo', 'obligacion', 'impuesto', 'pago', 'deuda', 'egreso', 'perdida'];
      return negativePatterns.some(p => lowerKey.includes(p)) ? 'negative' : 'positive';
    };

    // Fórmulas de Auditoría
    const calcVertical = (val: number, base: number) => (base ? (val / base) * 100 : 0);
    const calcAbsVar = (v1: number, v2: number) => v2 - v1;
    const calcRelVar = (v1: number, v2: number) => {
      const denominator = Math.abs(v1); // CORRECCIÓN CRÍTICA: Uso de valor absoluto para manejar negativos (pérdidas)
      return denominator !== 0 ? ((v2 - v1) / denominator) * 100 : 0;
    };

    // Formateadores
    const formatMoney = (v: number) => 
      `$${v.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    
    const formatPct = (v: number) => 
      `${v.toFixed(1)}%`;

    // Lógica de Heatmap (Variación vs Naturaleza)
    const getHeatmap = (variation: number, nature: AccountNature) => {
      if (Math.abs(variation) < 0.01) return 'text-slate-500';
      const isIncrease = variation > 0;
      const isGood = nature === 'positive' ? isIncrease : !isIncrease;
      return isGood 
        ? 'bg-green-900/20 text-green-400' 
        : 'bg-red-900/20 text-red-400';
    };

    // Determinar Bases para Análisis Vertical (Heurística de priorización)
    const base1 = y1.ventas || y1.ingresos_operacionales || y1.activo_total || 1;
    const base2 = y2.ventas || y2.ingresos_operacionales || y2.activo_total || 1;

    return { y1, y2, accountKeys, getNature, calcVertical, calcAbsVar, calcRelVar, formatMoney, formatPct, getHeatmap, base1, base2 };
  }, [rawData]);

  // 3. Función de Exportación CSV
  const exportToCSV = () => {
    if (!processedData) return;
    const { y1, y2, accountKeys, calcVertical, calcAbsVar, calcRelVar, base1, base2 } = processedData;

    const headers = [
      "Cuenta", 
      `Valor ${y1.anio}`, `AV % ${y1.anio}`, 
      `Valor ${y2.anio}`, `AV % ${y2.anio}`, 
      "Var. Absoluta", "Var. Relativa %"
    ];

    const rows = accountKeys.map(key => {
      const v1 = y1[key] || 0;
      const v2 = y2[key] || 0;
      const label = key.split('_').join(' ').toUpperCase();
      return [
        label,
        v1, calcVertical(v1, base1).toFixed(2),
        v2, calcVertical(v2, base2).toFixed(2),
        calcAbsVar(v1, v2), calcRelVar(v1, v2).toFixed(2)
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Auditoria_Forense_${y1.anio}_${y2.anio}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!processedData) return null;

  const { y1, y2, accountKeys, getNature, calcVertical, calcAbsVar, calcRelVar, formatMoney, formatPct, getHeatmap, base1, base2 } = processedData;

  return (
    <div className="mt-8 space-y-4">
      {/* Encabezado con Botón de Exportación */}
      <div className="bg-[#161b22] border border-slate-800 p-6 rounded-t-xl shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-indigo-500 text-2xl">◈</span>
              Matriz Automática de Auditoría Forense
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Comparativa Dinámica: {y1.anio} vs {y2.anio}. Descubrimiento automático de {accountKeys.length} rubros.
            </p>
          </div>
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all shadow-lg active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="配7 11l5 5m0 0l5-5m-5 5V3m0 9v9a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            EXPORTAR CSV
          </button>
        </div>
      </div>

      {/* Tabla de 7 Columnas */}
      <div className="overflow-x-auto rounded-b-xl border border-slate-800 bg-[#0d1117] shadow-2xl">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-[#161b22] border-b border-slate-800">
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-slate-800/50">Cuenta Contable (Llave)</th>
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase text-right border-r border-slate-800/50">Valor {y1.anio}</th>
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase text-right border-r border-slate-800/50">AV % ({y1.anio})</th>
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase text-right border-r border-slate-800/50">Valor {y2.anio}</th>
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase text-right border-r border-slate-800/50">AV % ({y2.anio})</th>
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase text-right border-r border-slate-800/50">Variación Nom.</th>
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase text-right">Variación Rel %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {accountKeys.map((key) => {
              const v1 = y1[key] || 0;
              const v2 = y2[key] || 0;
              const p1 = calcVertical(v1, base1);
              const p2 = calcVertical(v2, base2);
              const abs = calcAbsVar(v1, v2);
              const rel = calcRelVar(v1, v2);
              const heatmap = getHeatmap(abs, getNature(key));

              const label = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

              return (
                <tr key={key} className="group hover:bg-white/[0.02] transition-colors duration-150">
                  <td className="p-4 text-xs border-r border-slate-800/30">
                    <div className="flex flex-col">
                      <span className="text-slate-200 font-bold tracking-tight">{label}</span>
                      <span className="text-[9px] text-slate-600 font-mono italic">{key}</span>
                    </div>
                  </td>
                  <td className="p-4 text-xs text-right font-mono text-slate-400 border-r border-slate-800/30">{formatMoney(v1)}</td>
                  <td className="p-4 text-xs text-right font-mono text-slate-600 border-r border-slate-800/30">{formatPct(p1)}</td>
                  <td className="p-4 text-xs text-right font-mono text-slate-200 border-r border-slate-800/30">{formatMoney(v2)}</td>
                  <td className="p-4 text-xs text-right font-mono text-slate-500 border-r border-slate-800/30">{formatPct(p2)}</td>
                  <td className={`p-4 text-xs text-right font-mono border-r border-slate-800/30 ${heatmap}`}>
                    {abs > 0 ? '+' : ''}{formatMoney(abs)}
                  </td>
                  <td className={`p-4 text-xs text-right font-mono ${heatmap}`}>
                    {rel > 0 ? '+' : ''}{formatPct(rel)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center px-4 pt-2">
        <p className="text-[10px] text-slate-600 italic">
          * Análisis Vertical (AV) calculado sobre base detectable: {base1 === 1 ? 'Ventas No Detectadas' : 'Ingresos/Activos'}.
        </p>
        <div className="flex gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500/50 rounded-full"></div>
            <span className="text-[9px] text-slate-500">Mejora Financiera</span>
          </div>
          <div className="items-center gap-1 flex">
            <div className="w-2 h-2 bg-red-500/50 rounded-full"></div>
            <span className="text-[9px] text-slate-500">Deterioro / Gasto Alto</span>
          </div>
        </div>
      </div>
    </div>
  );
}
