import React from 'react';

type RatioRowProps = {
  label: string;
  data: any[];
  dataKey: string;
  category: string;
  format?: 'number' | 'percentage' | 'currency' | 'days';
  higherIsBetter?: boolean;
};

export default function DetailedFinancialMatrix({ matrixData }: { matrixData: any[] }) {
  if (!matrixData || matrixData.length === 0) return null;

  // Asegurarnos de que los datos estén ordenados por año de forma ascendente para la lógica de heatmap
  const sortedData = [...matrixData].sort((a, b) => a.anio - b.anio);
  const years = sortedData.map(d => d.anio);

  const formatValue = (value: number, format: string = 'number') => {
    if (value === undefined || value === null) return 'N/A';
    switch(format) {
      case 'percentage': return `${value.toFixed(2)}%`;
      case 'currency': return `$${value.toLocaleString()}`;
      case 'days': return `${value.toFixed(1)} días`;
      default: return value.toFixed(2);
    }
  };

  const RatioRow = ({ label, dataKey, category, format = 'number', higherIsBetter = true }: RatioRowProps) => {
    return (
      <tr className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
        <td className="p-3 pl-4 text-sm font-medium text-slate-300 border-r border-slate-800/50 bg-[#161b22]">
          {label}
        </td>
        {sortedData.map((yearData, index) => {
          const val = yearData[category]?.[dataKey];
          let bgColor = "bg-transparent";
          let textColor = "text-slate-400";

          // Lógica de Heatmap (comparando con el año anterior)
          if (index > 0) {
            const prevVal = sortedData[index - 1][category]?.[dataKey];
            if (val !== undefined && prevVal !== undefined && prevVal !== 0) {
              const delta = val - prevVal;
              // Tolerancia mínima para no pintar de rojo/verde cambios minúsculos
              const threshold = Math.abs(prevVal) * 0.02; 
              
              if (Math.abs(delta) > threshold) {
                if (higherIsBetter) {
                  if (delta > 0) {
                    bgColor = "bg-emerald-500/10";
                    textColor = "text-emerald-400 font-semibold";
                  } else {
                    bgColor = "bg-rose-500/10";
                    textColor = "text-rose-400 font-semibold";
                  }
                } else {
                  if (delta < 0) {
                    bgColor = "bg-emerald-500/10";
                    textColor = "text-emerald-400 font-semibold";
                  } else {
                    bgColor = "bg-rose-500/10";
                    textColor = "text-rose-400 font-semibold";
                  }
                }
              }
            }
          }

          return (
            <td key={`${yearData.anio}-${dataKey}`} className={`p-3 text-right text-sm ${bgColor} ${textColor} border-r border-slate-800/50 last:border-r-0 transition-colors`}>
              {formatValue(val, format)}
            </td>
          );
        })}
      </tr>
    );
  };

  return (
    <div className="mt-8 bg-[#0d1117] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      <div className="p-5 border-b border-slate-800 bg-slate-900/50">
        <h3 className="text-lg font-bold text-white">Auditoría Forense: Matriz de Razones Financieras</h3>
        <p className="text-xs text-slate-400 mt-1">Análisis detallado de liquidez, eficiencia, endeudamiento y operación. El mapa de calor identifica variaciones críticas respecto al año anterior.</p>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#161b22] sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-4 text-sm font-bold text-indigo-400 border-b border-slate-700 border-r border-slate-800/50 w-64 uppercase tracking-wider">
                Indicador
              </th>
              {years.map(y => (
                <th key={y} className="p-4 text-center font-bold text-white border-b border-slate-700 border-r border-slate-800/50 last:border-r-0 min-w-[140px]">
                  {y}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            
            {/* BLOQUE LIQUIDEZ */}
            <tr className="bg-slate-800/50">
              <td colSpan={years.length + 1} className="p-2 pl-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                1. Liquidez
              </td>
            </tr>
            <RatioRow label="Razón Corriente (Veces)" data={sortedData} category="liquidez" dataKey="razon_corriente" higherIsBetter={true} />
            <RatioRow label="Prueba Ácida (Veces)" data={sortedData} category="liquidez" dataKey="prueba_acida" higherIsBetter={true} />
            <RatioRow label="Capital de Trabajo ($)" data={sortedData} category="liquidez" dataKey="capital_trabajo" format="currency" higherIsBetter={true} />

            {/* BLOQUE EFICIENCIA */}
            <tr className="bg-slate-800/50">
              <td colSpan={years.length + 1} className="p-2 pl-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 border-t border-slate-800">
                2. Eficiencia Operativa
              </td>
            </tr>
            <RatioRow label="Días de Cartera" data={sortedData} category="eficiencia" dataKey="dias_cartera" format="days" higherIsBetter={false} />
            <RatioRow label="Días de Inventario" data={sortedData} category="eficiencia" dataKey="dias_inventario" format="days" higherIsBetter={false} />
            <RatioRow label="Días de Proveedores" data={sortedData} category="eficiencia" dataKey="dias_proveedores" format="days" higherIsBetter={true} />
            <RatioRow label="Ciclo de Conversión Efectivo" data={sortedData} category="eficiencia" dataKey="cce" format="days" higherIsBetter={false} />

            {/* BLOQUE ENDEUDAMIENTO */}
            <tr className="bg-slate-800/50">
              <td colSpan={years.length + 1} className="p-2 pl-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 border-t border-slate-800">
                3. Endeudamiento y Cobertura
              </td>
            </tr>
            <RatioRow label="Nivel de Endeudamiento" data={sortedData} category="endeudamiento" dataKey="nivel_endeudamiento" format="percentage" higherIsBetter={false} />
            <RatioRow label="Cobertura de Intereses (Veces)" data={sortedData} category="endeudamiento" dataKey="cobertura_intereses" higherIsBetter={true} />
            <RatioRow label="Obligaciones Financ. / EBITDA" data={sortedData} category="endeudamiento" dataKey="obligaciones_ebitda" higherIsBetter={false} />

            {/* BLOQUE OPERACION */}
            <tr className="bg-slate-800/50">
              <td colSpan={years.length + 1} className="p-2 pl-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 border-t border-slate-800">
                4. Operación y Rentabilidad
              </td>
            </tr>
            <RatioRow label="EBITDA ($)" data={sortedData} category="operacion" dataKey="ebitda" format="currency" higherIsBetter={true} />
            <RatioRow label="Margen EBITDA" data={sortedData} category="operacion" dataKey="margen_ebitda" format="percentage" higherIsBetter={true} />
            <RatioRow label="Margen Bruto" data={sortedData} category="operacion" dataKey="margen_bruto" format="percentage" higherIsBetter={true} />
            <RatioRow label="Margen Operacional" data={sortedData} category="operacion" dataKey="margen_operacional" format="percentage" higherIsBetter={true} />
            <RatioRow label="Margen Neto" data={sortedData} category="operacion" dataKey="margen_neto" format="percentage" higherIsBetter={true} />
            <RatioRow label="ROA (Retorno sobre Activos)" data={sortedData} category="operacion" dataKey="roa" format="percentage" higherIsBetter={true} />
            <RatioRow label="ROE (Retorno sobre Patrimonio)" data={sortedData} category="operacion" dataKey="roe" format="percentage" higherIsBetter={true} />

          </tbody>
        </table>
      </div>
    </div>
  );
}
