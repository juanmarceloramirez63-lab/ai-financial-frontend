"use client";

import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  LayoutDashboard, FileText, AlertTriangle, TrendingUp, 
  Settings, LogOut, FileSearch, Building2, Download, Database
} from 'lucide-react';
import UploadDocument from '../components/UploadDocument';
import FraudDashboard from '../components/FraudDashboard';
import BenchmarkingDashboard from '../components/BenchmarkingDashboard';
import HumanInTheLoopForm from '../components/HumanInTheLoopForm';
import dynamic from 'next/dynamic';
import { BACKEND_URL } from '../lib/config';

// ... (keep dynamic import of BIDashboard)
const BIDashboard = dynamic(() => import('../components/BIDashboard'), { ssr: false });
const StatisticalAnalysisDashboard = dynamic(() => import('../components/StatisticalAnalysisDashboard'), { ssr: false });

// INITIAL DUMMY DATA FROM OUR PYTHON BACKEND
const initialFinancialData = {
  liquidez_corriente: 1.6,
  prueba_acida: 1.2,
  endeudamiento_total: 60.0,
  leverage: 1.5,
  deuda_ebitda: 3.43,
  roa: 10.0,
  roe: 25.0,
  margen_ebitda: 23.3,
  z_score: 2.94,
  z_zona: "Zona Segura"
};



import ClientDirectory from '../components/ClientDirectory';
import DetailedFinancialMatrix from '../components/DetailedFinancialMatrix';
import RawFinancialStatementsMatrix from '../components/RawFinancialStatementsMatrix';

const initialRawData = [
  {
    anio: 2023,
    ventas: 1000000,
    costo_de_ventas: 550000,
    utilidad_bruta: 450000,
    gastos_administrativos: 100000,
    gastos_ventas: 80000,
    utilidad_operacional: 270000,
    ebitda: 310000,
    gastos_financieros: 50000,
    utilidad_neta: 154000,
    activo_corriente: 600000,
    cuentas_por_cobrar: 120000,
    inventarios: 150000,
    activo_total: 1200000,
    pasivo_corriente: 350000,
    cuentas_por_pagar: 110000,
    obligaciones_financieras: 450000,
    pasivo_total: 800000,
    patrimonio: 400000,
    utilidad_retenida: 246000
  },
  {
    anio: 2024,
    ventas: 1250000,
    costo_de_ventas: 600000,
    utilidad_bruta: 650000,
    gastos_administrativos: 110000,
    gastos_ventas: 90000,
    utilidad_operacional: 450000,
    ebitda: 500000,
    gastos_financieros: 450000,
    utilidad_neta: 0,
    activo_corriente: 800000,
    cuentas_por_cobrar: 150000,
    inventarios: 120000,
    activo_total: 1500000,
    pasivo_corriente: 300000,
    cuentas_por_pagar: 140000,
    obligaciones_financieras: 400000,
    pasivo_total: 700000,
    patrimonio: 800000,
    utilidad_retenida: 800000
  }
];

