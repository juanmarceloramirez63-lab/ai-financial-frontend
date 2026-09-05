"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BACKEND_URL } from '../lib/config';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  TrendingUp, AlertTriangle, ShieldCheck, HelpCircle, Download, 
  Search, Sliders, Loader2, Sparkles, Filter, RotateCcw, MapPin, Building2, Calendar
} from 'lucide-react';

import IntegralFinancialDashboard from './IntegralFinancialDashboard';

const DEFAULT_DEPARTAMENTOS = [
  'BOGOTA D.C.', 'ANTIOQUIA', 'VALLE DEL CAUCA', 'CUNDINAMARCA', 'SANTANDER',
  'ATLANTICO', 'BOLIVAR', 'BOYACA', 'CALDAS', 'CASANARE', 'CAUCA', 'CESAR',
  'CORDOBA', 'HUILA', 'LA GUAJIRA', 'MAGDALENA', 'META', 'NARINO',
  'NORTE DE SANTANDER', 'QUINDIO', 'RISARALDA', 'SAN ANDRES Y PROVIDENCIA',
  'SUCRE', 'TOLIMA', 'AMAZONAS', 'ARAUCA', 'CAQUETA', 'CHOCO', 'GUAINIA',
  'GUAVIARE', 'PUTUMAYO', 'VAUPES', 'VICHADA'
];

const DEFAULT_ANIOS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015];