const initialMatrixData = [
  {
    anio: 2023,
    liquidez: { razon_corriente: 1.5, prueba_acida: 1.1, capital_trabajo: 500000 },
    eficiencia: { dias_cartera: 45.2, dias_inventario: 60.1, dias_proveedores: 30.5, cce: 74.8 },
    endeudamiento: { nivel_endeudamiento: 65.0, cobertura_intereses: 3.2, obligaciones_ebitda: 2.1 },
    operacion: { margen_bruto: 40.5, margen_operacional: 18.2, margen_neto: 12.4, roa: 8.5, roe: 18.2 }
  },
  {
    anio: 2024,
    liquidez: { razon_corriente: 1.6, prueba_acida: 1.2, capital_trabajo: 650000 },
    eficiencia: { dias_cartera: 42.1, dias_inventario: 55.4, dias_proveedores: 35.2, cce: 62.3 },
    endeudamiento: { nivel_endeudamiento: 60.0, cobertura_intereses: 4.5, obligaciones_ebitda: 1.8 },
    operacion: { margen_bruto: 45.0, margen_operacional: 22.5, margen_neto: 15.8, roa: 10.0, roe: 25.0 }
  }
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('directorio');
  const [financialData, setFinancialData] = useState<any>(initialFinancialData);
  const [rawData, setRawData] = useState<any>(null);
  const [fraudData, setFraudData] = useState<any>(null);
  const [benchmarkData, setBenchmarkData] = useState<any>(null);
  const [matrixData, setMatrixData] = useState<any>(initialMatrixData);
  
  // Estados para validación Human-in-the-Loop
  const [isValidating, setIsValidating] = useState(false);
  const [validationDocUrls, setValidationDocUrls] = useState<string[]>([]);
  const [isProcessingAnalysis, setIsProcessingAnalysis] = useState(false);

  // Paso 1: Extracción Completada
  const handleExtractComplete = (extractedData: any, docUrls: string[]) => {
    setRawData(extractedData);
    setValidationDocUrls(docUrls);
    setIsValidating(true);
    setActiveTab('analizar');
  };

  // Paso 2: Validación Confirmada (Llamada al backend)
  const handleConfirmValidation = async (validatedData: any) => {
    setIsProcessingAnalysis(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/run-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa: validatedData.empresa,
          datos_extraidos: { datos_comparativos: validatedData.datos_comparativos },
          tamanos_seleccionados: validatedData.tamanos_seleccionados
        }),
      });

      if (!response.ok) {
        throw new Error('Error al ejecutar el análisis.');
      }

      const result = await response.json();
      
      if (result.diagnostico) {
        const d = result.diagnostico;
        const newFinData = {
          liquidez_corriente: d.liquidez.liquidez_corriente,
          prueba_acida: d.liquidez.prueba_acida,
          endeudamiento_total: d.endeudamiento.endeudamiento_total,
          leverage: d.endeudamiento.leverage,
          deuda_ebitda: d.endeudamiento.deuda_ebitda,
          roa: d.rentabilidad.roa,
          roe: d.rentabilidad.roe,
          margen_ebitda: d.rentabilidad.margen_ebitda,
          z_score: d.altman_z_score.score,
          z_zona: d.altman_z_score.zona
        };
        
        setFinancialData(newFinData);
        setRawData(result.datos_extraidos);
        setFraudData(result.fraude || null);
        setBenchmarkData(result.benchmarking || null);
        setMatrixData(result.matriz_financiera || null);
        
        setIsValidating(false);
        setActiveTab('dashboard');
      }
    } catch (err) {
      console.error(err);
      alert('Hubo un error al correr el análisis de riesgo.');
    } finally {
      setIsProcessingAnalysis(false);
    }
  };

  const handleSelectClient = (client: any) => {
    // Cuando eligen un cliente de la DB, cargamos los datos y los mandamos al dashboard
    if (client.diagnostico) {
      const d = client.diagnostico;
      const newFinData = {
          liquidez_corriente: d.liquidez.liquidez_corriente,
          prueba_acida: d.liquidez.prueba_acida,
          endeudamiento_total: d.endeudamiento.endeudamiento_total,
          leverage: d.endeudamiento.leverage,
          deuda_ebitda: d.endeudamiento.deuda_ebitda,
          roa: d.rentabilidad.roa,
          roe: d.rentabilidad.roe,
          margen_ebitda: d.rentabilidad.margen_ebitda,
          z_score: d.altman_z_score.score,
          z_zona: d.altman_z_score.zona
      };
      setFinancialData(newFinData);
      setRawData(client.datos_extraidos);
      setFraudData(client.fraude);
      setBenchmarkData(client.benchmarking);
      setMatrixData(client.diagnostico.matriz_financiera || null);
      setActiveTab('dashboard');
    }
  };

  const dynamicChartData = matrixData && Array.isArray(matrixData)
    ? [...matrixData].sort((a: any, b: any) => a.anio - b.anio).map((d: any) => ({
        year: d.anio?.toString() || '',
        roa: d.operacion?.roa || 0,
        roe: d.operacion?.roe || 0
      }))
    : [];

  return (
    <div className="flex h-screen bg-[#000033] text-slate-200 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#000022] border-r border-[#4fc3f7]/20 flex flex-col hidden md:flex">
        <div className="p-4 flex items-center justify-center border-b border-slate-800/50">
          <img 
            src="/logo_ratio.png" 
            alt="Ratio CE Logo" 
            className="h-60 w-auto object-contain"
          />
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-4">
          <NavItem icon={<LayoutDashboard size={20} />} label="Portafolio Clientes" active={activeTab === 'directorio'} onClick={() => setActiveTab('directorio')} />
          <NavItem icon={<LayoutDashboard size={20} />} label="Resultados Auditoría" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<FileSearch size={20} />} label="Analizar Nuevo Doc" active={activeTab === 'analizar'} onClick={() => { setActiveTab('analizar'); setIsValidating(false); }} />
          <NavItem icon={<Database size={20} />} label="BI Explorador" active={activeTab === 'bi'} onClick={() => setActiveTab('bi')} />
          <NavItem icon={<TrendingUp size={20} />} label="Estadísticas e Impacto" active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
          <NavItem icon={<Building2 size={20} />} label="Histórico Sectorial" active={activeTab === 'historico'} onClick={() => setActiveTab('historico')} />
          <NavItem icon={<AlertTriangle size={20} />} label="Alertas Fraude" active={activeTab === 'fraude'} onClick={() => setActiveTab('fraude')} />
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <NavItem icon={<Settings size={20} />} label="Configuración" active={false} onClick={() => {}} />
          <NavItem icon={<LogOut size={20} />} label="Cerrar Sesión" active={false} onClick={() => {}} />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        

        {/* TOP HEADER */}
        <header className="h-20 flex items-center justify-between px-8 border-b border-[#4fc3f7]/20 bg-[#000033]/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <div>
            <div className="flex items-baseline gap-3">
              <h2 className="text-2xl font-semibold text-white">
                {activeTab === 'directorio' && "Portafolio de Clientes (Supabase)"}
                {activeTab === 'dashboard' && "Resultados de Auditoría"}
                {activeTab === 'analizar' && "Analizar Nuevo Documento"}
                {activeTab === 'historico' && "Benchmarking Sectorial"}
                {activeTab === 'bi' && "Explorador de Inteligencia de Negocios"}
                {activeTab === 'stats' && "Análisis Estadístico e Impacto Financiero"}
                {activeTab === 'fraude' && "Auditoría y Fraude"}
                {activeTab === 'informe' && "Reportes Inteligentes"}
              </h2>
            </div>
            <p className="text-sm text-slate-400">
              {activeTab === 'directorio' ? "Base de datos maestra de PYMES analizadas" : ""}
              {activeTab === 'dashboard' ? "Datos extraídos y analizados en tiempo real por IA" : ""}
              {activeTab === 'analizar' ? "Sube tus estados financieros aquí" : ""}
              {activeTab === 'bi' ? "Procesamiento de Big Data en tiempo real de toda tu base de datos" : ""}
              {activeTab === 'stats' ? "Estadísticas descriptivas, benchmarking por desviaciones estándar y simulación de estrés macroeconómico" : ""}
              {(activeTab === 'historico' || activeTab === 'fraude' || activeTab === 'informe') ? "Módulo en construcción (Fases 2 y 3)" : ""}
            </p>
          </div>
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-lg shadow-indigo-500/20">
            <Download size={18} />
            Exportar PDF
          </button>
        </header>

        {/* DYNAMIC CONTENT */}
        {activeTab === 'directorio' ? (
          <ClientDirectory onSelectClient={handleSelectClient} />
        ) : activeTab === 'analizar' ? (
          <div className="flex-1 flex flex-col p-8 overflow-hidden">
            {isValidating ? (
              <HumanInTheLoopForm 
                initialData={rawData} 
                documentUrls={validationDocUrls}
                onConfirm={handleConfirmValidation} 
                isLoading={isProcessingAnalysis} 
              />
            ) : (
              <UploadDocument onExtractComplete={handleExtractComplete} />
            )}
          </div>

        ) : activeTab === 'fraude' ? (
          <div className="flex-1 flex flex-col overflow-y-auto">
            <FraudDashboard fraudData={fraudData} />
          </div>
        ) : activeTab === 'historico' ? (
          <div className="flex-1 flex flex-col overflow-y-auto">
            <BenchmarkingDashboard benchmarkData={benchmarkData} />
          </div>
        ) : activeTab === 'bi' ? (
          <div className="flex-1 flex flex-col overflow-y-auto">
            <BIDashboard />
          </div>
        ) : activeTab === 'stats' ? (
          <div className="flex-1 flex flex-col overflow-y-auto">
            <StatisticalAnalysisDashboard />
          </div>
        ) : activeTab !== 'dashboard' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 mb-6 text-slate-700">
              {activeTab === 'informe' && <FileText className="w-full h-full" />}
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Módulo Próximamente</h3>
            <p className="text-slate-400 max-w-md">
              Esta sección pertenece a una fase posterior del desarrollo. Se activará cuando construyamos este módulo específico.
            </p>
          </div>
        ) : (
          <div className="p-8 space-y-8">
          
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard 
              title="ROA (Retorno sobre Activos)" 
              value={`${financialData.roa}%`} 
              trend="+0.9% vs año anterior" 
              status="good" 
            />
            <KpiCard 
              title="Razón Corriente" 
              value={financialData.liquidez_corriente.toString()} 
              trend="Ideal > 1.0" 
              status={financialData.liquidez_corriente > 1 ? "good" : "bad"} 
            />
            <KpiCard 
              title="Nivel de Endeudamiento" 
              value={`${financialData.endeudamiento_total}%`} 
              trend="Bajo control" 
              status={financialData.endeudamiento_total < 70 ? "good" : "warning"} 
            />
            <KpiCard 
              title="Altman Z-Score" 
              value={financialData.z_score.toString()} 
              trend={financialData.z_zona} 
              status={financialData.z_score > 2.6 ? "good" : "bad"} 
            />
          </div>

          {/* CHARTS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* MAIN CHART */}
            <div className="lg:col-span-2 bg-[#161b22] border border-slate-800 rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-indigo-400" />
                Evolución de Rentabilidad Histórica
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dynamicChartData}>
                    <defs>
                      <linearGradient id="colorRoa" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRoe" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="year" stroke="#64748b" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <YAxis stroke="#64748b" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0f111a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Area type="monotone" dataKey="roe" name="ROE" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorRoe)" />
                    <Area type="monotone" dataKey="roa" name="ROA" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRoa)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SIDE PANEL */}
            <div className="bg-[#161b22] border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col">
              <h3 className="text-lg font-medium text-white mb-6">Diagnóstico Ejecutivo</h3>
              
              <div className="flex-1 space-y-4">
                <DiagnosticItem 
                  title="Liquidez" 
                  desc={`La empresa cuenta con $${financialData.liquidez_corriente} por cada $1 de deuda a corto plazo.`} 
                  status={financialData.liquidez_corriente > 1 ? "good" : "bad"}
                />
                <DiagnosticItem 
                  title="Rentabilidad (ROE)" 
                  desc={`El retorno sobre el patrimonio es del ${financialData.roe}%.`} 
                  status={financialData.roe > 15 ? "good" : "warning"}
                />
                <DiagnosticItem 
                  title="Riesgo de Quiebra" 
                  desc={`El score Z de Altman indica que la empresa está en ${financialData.z_zona}.`} 
                  status={financialData.z_score > 2.6 ? "good" : financialData.z_score < 1.1 ? "bad" : "warning"}
                />
              </div>
              <button 
                onClick={() => setActiveTab('fraude')}
                className="w-full mt-6 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg transition-colors border border-slate-700 font-medium">
                Ver Auditoría Forense
              </button>
            </div>
          </div>
          
          {/* DETAILED FINANCIAL MATRIX */}
          <DetailedFinancialMatrix matrixData={matrixData} />
          
          {/* RAW FINANCIAL STATEMENTS MATRIX (NOW WITH V/H ANALYSIS) */}
          <RawFinancialStatementsMatrix rawData={rawData?.datos_comparativos || initialRawData} />
          </div>
        )}
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      active 
        ? 'bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-500/20' 
        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
    }`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function KpiCard({ title, value, trend, status }: { title: string, value: string, trend: string, status: 'good' | 'warning' | 'bad' }) {
  const statusColors = {
    good: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    warning: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    bad: 'text-rose-400 bg-rose-400/10 border-rose-400/20'
  };

  return (
    <div className="bg-[#161b22] border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-colors">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
      
      <h4 className="text-slate-400 text-sm font-medium mb-2">{title}</h4>
      <div className="text-3xl font-bold text-white mb-3 tracking-tight">{value}</div>
      <div className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-md border ${statusColors[status]}`}>
        {trend}
      </div>
    </div>
  );
}

function DiagnosticItem({ title, desc, status }: { title: string, desc: string, status: 'good' | 'warning' | 'bad' }) {
  const iconColors = {
    good: 'bg-emerald-500/20 text-emerald-400',
    warning: 'bg-amber-500/20 text-amber-400',
    bad: 'bg-rose-500/20 text-rose-400'
  };

  return (
    <div className="flex gap-4 items-start p-4 rounded-lg bg-[#0f111a] border border-slate-800/50">
      <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${status === 'good' ? 'bg-emerald-400' : status === 'warning' ? 'bg-amber-400' : 'bg-rose-400'}`}></div>
      <div>
        <h5 className="text-slate-200 font-medium text-sm mb-1">{title}</h5>
        <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