const DEFAULT_SECTORES = [
  "Comercio al por mayor y al por menor; reparación de vehículos",
  "Industrias manufactureras",
  "Construcción",
  "Agricultura, ganadería, caza, silvicultura y pesca",
  "Transporte y almacenamiento",
  "Información y comunicaciones",
  "Actividades inmobiliarias",
  "Actividades profesionales, científicas y técnicas",
  "Actividades de servicios administrativos y de apoyo",
  "Alojamiento y servicios de comida",
  "Suministro de electricidad, gas, vapor y aire acondicionado",
  "Explotación de minas y canteras"
];

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
  selectedDept = 'TODOS',
  setSelectedDept,
  selectedCiudad = 'TODOS',
  setSelectedCiudad,
  selectedTamano = 'TODOS',
  setSelectedTamano,
  selectedYear = 'TODOS',
  setSelectedYear,
  selectedCiiu = 'TODOS',
  setSelectedCiiu
}: any) {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<StatItem[]>([]);
  const [stressData, setStressData] = useState<StressResult | null>(null);
  const [alertData, setAlertData] = useState<AlertResult | null>(null);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [companyDetails, setCompanyDetails] = useState<any | null>(null);
  const [loadingCompanyDetails, setLoadingCompanyDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtros interactivos locales y sincronizados
  const [activeDept, setActiveDept] = useState(selectedDept || 'TODOS');
  const [activeCiudad, setActiveCiudad] = useState(selectedCiudad || 'TODOS');
  const [activeTamano, setActiveTamano] = useState(selectedTamano || 'TODOS');
  const [activeYear, setActiveYear] = useState(selectedYear || 'TODOS');
  const [activeCiiu, setActiveCiiu] = useState(selectedCiiu || 'TODOS');

  // Metadatos de opciones de filtros de la BD
  const [filtersMeta, setFiltersMeta] = useState<any>(null);

  // Sliders del Simulador de Estrés (Por defecto 0% para ver situación base limpia)
  const [shockRevenue, setShockRevenue] = useState(0);
  const [shockCosts, setShockCosts] = useState(0);
  const [shockExpenses, setShockExpenses] = useState(0);

  // Sincronizar props entrantes
  useEffect(() => {
    if (selectedDept !== undefined) setActiveDept(selectedDept);
  }, [selectedDept]);

  useEffect(() => {
    if (selectedCiudad !== undefined) setActiveCiudad(selectedCiudad);
  }, [selectedCiudad]);

  useEffect(() => {
    if (selectedTamano !== undefined) setActiveTamano(selectedTamano);
  }, [selectedTamano]);

  useEffect(() => {
    if (selectedYear !== undefined) setActiveYear(selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    if (selectedCiiu !== undefined) setActiveCiiu(selectedCiiu);
  }, [selectedCiiu]);

  // Cargar metadatos de filtros desde backend
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        let res = await fetch(`${BACKEND_URL}/api/bi/filters`, { cache: 'no-store' }).catch(() => null);
        if (!res || !res.ok) {
          res = await fetch(`/api/bi/filters`, { cache: 'no-store' }).catch(() => null);
        }
        if (res && res.ok) {
          const json = await res.json();
          setFiltersMeta(json);
        }
      } catch (err) {
        console.error("Error al cargar filtros para Estadísticas:", err);
      }
    }
    loadFilterOptions();
  }, []);

  // Lista de ciudades disponibles dinámicamente según el departamento seleccionado
  const availableCities = useMemo(() => {
    if (activeDept !== "TODOS" && filtersMeta?.ciudades_por_departamento && filtersMeta.ciudades_por_departamento[activeDept]) {
      return filtersMeta.ciudades_por_departamento[activeDept];
    }
    return filtersMeta?.ciudades || [];
  }, [filtersMeta, activeDept]);

  // Manejar sincronización de filtros desde el Dashboard Integral
  const handleIntegralFiltersChange = useCallback((filters: any) => {
    if (filters.departamento) {
      setActiveDept(filters.departamento);
      if (setSelectedDept) setSelectedDept(filters.departamento);
    }
    if (filters.ciudad) {
      setActiveCiudad(filters.ciudad);
      if (setSelectedCiudad) setSelectedCiudad(filters.ciudad);
    }
    if (filters.tamano) {
      setActiveTamano(filters.tamano);
      if (setSelectedTamano) setSelectedTamano(filters.tamano);
    }
    if (filters.sector) {
      setActiveCiiu(filters.sector);
      if (setSelectedCiiu) setSelectedCiiu(filters.sector);
    }
    if (filters.anoFin) {
      const yr = String(filters.anoFin);
      setActiveYear(yr);
      if (setSelectedYear) setSelectedYear(yr);
    }
  }, [setSelectedDept, setSelectedCiudad, setSelectedTamano, setSelectedCiiu, setSelectedYear]);

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
      if (activeDept && activeDept !== 'TODOS') payload.departamento = activeDept;
      if (activeCiudad && activeCiudad !== 'TODOS') payload.ciudad = activeCiudad;
      if (activeTamano && activeTamano !== 'TODOS') payload.tamano = activeTamano;
      if (activeYear && activeYear !== 'TODOS') payload.anio = parseInt(activeYear);
      if (activeCiiu && activeCiiu !== 'TODOS') payload.sector = activeCiiu;

      let res = await fetch(`${BACKEND_URL}/api/bi/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store'
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch(`/api/bi/stats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          cache: 'no-store'
        }).catch(() => null);
      }

      if (res && res.ok) {
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

  // Escuchar cambios en los filtros activos
  useEffect(() => {
    loadStats();
  }, [activeDept, activeCiudad, activeTamano, activeYear, activeCiiu]);

  // Ejecutar el estrés manual al pulsar el botón
  const handleApplyStress = () => {
    loadStats();
  };

  // Restablecer filtros a TODOS
  const handleResetFilters = () => {
    setActiveDept('TODOS');
    setActiveCiudad('TODOS');
    setActiveTamano('TODOS');
    setActiveYear('TODOS');
    setActiveCiiu('TODOS');
    if (setSelectedDept) setSelectedDept('TODOS');
    if (setSelectedCiudad) setSelectedCiudad('TODOS');
    if (setSelectedTamano) setSelectedTamano('TODOS');
    if (setSelectedYear) setSelectedYear('TODOS');
    if (setSelectedCiiu) setSelectedCiiu('TODOS');
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

  // Selección de empresa para Benchmark (consulta integral-dashboard o fallback clientes)
  const handleSelectCompany = async (nit: string, razonSocial?: string) => {
    setSelectedCompany(nit);
    if (!nit) {
      setCompanyDetails(null);
      return;
    }
    
    setLoadingCompanyDetails(true);
    try {
      // 1. Intentar obtener datos completos de la base de datos empresarial BI
      const resBi = await fetch(`${BACKEND_URL}/api/bi/integral-dashboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nit: nit })
      });

      if (resBi.ok) {
        const dataBi = await resBi.json();
        if (dataBi && dataBi.empresa_info && dataBi.empresa_info.nit && dataBi.empresa_info.nit !== 'N/A') {
          const k = dataBi.kpis || {};
          const ig = dataBi.indicadores_gauges || {};
          const findG = (list: any[], term: string) => list?.find((g: any) => g.name?.toLowerCase().includes(term.toLowerCase()))?.actual || 0;

          const actTot = k.activos_totales?.actual || 0;
          const utNet = k.utilidad_neta?.actual || 0;
          const patTot = k.patrimonio_total?.actual || 0;
          const pasTot = k.pasivos_totales?.actual || (actTot - patTot);

          setCompanyDetails({
            razon_social: dataBi.empresa_info.razon_social || razonSocial || `Empresa (NIT: ${nit})`,
            roa: findG(ig.rentabilidad, 'roa') || (actTot > 0 ? (utNet / actTot) * 100 : 0),
            roe: k.roe?.actual || findG(ig.rentabilidad, 'roe') || 0,
            endeudamiento_total: findG(ig.endeudamiento, 'endeudamiento') || 0,
            prueba_acida: findG(ig.liquidez, 'ácida') || findG(ig.liquidez, 'acida') || 0,
            liquidez_corriente: findG(ig.liquidez, 'corriente') || 0,
            activo_total: actTot,
            pasivo_total: pasTot,
            patrimonio: patTot,
            ventas: k.ventas?.actual || 0,
            utilidad_neta: utNet
          });
          setLoadingCompanyDetails(false);
          return;
        }
      }

      // 2. Fallback a portafolio de clientes auditados
      const res = await fetch(`/api/clientes`);
      if (res.ok) {
        const data = await res.json();
        const found = data.clientes?.find((c: any) => String(c.nit) === String(nit));
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
      console.error("Error al cargar detalles de empresa para benchmark:", e);
    } finally {
      setLoadingCompanyDetails(false);
    }
  };

  const maxBy = (arr: any[], key: string) => {
    return arr.reduce((a, b) => (a[key] > b[key] ? a : b), arr[0]);
  };

  // Filtrado de la lista de empresas por búsqueda
  const filteredCompanies = useMemo(() => {
    if (!companies.length) return [];
    if (!searchQuery) return companies.slice(0, 50); 
    const searchLower = searchQuery.toLowerCase().trim();
    return companies.filter(c => 
      c.razon_social.toLowerCase().includes(searchLower) || 
      String(c.nit).includes(searchLower)
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
    link.setAttribute("download", `analisis_estadistico_${activeDept}_${activeTamano}.csv`);
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

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (activeDept !== 'TODOS') count++;
    if (activeCiudad !== 'TODOS') count++;
    if (activeTamano !== 'TODOS') count++;
    if (activeYear !== 'TODOS') count++;
    if (activeCiiu !== 'TODOS') count++;
    return count;
  }, [activeDept, activeCiudad, activeTamano, activeYear, activeCiiu]);

  return (
    <div className="p-4 md:p-8 space-y-8 bg-[#000033] min-h-screen text-slate-200">
      
      {/* 1. DASHBOARD DE ANÁLISIS FINANCIERO INTEGRAL */}
      <IntegralFinancialDashboard 
        onFiltersChange={handleIntegralFiltersChange}
        initialFilters={{
          departamento: activeDept,
          ciudad: activeCiudad,
          tamano: activeTamano,
          sector: activeCiiu,
          ano: activeYear
        }}
      />

      {/* SEPARADOR EJECUTIVO */}
      <div className="flex items-center gap-4 my-8">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#4fc3f7]/40 to-transparent"></div>
        <span className="text-xs font-black uppercase tracking-widest text-[#4fc3f7] bg-[#000022] px-4 py-1.5 rounded-full border border-[#4fc3f7]/30 shadow-md">
          Módulos Complementarios: Tendencia Central & Simulador de Estrés
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#4fc3f7]/40 to-transparent"></div>
      </div>

      {/* BARRA DE FILTROS INTERACTIVA Y SINCRONIZADA */}
      <div className="bg-[#000022] border border-[#4fc3f7]/30 p-5 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white uppercase text-xs tracking-wider">
              Filtros Activos (Tendencia Central y Simulador BI)
            </h3>
            {activeFiltersCount > 0 && (
              <span className="bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {activeFiltersCount} activo{activeFiltersCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-700"
            title="Restablecer todos los filtros a TODOS"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Filtros</span>
          </button>
        </div>
        
        {/* CONTROLES DESPLEGABLES INTERACTIVOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          
          {/* 1. Selector de Departamento */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Departamento
            </label>
            <select
              value={activeDept}
              onChange={(e) => {
                const val = e.target.value;
                setActiveDept(val);
                setActiveCiudad('TODOS');
                if (setSelectedDept) setSelectedDept(val);
                if (setSelectedCiudad) setSelectedCiudad('TODOS');
              }}
              className="w-full bg-[#161b22] border border-slate-700 text-slate-200 text-xs rounded-lg p-2 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none truncate"
            >
              <option value="TODOS">Todos los Deptos</option>
              {(filtersMeta?.departamentos && filtersMeta.departamentos.length > 0 ? filtersMeta.departamentos : DEFAULT_DEPARTAMENTOS).map((d: string, idx: number) => (
                <option key={idx} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* 2. Selector de Ciudad */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Ciudad / Municipio
            </label>
            <select
              value={activeCiudad}
              onChange={(e) => {
                const val = e.target.value;
                setActiveCiudad(val);
                if (setSelectedCiudad) setSelectedCiudad(val);
              }}
              className="w-full bg-[#161b22] border border-slate-700 text-slate-200 text-xs rounded-lg p-2 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none truncate"
            >
              <option value="TODOS">Todas las Ciudades</option>
              {availableCities.map((c: string, idx: number) => (
                <option key={idx} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* 3. Selector de Tamaño */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Tamaño Empresa
            </label>
            <select
              value={activeTamano}
              onChange={(e) => {
                const val = e.target.value;
                setActiveTamano(val);
                if (setSelectedTamano) setSelectedTamano(val);
              }}
              className="w-full bg-[#161b22] border border-slate-700 text-slate-200 text-xs rounded-lg p-2 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="TODOS">Todos los Tamaños</option>
              <option value="MICRO">Microempresa</option>
              <option value="PEQUEÑA">Pequeña</option>
              <option value="MEDIANA">Mediana</option>
              <option value="GRANDE">Grande</option>
            </select>
          </div>

          {/* 4. Selector de Año */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Año de Corte
            </label>
            <select
              value={activeYear}
              onChange={(e) => {
                const val = e.target.value;
                setActiveYear(val);
                if (setSelectedYear) setSelectedYear(val);
              }}
              className="w-full bg-[#161b22] border border-slate-700 text-slate-200 text-xs rounded-lg p-2 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="TODOS">Todos los Años</option>
              {(filtersMeta?.anios && filtersMeta.anios.length > 0 ? filtersMeta.anios : DEFAULT_ANIOS).map((y: number) => (
                <option key={y} value={y.toString()}>{y}</option>
              ))}
            </select>
          </div>

          {/* 5. Selector de Sector CIIU */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Sector CIIU
            </label>
            <select
              value={activeCiiu}
              onChange={(e) => {
                const val = e.target.value;
                setActiveCiiu(val);
                if (setSelectedCiiu) setSelectedCiiu(val);
              }}
              className="w-full bg-[#161b22] border border-slate-700 text-slate-200 text-xs rounded-lg p-2 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none truncate"
            >
              <option value="TODOS">Todos los Sectores</option>
              {(filtersMeta?.sectores && filtersMeta.sectores.length > 0 ? filtersMeta.sectores : DEFAULT_SECTORES).map((s: string, idx: number) => (
                <option key={idx} value={s} title={s}>
                  {s.length > 28 ? s.substring(0, 28) + '...' : s}
                </option>
              ))}
            </select>
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
                  onClick={() => handleSelectCompany(c.nit, c.razon_social)}
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
          <div className="lg:col-span-3 bg-slate-900/30 p-6 rounded-xl border border-slate-800 flex flex-col justify-between relative">
            {loadingCompanyDetails && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center rounded-xl z-20">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              </div>
            )}

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
              <div className="h-full flex flex-col items-center justify-center text-slate-500 py-8">
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
