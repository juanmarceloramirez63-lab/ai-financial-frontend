import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Percent, Compass, Award, 
  Filter, Calendar, Download, RefreshCw, AlertTriangle, ShieldCheck, 
  Info, ChevronRight, ChevronDown, CheckCircle2, Building2, Search,
  FileSpreadsheet, Printer, BarChart3, PieChart, Activity, Zap,
  Shield, User, LogOut, KeyRound, Lock
} from 'lucide-react';
import { BACKEND_URL } from '../lib/config';
import { useAuth, UserRole } from '../lib/AuthContext';
import AuthModal from './AuthModal';
import UserManagementModal from './UserManagementModal';

// Componente Semicircular Gauge Profesional (SVG Puro con Aguja y Zonas de Rendimiento)
interface GaugeProps {
  name: string;
  actual: number;
  anterior: number;
  variacion: number;
  media_base: number;
  percentil: number;
  zona: string;
  unit?: string;
  min?: number;
  max?: number;
  tipo?: string;
  interpretacion?: string;
}

const SemiCircularGauge: React.FC<GaugeProps> = ({
  name,
  actual = 0,
  anterior = 0,
  variacion = 0,
  media_base = 0,
  percentil = 50,
  zona = "MODERADO",
  unit = "",
  min = 0,
  max = 100,
  tipo = "HIGHER_IS_BETTER",
  interpretacion = ""
}) => {
  // Normalizar ángulo entre -90 y 90 grados (180 grados de barrido)
  const clampedVal = Math.max(min, Math.min(max, actual));
  const range = max - min || 1;
  const pct = (clampedVal - min) / range;
  const angle = -90 + pct * 180; // -90 (izq) a 90 (der)

  // Determinar paleta de colores del arco según HIGHER_IS_BETTER vs LOWER_IS_BETTER vs OPTIMAL_RANGE
  const isLowerBetter = tipo === "LOWER_IS_BETTER";
  const isOptimal = tipo === "OPTIMAL_RANGE";

  // Formatear valores
  const formattedActual = unit === "%" ? `${actual.toFixed(2)}%` : `${actual.toFixed(2)}${unit ? ' ' + unit : ''}`;
  const formattedAnterior = unit === "%" ? `${anterior.toFixed(2)}%` : `${anterior.toFixed(2)}${unit ? ' ' + unit : ''}`;
  const formattedMedia = unit === "%" ? `${media_base.toFixed(2)}%` : `${media_base.toFixed(2)}${unit ? ' ' + unit : ''}`;

  const isUp = variacion >= 0;
  const isPositiveChange = isLowerBetter ? !isUp : isUp;

  return (
    <div className="bg-white/95 text-slate-800 border border-slate-200/90 rounded-xl p-2.5 sm:p-3.5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col items-center justify-between text-center relative group min-w-0 w-full">
      <div 
        className="text-[11px] sm:text-xs font-bold text-slate-800 tracking-tight line-clamp-2 min-h-[30px] flex items-center justify-center text-center leading-tight mb-1 px-1 w-full" 
        title={name}
      >
        {name}
      </div>

      {/* SVG Semicircular Gauge Proporcional */}
      <div className="relative w-full max-w-[120px] aspect-[100/55] flex items-center justify-center my-0.5 mx-auto">
        <svg viewBox="0 0 100 55" className="w-full h-full overflow-visible">
          <defs>
            {/* Gradientes del arco según regla financiera */}
            <linearGradient id={`grad-${tipo}-${name.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="100%" y2="0%">
              {isLowerBetter ? (
                <>
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </>
              ) : isOptimal ? (
                <>
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="35%" stopColor="#10b981" />
                  <stop offset="65%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#ef4444" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#10b981" />
                </>
              )}
            </linearGradient>
          </defs>

          {/* Arco de fondo gris */}
          <path
            d="M 12 50 A 38 38 0 0 1 88 50"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Arco graduado de color */}
          <path
            d="M 12 50 A 38 38 0 0 1 88 50"
            fill="none"
            stroke={`url(#grad-${tipo}-${name.replace(/\s+/g, '')})`}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray="120"
            strokeDashoffset={0}
          />

          {/* Marcas de escala (Min, Med, Max) */}
          <text x="8" y="53" fontSize="5.5" fill="#64748b" fontWeight="600" textAnchor="end">{min}</text>
          <text x="50" y="10" fontSize="5.5" fill="#64748b" fontWeight="600" textAnchor="middle">{((min + max) / 2).toFixed(0)}</text>
          <text x="92" y="53" fontSize="5.5" fill="#64748b" fontWeight="600" textAnchor="start">{max}</text>

          {/* Aguja / Puntero */}
          <g transform={`translate(50, 50) rotate(${angle})`}>
            <polygon points="-2,0 0,-34 2,0" fill="#1e293b" />
            <circle cx="0" cy="0" r="3.5" fill="#0f172a" />
            <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
          </g>
        </svg>
      </div>

      {/* Lectura del valor actual y deltas */}
      <div className="w-full mt-1">
        <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight font-mono">
          {formattedActual}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500 font-medium my-0.5">
          <span className="whitespace-nowrap">Ant: <span className="font-semibold text-slate-700">{formattedAnterior}</span></span>
          <span className={`font-bold whitespace-nowrap flex items-center ${isPositiveChange ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isUp ? '↑' : '↓'} {Math.abs(variacion).toFixed(2)}
          </span>
        </div>

        <div className="text-[10px] text-slate-500 whitespace-nowrap">
          Sector: <span className="font-semibold text-slate-700">{formattedMedia}</span>
        </div>

        <div className="mt-1.5 inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full text-[9px] whitespace-nowrap shadow-2xs">
          <span>Percentil {percentil}</span>
        </div>
      </div>

      {/* Tooltip de interpretación contextual */}
      {interpretacion && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-52 p-2.5 bg-slate-900/95 backdrop-blur text-white text-[10px] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed border border-slate-700 text-left">
          <p className="font-bold text-[#38bdf8] mb-0.5">{name}</p>
          <p>{interpretacion}</p>
        </div>
      )}
    </div>
  );
};

// Mini Sparkline SVG para la tabla de análisis horizontal
const MiniSparkline: React.FC<{ data: number[] }> = ({ data = [] }) => {
  if (!data || data.length < 2) return <div className="text-[9px] text-slate-400">N/A</div>;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 70;
  const h = 18;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * w;
    const y = h - ((val - min) / range) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const isUp = data[data.length - 1] >= data[0];

  return (
    <svg width={w} height={h} className="overflow-visible inline-block">
      <polyline
        fill="none"
        stroke={isUp ? "#10b981" : "#ef4444"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {/* Punto final */}
      <circle
        cx={w}
        cy={h - ((data[data.length - 1] - min) / range) * (h - 4) - 2}
        r="2"
        fill={isUp ? "#10b981" : "#ef4444"}
      />
    </svg>
  );
};

// Mini Progress Bar para la tabla de análisis vertical
const MiniProgressBar: React.FC<{ percentage: number }> = ({ percentage = 0 }) => {
  const clamped = Math.max(0, Math.min(100, Math.abs(percentage)));
  return (
    <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden inline-block align-middle">
      <div
        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};

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

interface IntegralDashboardProps {
  onFiltersChange?: (filters: {
    empresa: string;
    nit: string;
    sector: string;
    tamano: string;
    departamento: string;
    ciudad: string;
    anoInicio: number;
    anoFin: number;
  }) => void;
  initialFilters?: {
    departamento?: string;
    ciudad?: string;
    tamano?: string;
    sector?: string;
    ano?: string | number;
  };
}

export default function IntegralFinancialDashboard({ onFiltersChange, initialFilters }: IntegralDashboardProps = {}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [filtersList, setFiltersList] = useState<any>(null);

  // Integración de Autenticación y Roles (RBAC)
  const { user, profile, isSuperAdmin, signOut, loading: authLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  // Estados de Filtros
  const [anoInicio, setAnoInicio] = useState(2015);
  const [anoFin, setAnoFin] = useState(2025);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>("TODAS");
  const [selectedEmpresaNit, setSelectedEmpresaNit] = useState<string>("");
  const [selectedSector, setSelectedSector] = useState<string>(initialFilters?.sector || "TODOS");
  const [selectedTamano, setSelectedTamano] = useState<string>(initialFilters?.tamano || "TODOS");
  const [selectedDepto, setSelectedDepto] = useState<string>(initialFilters?.departamento || "TODOS");
  const [selectedCiudad, setSelectedCiudad] = useState<string>(initialFilters?.ciudad || "TODOS");
  const compararCon = "Base de Datos del Sector";
  const [moneda, setMoneda] = useState<string>("COP");
  const [companySearch, setCompanySearch] = useState<string>("");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  // Checkboxes de estados financieros
  const [chkESF, setChkESF] = useState(true);
  const [chkERI, setChkERI] = useState(true);
  const [chkEFE, setChkEFE] = useState(true);

  // Estados de control responsivo y visualización
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeGaugeCategory, setActiveGaugeCategory] = useState<string>("TODOS");
  const [selectedEvolSeries, setSelectedEvolSeries] = useState<number>(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCompanyDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Notificar cambios de filtros al componente padre si está suscrito
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange({
        empresa: selectedEmpresa,
        nit: selectedEmpresaNit,
        sector: selectedSector,
        tamano: selectedTamano,
        departamento: selectedDepto,
        ciudad: selectedCiudad,
        anoInicio,
        anoFin
      });
    }
  }, [selectedEmpresa, selectedEmpresaNit, selectedSector, selectedTamano, selectedDepto, selectedCiudad, anoInicio, anoFin]);

  // Años disponibles
  const availableYears: number[] = useMemo(() => {
    return filtersList?.anios && filtersList.anios.length > 0 ? filtersList.anios : DEFAULT_ANIOS;
  }, [filtersList]);

  // Ciudades disponibles dinámicamente filtradas por departamento seleccionado
  const availableCiudades = useMemo(() => {
    if (selectedDepto !== "TODOS" && filtersList?.ciudades_por_departamento && filtersList.ciudades_por_departamento[selectedDepto]) {
      return filtersList.ciudades_por_departamento[selectedDepto];
    }
    return filtersList?.ciudades || [];
  }, [filtersList, selectedDepto]);

  // Cargar lista de filtros disponibles (años, empresas, sectores, ciudades)
  useEffect(() => {
    async function fetchFilters() {
      try {
        let res = await fetch(`${BACKEND_URL}/api/bi/filters`, { cache: 'no-store' }).catch(() => null);
        if (!res || !res.ok) {
          res = await fetch(`/api/bi/filters`, { cache: 'no-store' }).catch(() => null);
        }
        if (res && res.ok) {
          const json = await res.json();
          setFiltersList(json);
        }
      } catch (err) {
        console.error("Error al cargar filtros:", err);
      }
    }
    fetchFilters();
  }, []);

  // Cargar datos del dashboard integral (siempre comparando contra la base completa)
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const payload: any = {
        ano_inicio: anoInicio,
        ano_fin: anoFin,
        empresa: selectedEmpresa === "TODAS" ? null : selectedEmpresa,
        nit: selectedEmpresa === "TODAS" ? null : (selectedEmpresaNit || null),
        sector: selectedSector === "TODOS" ? null : selectedSector,
        tamano: selectedTamano === "TODOS" ? null : selectedTamano,
        departamento: selectedDepto === "TODOS" ? null : selectedDepto,
        ciudad: selectedCiudad === "TODOS" ? null : selectedCiudad,
        comparar_con: "Base de Datos del Sector"
      };

      let res = await fetch(`${BACKEND_URL}/api/bi/integral-dashboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store'
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch(`/api/bi/integral-dashboard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          cache: 'no-store'
        }).catch(() => null);
      }

      if (res && res.ok) {
        const json = await res.json();
        setData(json);
        if (selectedEmpresa !== "TODAS" && json.empresa_info?.nit && json.empresa_info?.nit !== 'N/A') {
          setSelectedEmpresaNit(json.empresa_info.nit);
        }
      }
    } catch (err) {
      console.error("Error al cargar dashboard integral:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [anoInicio, anoFin, selectedEmpresa, selectedSector, selectedTamano, selectedDepto, selectedCiudad]);

  // Manejo de cambio de rango de años respetando máximo 10 años
  const handleAnoInicioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseInt(e.target.value);
    if (anoFin - val + 1 > 10) {
      setAnoFin(val + 9);
    }
    setAnoInicio(val);
  };

  const handleAnoFinChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseInt(e.target.value);
    if (val - anoInicio + 1 > 10) {
      setAnoInicio(val - 9);
    }
    setAnoFin(val);
  };

  const handleResetFilters = () => {
    setAnoInicio(2015);
    setAnoFin(2025);
    setSelectedEmpresa("TODAS");
    setSelectedEmpresaNit("");
    setSelectedSector("TODOS");
    setSelectedTamano("TODOS");
    setSelectedDepto("TODOS");
    setSelectedCiudad("TODOS");
    setMoneda("COP");
    setCompanySearch("");
  };

  const handleSelectCompany = (c: any) => {
    if (!c || c === "TODAS" || c === "" || (typeof c === 'object' && (c?.razon_social === "TODAS" || c?.nit === "TODAS" || !c?.razon_social))) {
      setSelectedEmpresa("TODAS");
      setSelectedEmpresaNit("");
      setCompanySearch("");
    } else {
      const name = typeof c === 'string' ? c : (c.razon_social || c.name);
      let nit = typeof c === 'object' ? String(c.nit || '') : '';
      if (!nit && filtersList?.empresas) {
        const found = filtersList.empresas.find((emp: any) => (emp.razon_social || emp.name) === name || String(emp.nit) === name);
        if (found) nit = String(found.nit || '');
      }
      setSelectedEmpresa(name);
      setSelectedEmpresaNit(nit);
      setCompanySearch(name);
    }
    setShowCompanyDropdown(false);
  };

  const handleCompanySelect = (nameOrNit: string, nit?: string) => {
    if (!nameOrNit || nameOrNit === "TODAS" || nameOrNit === "") {
      handleSelectCompany("TODAS");
      return;
    }
    if (nit) {
      handleSelectCompany({ razon_social: nameOrNit, nit });
      return;
    }
    if (filtersList?.empresas) {
      const found = filtersList.empresas.find((emp: any) => String(emp.nit) === nameOrNit || (emp.razon_social || emp.name) === nameOrNit);
      if (found) {
        handleSelectCompany({ razon_social: found.razon_social || found.name, nit: found.nit });
        return;
      }
    }
    handleSelectCompany(nameOrNit);
  };

  // Empresas filtradas para el buscador con restricción de permisos por rol
  const rawCompaniesList = filtersList?.empresas || [];
  const companiesList = useMemo(() => {
    if (profile?.rol === 'cliente' && profile.nits_permitidos && profile.nits_permitidos.length > 0) {
      // Filtrar estrictamente solo para los NITs asignados al cliente
      return rawCompaniesList.filter((c: any) => {
        const nit = typeof c === 'object' ? String(c.nit || '') : '';
        return profile.nits_permitidos.includes(nit);
      });
    }
    return rawCompaniesList;
  }, [rawCompaniesList, profile]);
  const filteredCompanies = useMemo(() => {
    if (!companiesList.length) return [];
    if (!companySearch || !companySearch.trim()) return companiesList.slice(0, 100);
    const searchLower = companySearch.toLowerCase().trim();
    return companiesList.filter((c: any) => {
      if (typeof c === 'string') return c.toLowerCase().includes(searchLower);
      const nameMatch = c.razon_social ? c.razon_social.toLowerCase().includes(searchLower) : false;
      const nitMatch = c.nit ? String(c.nit).includes(searchLower) : false;
      return nameMatch || nitMatch;
    }).slice(0, 100);
  }, [companiesList, companySearch]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedEmpresa && selectedEmpresa !== "TODAS") count++;
    if (selectedSector && selectedSector !== "TODOS") count++;
    if (selectedTamano && selectedTamano !== "TODOS") count++;
    if (selectedDepto && selectedDepto !== "TODOS") count++;
    if (anoInicio !== 2015 || anoFin !== 2025) count++;
    return count;
  }, [selectedEmpresa, selectedSector, selectedTamano, selectedDepto, anoInicio, anoFin]);

  // Formato monetario (con soporte dinámico para USD y COP)
  const FX_RATE_USD = 4000;

  const fmtMoney = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) return moneda === 'USD' ? "US$ 0" : "$ 0";
    const adjusted = moneda === 'USD' ? val / FX_RATE_USD : val;
    const prefix = moneda === 'USD' ? 'US$' : '$';
    const abs = Math.abs(adjusted);
    if (abs >= 1e9) return `${prefix} ${(adjusted / 1e9).toFixed(3)} B`;
    if (abs >= 1e6) return `${prefix} ${(adjusted / 1e6).toFixed(3)} M`;
    if (abs >= 1e3) return `${prefix} ${(adjusted / 1e3).toFixed(1)} K`;
    return `${prefix} ${adjusted.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
  };

  // Formato compacto para barras de gráficos (evita que se desborden)
  const fmtShort = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) return moneda === 'USD' ? "US$0" : "$0";
    const adjusted = moneda === 'USD' ? val / FX_RATE_USD : val;
    const prefix = moneda === 'USD' ? 'US$' : '$';
    const abs = Math.abs(adjusted);
    const sign = adjusted < 0 ? "-" : "";
    if (abs >= 1e9) return `${sign}${prefix}${(abs / 1e9).toFixed(1)}B`;
    if (abs >= 1e6) return `${sign}${prefix}${(abs / 1e6).toFixed(1)}M`;
    if (abs >= 1e3) return `${sign}${prefix}${(abs / 1e3).toFixed(0)}K`;
    return `${sign}${prefix}${abs.toFixed(0)}`;
  };

  const fmtThousands = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) return "0";
    const adjusted = moneda === 'USD' ? val / FX_RATE_USD : val;
    return (adjusted / 1000).toLocaleString('es-CO', { maximumFractionDigits: 0 });
  };

  // Exportar a CSV
  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ["DASHBOARD DE ANALISIS FINANCIERO INTEGRAL - FINANZIA PRO"],
      [`Empresa: ${data.empresa_info?.razon_social || selectedEmpresa}`],
      [`NIT: ${data.empresa_info?.nit || selectedEmpresaNit || 'N/A'}`],
      [`Periodo: ${data.empresa_info?.periodo}`],
      [`Fecha de Exportacion: ${new Date().toLocaleString('es-CO')}`],
      [],
      ["KPIS PRINCIPALES", "Actual (COP)", "Anterior (COP)", "Variacion %", "Variacion Absoluta"],
      ["Activos Totales", data.kpis?.activos_totales?.actual, data.kpis?.activos_totales?.anterior, `${data.kpis?.activos_totales?.var_pct?.toFixed(2)}%`, data.kpis?.activos_totales?.var_abs],
      ["Utilidad Neta", data.kpis?.utilidad_neta?.actual, data.kpis?.utilidad_neta?.anterior, `${data.kpis?.utilidad_neta?.var_pct?.toFixed(2)}%`, data.kpis?.utilidad_neta?.var_abs],
      ["Ventas Netas", data.kpis?.ventas?.actual, data.kpis?.ventas?.anterior, `${data.kpis?.ventas?.var_pct?.toFixed(2)}%`, data.kpis?.ventas?.var_abs],
      ["EBITDA", data.kpis?.ebitda?.actual, data.kpis?.ebitda?.anterior, `${data.kpis?.ebitda?.var_pct?.toFixed(2)}%`, data.kpis?.ebitda?.var_abs],
      ["ROE", `${data.kpis?.roe?.actual?.toFixed(2)}%`, `${data.kpis?.roe?.anterior?.toFixed(2)}%`, `${data.kpis?.roe?.var_pp?.toFixed(2)} p.p.`, ""],
      ["Margen Neto", `${data.kpis?.margen_neto?.actual?.toFixed(2)}%`, `${data.kpis?.margen_neto?.anterior?.toFixed(2)}%`, `${data.kpis?.margen_neto?.var_pp?.toFixed(2)} p.p.`, ""]
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(";")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Analisis_Financiero_${data.empresa_info?.nit || selectedEmpresaNit || 'Poblacion'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const info = data?.empresa_info || {};
  const kpis = data?.kpis || {};
  const ah = data?.analisis_horizontal || {};
  const av = data?.analisis_vertical || {};
  const ig = data?.indicadores_gauges || {};
  const ep = data?.evolucion_principal || {};
  const fc = data?.flujo_caja || {};
  const cs = data?.comparativo_sector || [];
  const hm = data?.heatmap_indicadores || [];
  const alertas = data?.alertas || [];

  return (
    <div className="w-full bg-[#f1f5f9] text-slate-800 font-sans p-4 md:p-6 rounded-2xl shadow-xl border border-slate-300 space-y-6">
      
      {/* ============================================================ */}
      {/* 1. ENCABEZADO PRINCIPAL (NAVY + BARRA DE ACCIÓN EJECUTIVA)  */}
      {/* ============================================================ */}
      <div className="bg-[#0a192f] text-white rounded-xl p-4 md:p-5 shadow-lg flex flex-wrap items-center justify-between gap-4 border-b-4 border-indigo-500">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-lg text-white shadow-md flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-widest text-indigo-400 uppercase">FINANZIA PRO</span>
              <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded font-mono font-bold">Intelligence BI</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Dashboard de Análisis Financiero Integral
            </h1>
            <p className="text-xs text-slate-300">
              Análisis Vertical, Horizontal, Indicadores Financieros y Comparación con Base de Datos
            </p>
          </div>
        </div>

        {/* CONTROLES RÁPIDOS EN EL HEADER */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Rango de Años Rápido */}
          <div className="bg-[#112240] border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <div>
              <span className="text-[9px] text-slate-400 block font-semibold uppercase">Rango de Años</span>
              <span className="font-bold text-white">{anoInicio} – {anoFin} ({anoFin - anoInicio + 1} años)</span>
            </div>
          </div>

          {/* Selector de Empresa Rápido con NIT */}
          <div className="relative">
            <button
              onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
              className="bg-[#112240] border border-slate-700 px-3 py-1.5 rounded-lg flex items-center justify-between gap-3 text-xs min-w-[220px] text-left hover:border-indigo-400 transition-colors"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-slate-400 font-semibold uppercase">Empresa / NIT</span>
                  {selectedEmpresa !== "TODAS" && (info.nit || selectedEmpresaNit) && (
                    <span className="text-[8.5px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.2 rounded font-mono font-bold">
                      NIT: {info.nit || selectedEmpresaNit}
                    </span>
                  )}
                </div>
                <span className="font-bold text-white truncate block max-w-[180px]">
                  {selectedEmpresa === "TODAS" ? "📊 TODAS (Población Agregada)" : (info.razon_social || selectedEmpresa)}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {/* Dropdown de búsqueda de empresa */}
            {showCompanyDropdown && (
              <div className="absolute right-0 mt-2 w-84 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-300 z-50 p-3 space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por NIT o Razón Social..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
                  <button
                    onClick={() => handleSelectCompany("TODAS")}
                    className="w-full text-left p-2 hover:bg-indigo-50 font-bold text-indigo-700 flex items-center justify-between"
                  >
                    <span>📊 TODAS (Población Agregada / Sin Empresa)</span>
                    <span className="text-[10px] bg-indigo-100 px-1.5 py-0.5 rounded text-indigo-600">General</span>
                  </button>
                  {filteredCompanies.map((c: any, i: number) => {
                    const compName = typeof c === 'string' ? c : (c.razon_social || c.name);
                    const compNit = typeof c === 'object' ? c.nit : '';
                    return (
                      <button
                        key={i}
                        onClick={() => handleSelectCompany(c)}
                        className="w-full text-left p-2 hover:bg-slate-100 transition-colors flex flex-col"
                      >
                        <span className="font-semibold text-slate-800 truncate">{compName}</span>
                        {compNit && <span className="text-[10px] text-slate-500 font-mono">NIT: {compNit}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Base Benchmark Completa - Cifras de empresas comparadas */}
          <div className="hidden lg:flex items-center gap-2 bg-[#112240] border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[9px] text-slate-400 block font-semibold uppercase">Base de Comparación</span>
              <span className="font-bold text-emerald-400 font-mono text-xs">
                {(info.total_empresas_comparadas || 35835).toLocaleString('es-CO')} empresas
              </span>
            </div>
          </div>

          {/* Botón Ocultar/Mostrar Filtros */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 ${
              sidebarOpen ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
            title={sidebarOpen ? "Ocultar panel de filtros para maximizar espacio de tarjetas" : "Mostrar panel de filtros"}
          >
            <Filter className="w-4 h-4" />
            <span>{sidebarOpen ? 'Ocultar Filtros' : 'Mostrar Filtros'}</span>
          </button>

          {/* Botón Exportar */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
            title="Exportar datos completos a archivo CSV"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>

          {/* PERFIL DE USUARIO Y GESTIÓN DE ROLES (RBAC) */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
            {user ? (
              <div className="flex items-center gap-2">
                {/* Badge de Rol */}
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-white truncate max-w-[140px]">
                      {profile?.nombre_completo || user.email?.split('@')[0]}
                    </span>
                    {profile?.rol === 'super_admin' && (
                      <span className="px-1.5 py-0.2 text-[9px] font-black uppercase bg-purple-500/30 text-purple-300 border border-purple-400/40 rounded">
                        👑 Super Admin
                      </span>
                    )}
                    {profile?.rol === 'analista' && (
                      <span className="px-1.5 py-0.2 text-[9px] font-black uppercase bg-blue-500/30 text-blue-300 border border-blue-400/40 rounded">
                        💼 Analista
                      </span>
                    )}
                    {profile?.rol === 'cliente' && (
                      <span className="px-1.5 py-0.2 text-[9px] font-black uppercase bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 rounded">
                        🏢 Cliente
                      </span>
                    )}
                    {profile?.rol === 'demo' && (
                      <span className="px-1.5 py-0.2 text-[9px] font-black uppercase bg-amber-500/30 text-amber-300 border border-amber-400/40 rounded">
                        👀 Demo
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{user.email}</span>
                </div>

                {/* Botón Gestión de Usuarios (Exclusivo Super Admin) */}
                {isSuperAdmin && (
                  <button
                    onClick={() => setShowUserModal(true)}
                    className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 border border-purple-400/30"
                    title="Panel de Super Administrador para gestionar roles y permisos"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Usuarios</span>
                  </button>
                )}

                {/* Botón Cerrar Sesión */}
                <button
                  onClick={signOut}
                  className="p-2 text-slate-400 hover:text-rose-400 bg-[#112240] hover:bg-rose-950/40 border border-slate-700 rounded-lg transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <Lock className="w-4 h-4" />
                <span>Iniciar Sesión</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. LAYOUT EN GRID: FILTROS LATERALES + CONTENIDO COMPLETO    */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ------------------------------------------------------------ */}
        {/* PANEL LATERAL DE FILTROS (3 COLUMNAS - COLAPSABLE)          */}
        {/* ------------------------------------------------------------ */}
        {sidebarOpen && (
          <div className="lg:col-span-3 space-y-4 transition-all duration-300">
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm space-y-4 sticky top-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm uppercase tracking-wider">
                <Filter className="w-4 h-4 text-indigo-600" />
                <span>FILTROS</span>
              </div>
              <button 
                onClick={fetchDashboardData}
                className="text-slate-400 hover:text-indigo-600 transition-colors p-1 rounded"
                title="Sincronizar y recalcular datos"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            </div>

            {/* 1. TARJETA: INFORMACIÓN DE LA EMPRESA (EN EL TOPE, ANTES DEL PERIODO) */}
            <div className="bg-slate-900 text-white p-3.5 rounded-xl text-xs space-y-2 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  INFORMACIÓN DE LA EMPRESA
                </span>
                <span className="text-[9px] bg-indigo-900/60 text-indigo-300 px-1.5 py-0.2 rounded font-mono font-bold">
                  {selectedEmpresa === "TODAS" ? "AGREGADO" : "INDIVIDUAL"}
                </span>
              </div>

              <div className="font-extrabold text-slate-100 text-sm leading-snug">
                {info.razon_social || selectedEmpresa}
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                NIT: <span className="text-white font-bold">{info.nit || selectedEmpresaNit || 'N/A'}</span>
              </div>

              <div className="text-[11px] text-slate-400">
                Sector: <span className="text-slate-200">{info.sector || info.ciiu || 'Comercio / Industria'}</span>
              </div>

              <div className="text-[11px] text-slate-400">
                Ubicación: <span className="text-slate-200">{
                  info.ciudad && info.departamento && info.ciudad !== info.departamento 
                    ? `${info.ciudad}, ${info.departamento}` 
                    : (info.ciudad || info.departamento || 'Colombia')
                }</span>
              </div>

              <div className="text-[11px] text-slate-400">
                Tamaño: <span className="text-indigo-300 font-bold">{info.tamano || 'Población General'}</span>
              </div>

              {/* MÉTRICAS DE COMPARACIÓN POBLACIONAL */}
              <div className="pt-2 mt-1 border-t border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Empresas en Comparación:</span>
                  <span className="text-emerald-400 font-extrabold font-mono text-xs bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800">
                    {(info.total_empresas_comparadas || 35835).toLocaleString('es-CO')} empresas
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Base Total del Sector:</span>
                  <span className="text-indigo-300 font-semibold font-mono">
                    {(info.total_empresas_base || 35835).toLocaleString('es-CO')} empresas
                  </span>
                </div>
                <div className="flex items-center justify-between text-[9px] text-slate-500">
                  <span>Registros Procesados:</span>
                  <span className="font-mono">{(info.total_registros_comparados || 199478).toLocaleString('es-CO')} balances</span>
                </div>
              </div>

              <div className="pt-1.5 text-[9px] text-slate-500 border-t border-slate-800/80 flex items-center justify-between">
                <span>Última actualización:</span>
                <span>{new Date().toLocaleDateString('es-CO')}</span>
              </div>
            </div>

            {/* 2. FILTRO DE EMPRESA / NIT DIRECTO EN EL PANEL LATERAL */}
            <div className="space-y-1.5 pt-1" ref={dropdownRef}>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-tight block">
                  Buscar Empresa ({filtersList?.total_empresas || companiesList.length} empresas)
                </label>
                {selectedEmpresa !== "TODAS" && (
                  <button
                    onClick={() => handleSelectCompany("TODAS")}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                  >
                    Dejar en Blanco / Todas
                  </button>
                )}
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filtrar por NIT o Nombre..."
                  value={companySearch}
                  onChange={(e) => {
                    setCompanySearch(e.target.value);
                    setShowCompanyDropdown(true);
                  }}
                  onFocus={() => setShowCompanyDropdown(true)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <select
                value={selectedEmpresaNit || (selectedEmpresa === "TODAS" ? "TODAS" : selectedEmpresa)}
                onChange={(e) => handleCompanySelect(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg p-2 font-medium focus:ring-2 focus:ring-indigo-500 truncate mt-1"
              >
                <option value="TODAS">📊 TODAS (Población Agregada / Sin Empresa)</option>
                {companiesList?.map((emp: any) => (
                  <option key={emp.nit} value={emp.nit}>
                    {emp.razon_social} (NIT: {emp.nit})
                  </option>
                ))}
              </select>
              
              {/* Lista desplegable flotante de resultados filtrados de búsqueda */}
              {showCompanyDropdown && companySearch.trim().length > 1 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-xl max-h-56 overflow-y-auto z-50 divide-y divide-slate-100">
                  <div
                    onClick={() => handleCompanySelect("TODAS")}
                    className="p-2 hover:bg-indigo-50 cursor-pointer text-xs font-bold text-indigo-700 flex items-center justify-between"
                  >
                    <span>📊 TODAS (Población Agregada)</span>
                    <span className="text-[10px] bg-indigo-100 px-1.5 py-0.5 rounded text-indigo-600">General</span>
                  </div>
                  {filteredCompanies.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400 text-center">No se encontraron empresas</div>
                  ) : (
                    filteredCompanies.map((emp: any) => (
                      <div
                        key={emp.nit}
                        onClick={() => handleCompanySelect(emp.razon_social, emp.nit)}
                        className="p-2 hover:bg-indigo-50 cursor-pointer text-xs transition-colors"
                      >
                        <div className="font-bold text-slate-800 truncate">{emp.razon_social}</div>
                        <div className="text-[10px] text-slate-500 font-mono">NIT: {emp.nit}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* 3. FILTRO: PERIODO DE ANÁLISIS */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-tight block">
                Periodo de Análisis (Máx 10 años)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[9px] text-slate-500 font-semibold block mb-0.5">Desde</span>
                  <select
                    value={anoInicio}
                    onChange={handleAnoInicioChange}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg p-1.5 font-semibold focus:ring-2 focus:ring-indigo-500"
                  >
                    {availableYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-semibold block mb-0.5">Hasta</span>
                  <select
                    value={anoFin}
                    onChange={handleAnoFinChange}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg p-1.5 font-semibold focus:ring-2 focus:ring-indigo-500"
                  >
                    {availableYears.filter(y => y >= anoInicio).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="text-[10px] text-indigo-600 font-bold bg-indigo-50 p-1.5 rounded text-center">
                Periodo seleccionado: {anoInicio} – {anoFin} | {anoFin - anoInicio + 1} años
              </div>
            </div>

            {/* 4. FILTRO: SECTOR ECONÓMICO / CIIU (LISTA COMPLETA) */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-tight block">
                Sector Económico / CIIU ({filtersList?.sectores?.length || DEFAULT_SECTORES.length} sectores)
              </label>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg p-2 font-medium focus:ring-2 focus:ring-indigo-500 truncate"
              >
                <option value="TODOS">Todos los Sectores ({filtersList?.sectores?.length || DEFAULT_SECTORES.length})</option>
                {(filtersList?.sectores && filtersList.sectores.length > 0 ? filtersList.sectores : DEFAULT_SECTORES).map((sec: string, idx: number) => (
                  <option key={idx} value={sec} title={sec}>
                    {sec.length > 38 ? sec.substring(0, 38) + '...' : sec}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. FILTRO: DEPARTAMENTO */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-tight block">
                Departamento ({filtersList?.departamentos?.length || DEFAULT_DEPARTAMENTOS.length} departamentos)
              </label>
              <select
                value={selectedDepto}
                onChange={(e) => {
                  setSelectedDepto(e.target.value);
                  setSelectedCiudad("TODOS");
                }}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg p-2 font-medium focus:ring-2 focus:ring-indigo-500 truncate"
              >
                <option value="TODOS">Todos los Departamentos</option>
                {(filtersList?.departamentos && filtersList.departamentos.length > 0 ? filtersList.departamentos : DEFAULT_DEPARTAMENTOS).map((d: string, idx: number) => (
                  <option key={idx} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* 5.1 FILTRO: CIUDAD / MUNICIPIO */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-tight block">
                Ciudad / Municipio ({availableCiudades.length} ciudades{selectedDepto !== "TODOS" ? ` en ${selectedDepto}` : ""})
              </label>
              <select
                value={selectedCiudad}
                onChange={(e) => setSelectedCiudad(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg p-2 font-medium focus:ring-2 focus:ring-indigo-500 truncate"
              >
                <option value="TODOS">Todas las Ciudades</option>
                {availableCiudades.map((c: string, idx: number) => (
                  <option key={idx} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* 6. FILTRO: TAMAÑO DE EMPRESA */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-tight block">
                Tamaño de Empresa
              </label>
              <select
                value={selectedTamano}
                onChange={(e) => setSelectedTamano(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg p-2 font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="TODOS">Todos los Tamaños</option>
                <option value="MICRO">Microempresa</option>
                <option value="PEQUEÑA">Pequeña</option>
                <option value="MEDIANA">Mediana</option>
                <option value="GRANDE">Grande</option>
              </select>
            </div>

            {/* 7. FILTRO: MONEDA */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-tight block">
                Moneda
              </label>
              <select
                value={moneda}
                onChange={(e) => setMoneda(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg p-2 font-medium"
              >
                <option value="COP">COP - Peso Colombiano</option>
                <option value="USD">USD - Dólar Estadounidense</option>
              </select>
            </div>

            {/* 8. CHECKBOXES DE ESTADOS FINANCIEROS */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-tight block">
                Estados Financieros
              </label>
              <div className="space-y-1.5 text-xs text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={chkESF}
                    onChange={(e) => setChkESF(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                  />
                  <span>Estado de Situación Financiera</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={chkERI}
                    onChange={(e) => setChkERI(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                  />
                  <span>Estado de Resultados Integral</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={chkEFE}
                    onChange={(e) => setChkEFE(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                  />
                  <span>Estado de Flujos de Efectivo</span>
                </label>
              </div>
            </div>

            {/* 9. BOTONES DE APLICAR Y LIMPIAR */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <button
                onClick={fetchDashboardData}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg text-xs transition-all shadow-md flex items-center justify-center gap-2 active:scale-98"
              >
                <span>APLICAR FILTROS</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
              <button
                onClick={handleResetFilters}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg text-xs transition-colors"
              >
                LIMPIAR FILTROS
              </button>
            </div>

          </div>
        </div>
      )}

        {/* ------------------------------------------------------------ */}
        {/* CONTENIDO PRINCIPAL (9 o 12 COLUMNAS DINÁMICO)              */}
        {/* ------------------------------------------------------------ */}
        <div className={`${sidebarOpen ? 'lg:col-span-9' : 'lg:col-span-12'} space-y-6 transition-all duration-300 min-w-0`}>

          {/* ============================================================ */}
          {/* 3. FILA SUPERIOR DE TARJETAS KPI (6 TARJETAS EJECUTIVAS)    */}
          {/* ============================================================ */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">

            {/* KPI 1: Activos Totales */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-3.5 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition-all min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate">Activos {info.ano_actual || 2025}</span>
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0"><DollarSign className="w-4 h-4" /></div>
              </div>
              <div className="my-1.5">
                <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight font-mono truncate">
                  {fmtMoney(kpis.activos_totales?.actual)}
                </div>
                <div className="flex flex-wrap items-center gap-1 text-[11px]">
                  <span className={`font-bold whitespace-nowrap ${kpis.activos_totales?.var_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {kpis.activos_totales?.var_pct >= 0 ? '↑' : '↓'} {Math.abs(kpis.activos_totales?.var_pct || 0).toFixed(2)}%
                  </span>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">vs {info.ano_anterior || 2024}</span>
                </div>
              </div>
            </div>

            {/* KPI 2: Utilidad Neta */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-3.5 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition-all min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate">Utilidad Neta {info.ano_actual || 2025}</span>
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0"><CheckCircle2 className="w-4 h-4" /></div>
              </div>
              <div className="my-1.5">
                <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight font-mono truncate">
                  {fmtMoney(kpis.utilidad_neta?.actual)}
                </div>
                <div className="flex flex-wrap items-center gap-1 text-[11px]">
                  <span className={`font-bold whitespace-nowrap ${kpis.utilidad_neta?.var_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {kpis.utilidad_neta?.var_pct >= 0 ? '↑' : '↓'} {Math.abs(kpis.utilidad_neta?.var_pct || 0).toFixed(2)}%
                  </span>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">vs {info.ano_anterior || 2024}</span>
                </div>
              </div>
            </div>

            {/* KPI 3: Ventas Netas */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-3.5 shadow-sm flex flex-col justify-between hover:border-purple-300 transition-all min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate">Ventas {info.ano_actual || 2025}</span>
                <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg shrink-0"><PieChart className="w-4 h-4" /></div>
              </div>
              <div className="my-1.5">
                <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight font-mono truncate">
                  {fmtMoney(kpis.ventas?.actual)}
                </div>
                <div className="flex flex-wrap items-center gap-1 text-[11px]">
                  <span className={`font-bold whitespace-nowrap ${kpis.ventas?.var_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {kpis.ventas?.var_pct >= 0 ? '↑' : '↓'} {Math.abs(kpis.ventas?.var_pct || 0).toFixed(2)}%
                  </span>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">vs {info.ano_anterior || 2024}</span>
                </div>
              </div>
            </div>

            {/* KPI 4: EBITDA */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-3.5 shadow-sm flex flex-col justify-between hover:border-amber-300 transition-all min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate">EBITDA {info.ano_actual || 2025}</span>
                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg shrink-0"><Compass className="w-4 h-4" /></div>
              </div>
              <div className="my-1.5">
                <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight font-mono truncate">
                  {fmtMoney(kpis.ebitda?.actual)}
                </div>
                <div className="flex flex-wrap items-center gap-1 text-[11px]">
                  <span className={`font-bold whitespace-nowrap ${kpis.ebitda?.var_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {kpis.ebitda?.var_pct >= 0 ? '↑' : '↓'} {Math.abs(kpis.ebitda?.var_pct || 0).toFixed(2)}%
                  </span>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">vs {info.ano_anterior || 2024}</span>
                </div>
              </div>
            </div>

            {/* KPI 5: ROE */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-3.5 shadow-sm flex flex-col justify-between hover:border-cyan-300 transition-all min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate">ROE {info.ano_actual || 2025}</span>
                <div className="p-1.5 bg-cyan-50 text-cyan-600 rounded-lg shrink-0"><Award className="w-4 h-4" /></div>
              </div>
              <div className="my-1.5">
                <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight font-mono truncate">
                  {kpis.roe?.actual?.toFixed(2) || '0.00'}%
                </div>
                <div className="flex flex-wrap items-center gap-1 text-[11px]">
                  <span className={`font-bold whitespace-nowrap ${kpis.roe?.var_pp >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {kpis.roe?.var_pp >= 0 ? '↑' : '↓'} {Math.abs(kpis.roe?.var_pp || 0).toFixed(2)} p.p.
                  </span>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">vs {info.ano_anterior || 2024}</span>
                </div>
              </div>
            </div>

            {/* KPI 6: Margen Neto */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-3.5 shadow-sm flex flex-col justify-between hover:border-rose-300 transition-all min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate">Margen Neto {info.ano_actual || 2025}</span>
                <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg shrink-0"><Percent className="w-4 h-4" /></div>
              </div>
              <div className="my-1.5">
                <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight font-mono truncate">
                  {kpis.margen_neto?.actual?.toFixed(2) || '0.00'}%
                </div>
                <div className="flex flex-wrap items-center gap-1 text-[11px]">
                  <span className={`font-bold whitespace-nowrap ${kpis.margen_neto?.var_pp >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {kpis.margen_neto?.var_pp >= 0 ? '↑' : '↓'} {Math.abs(kpis.margen_neto?.var_pp || 0).toFixed(2)} p.p.
                  </span>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">vs {info.ano_anterior || 2023}</span>
                </div>
              </div>
            </div>

          </div>

          {/* ============================================================ */}
          {/* 4. TRES TABLAS PARALELAS: HORIZONTAL, VERTICAL Y ESTADO RESULT*/}
          {/* ============================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">

            {/* TABLA 1: ANÁLISIS HORIZONTAL - ESF */}
            {chkESF && (
              <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-900 text-xs tracking-tight flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                      <span>ANÁLISIS HORIZONTAL - ESF (Miles COP)</span>
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
                          <th className="pb-2">Cuenta</th>
                          <th className="pb-2 text-right">{info.ano_actual || 2025}</th>
                          <th className="pb-2 text-right">{info.ano_anterior || 2024}</th>
                          <th className="pb-2 text-right">Var %</th>
                          <th className="pb-2 text-right">Tendencia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {ah.esf?.map((row: any, i: number) => (
                          <tr key={i} className={`hover:bg-slate-50 ${row.cuenta.includes('TOTAL') || row.cuenta === 'PATRIMONIO' ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                            <td className="py-2 pr-1">{row.cuenta}</td>
                            <td className="py-2 text-right font-mono">{fmtThousands(row.actual)}</td>
                            <td className="py-2 text-right font-mono text-slate-500">{fmtThousands(row.anterior)}</td>
                            <td className={`py-2 text-right font-mono font-bold ${row.var_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {row.var_pct >= 0 ? '+' : ''}{row.var_pct?.toFixed(2)}%
                            </td>
                            <td className="py-2 text-right">
                              <MiniSparkline data={row.sparkline} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TABLA 2: ANÁLISIS VERTICAL - ESF */}
            {chkESF && (
              <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-900 text-xs tracking-tight flex items-center gap-1.5">
                      <PieChart className="w-3.5 h-3.5 text-indigo-600" />
                      <span>ANÁLISIS VERTICAL - ESF (%)</span>
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
                          <th className="pb-2">Cuenta</th>
                          <th className="pb-2 text-right">{info.ano_actual || 2025} %</th>
                          <th className="pb-2 text-right">{info.ano_anterior || 2024} %</th>
                          <th className="pb-2 text-right">Var (p.p.)</th>
                          <th className="pb-2 text-right">Estructura</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {av.esf?.map((row: any, i: number) => (
                          <tr key={i} className={`hover:bg-slate-50 ${row.cuenta.includes('TOTAL') || row.cuenta === 'PATRIMONIO' ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                            <td className="py-2 pr-1">{row.cuenta}</td>
                            <td className="py-2 text-right font-mono">{row.actual_pct?.toFixed(2)}%</td>
                            <td className="py-2 text-right font-mono text-slate-500">{row.anterior_pct?.toFixed(2)}%</td>
                            <td className={`py-2 text-right font-mono font-bold ${row.var_pp >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {row.var_pp >= 0 ? '+' : ''}{row.var_pp?.toFixed(2)}
                            </td>
                            <td className="py-2 text-right">
                              <MiniProgressBar percentage={row.actual_pct} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TABLA 3: ESTADO DE RESULTADOS - HORIZONTAL */}
            {chkERI && (
              <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-900 text-xs tracking-tight flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>ESTADO DE RESULTADOS (Miles COP)</span>
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
                          <th className="pb-2">Cuenta</th>
                          <th className="pb-2 text-right">{info.ano_actual || 2025}</th>
                          <th className="pb-2 text-right">{info.ano_anterior || 2024}</th>
                          <th className="pb-2 text-right">Var $</th>
                          <th className="pb-2 text-right">Var %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {ah.eri?.map((row: any, i: number) => (
                          <tr key={i} className={`hover:bg-slate-50 ${row.cuenta.includes('Utilidad') || row.cuenta === 'Ventas Netas' ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                            <td className="py-2 pr-1">{row.cuenta}</td>
                            <td className="py-2 text-right font-mono">{fmtThousands(row.actual)}</td>
                            <td className="py-2 text-right font-mono text-slate-500">{fmtThousands(row.anterior)}</td>
                            <td className="py-2 text-right font-mono text-slate-600">{fmtThousands(row.var_abs)}</td>
                            <td className={`py-2 text-right font-mono font-bold ${row.var_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {row.var_pct >= 0 ? '+' : ''}{row.var_pct?.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* ============================================================ */}
          {/* 5. INDICADORES FINANCIEROS: TACÓMETROS / GAUGES SEMICIRCULARES*/}
          {/* ============================================================ */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h2 className="font-black text-slate-900 text-sm md:text-base tracking-tight flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  <span>INDICADORES FINANCIEROS — Comparación vs {compararCon}</span>
                </h2>
                <p className="text-[11px] md:text-xs text-slate-500 mt-0.5">
                  Tacómetros semicirculares con percentiles calculados dinámicamente sobre la población real de la base de datos
                </p>
              </div>

              {/* PESTAÑAS DE CATEGORÍA PARA FILTRADO RÁPIDO */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {[
                  { id: "TODOS", label: "Todos", count: 17 },
                  { id: "liquidez", label: "💧 Liquidez", count: ig.liquidez?.length || 2 },
                  { id: "endeudamiento", label: "⚖️ Endeudamiento", count: ig.endeudamiento?.length || 3 },
                  { id: "actividad", label: "⚡ Actividad", count: ig.actividad?.length || 3 },
                  { id: "rentabilidad", label: "📈 Rentabilidad", count: ig.rentabilidad?.length || 3 },
                  { id: "rentabilidad_operacional", label: "🎯 Márgenes", count: ig.rentabilidad_operacional?.length || 3 },
                  { id: "coberturas", label: "🛡️ Coberturas", count: ig.coberturas?.length || 3 },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveGaugeCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                      activeGaugeCategory === cat.id
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeGaugeCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* VISTA GENERAL: TODAS LAS CATEGORÍAS EN GRID DE 2 COLUMNAS (AMPLIAS Y CLARAS) */}
            {activeGaugeCategory === "TODOS" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">

                {/* GRUPO 1: LIQUIDEZ */}
                <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-xs font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      LIQUIDEZ
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      {ig.liquidez?.length || 2} Ratios
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ig.liquidez?.map((g: any, i: number) => (
                      <SemiCircularGauge key={i} {...g} />
                    ))}
                  </div>
                </div>

                {/* GRUPO 2: ENDEUDAMIENTO */}
                <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-xs font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      ENDEUDAMIENTO
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      {ig.endeudamiento?.length || 3} Ratios
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {ig.endeudamiento?.map((g: any, i: number) => (
                      <SemiCircularGauge key={i} {...g} />
                    ))}
                  </div>
                </div>

                {/* GRUPO 3: ACTIVIDAD Y EFICIENCIA */}
                <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-xs font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      ACTIVIDAD Y EFICIENCIA
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      {ig.actividad?.length || 3} Ratios
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {ig.actividad?.map((g: any, i: number) => (
                      <SemiCircularGauge key={i} {...g} />
                    ))}
                  </div>
                </div>

                {/* GRUPO 4: RENTABILIDAD */}
                <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-xs font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      RENTABILIDAD
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      {ig.rentabilidad?.length || 3} Ratios
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {ig.rentabilidad?.map((g: any, i: number) => (
                      <SemiCircularGauge key={i} {...g} />
                    ))}
                  </div>
                </div>

                {/* GRUPO 5: RENTABILIDAD OPERACIONAL / MÁRGENES */}
                <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-xs font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      RENTABILIDAD OPERACIONAL
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      {ig.rentabilidad_operacional?.length || 3} Ratios
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {ig.rentabilidad_operacional?.map((g: any, i: number) => (
                      <SemiCircularGauge key={i} {...g} />
                    ))}
                  </div>
                </div>

                {/* GRUPO 6: COBERTURAS Y SOLVENCIA */}
                <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-xs font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      COBERTURAS Y SOLVENCIA
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      {ig.coberturas?.length || 3} Ratios
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {ig.coberturas?.map((g: any, i: number) => (
                      <SemiCircularGauge key={i} {...g} />
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* VISTA ESPECÍFICA DE CATEGORÍA SELECCIONADA (TARJETAS GRANDES Y ESPACIOSAS) */}
            {activeGaugeCategory !== "TODOS" && (
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div className="text-sm font-black text-indigo-800 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    {activeGaugeCategory === "liquidez" ? "Indicadores de Liquidez y Solvencia Corriente" :
                     activeGaugeCategory === "endeudamiento" ? "Indicadores de Estructura de Capital y Endeudamiento" :
                     activeGaugeCategory === "actividad" ? "Indicadores de Rotación y Eficiencia Operativa" :
                     activeGaugeCategory === "rentabilidad" ? "Indicadores de Rentabilidad sobre Activos y Patrimonio" :
                     activeGaugeCategory === "rentabilidad_operacional" ? "Indicadores de Márgenes Operacionales y de Utilidad" :
                     "Indicadores de Cobertura y Servicio de la Deuda"}
                  </div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                    {ig[activeGaugeCategory]?.length || 0} Tacómetros Semicirculares
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {ig[activeGaugeCategory]?.map((g: any, i: number) => (
                    <SemiCircularGauge key={i} {...g} />
                  ))}
                </div>
              </div>
            )}

            <div className="text-[10px] text-slate-500 italic text-right pt-2">
              * Percentil: Posición relativa de la empresa respecto a la base de datos del sector. Percentil 50 = Mediana del sector.
            </div>
          </div>

          {/* ============================================================ */}
          {/* 6. CUATRO GRÁFICOS INFERIORES EN GRID DE 4 TARJETAS        */}
          {/* ============================================================ */}
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4">

            {/* GRÁFICO 1: EVOLUCIÓN PRINCIPAL (10 AÑOS) */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-bold text-slate-900 text-xs truncate">
                    EVOLUCIÓN PRINCIPAL ({anoFin - anoInicio + 1} años)
                  </h4>
                </div>
                <p className="text-[10px] text-slate-500 mb-2">Histórico anual con cifras en COP</p>

                {/* Selector rápido de serie */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-2 scrollbar-none">
                  {ep.series?.map((s: any, sIdx: number) => (
                    <button
                      key={sIdx}
                      onClick={() => setSelectedEvolSeries(sIdx)}
                      className={`text-[9px] font-bold px-2 py-0.5 rounded transition-all whitespace-nowrap ${
                        selectedEvolSeries === sIdx
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {s.name?.split(' ')[0]}
                    </button>
                  ))}
                </div>

                {/* Contenedor de barras */}
                {(() => {
                  const currentSeries = ep.series?.[selectedEvolSeries] || ep.series?.[0] || { name: 'Activos', data: [] };
                  const seriesData = currentSeries.data || [];
                  const maxVal = Math.max(...(seriesData.map((v: number) => Math.abs(v)) || [1])) || 1;

                  return (
                    <div className="h-44 w-full flex items-end justify-between gap-1 pt-2 pb-6 border-b border-slate-200 relative">
                      {ep.anos?.map((y: number, idx: number) => {
                        const val = seriesData[idx] || 0;
                        const heightPct = Math.max(8, Math.min(100, (Math.abs(val) / maxVal) * 100));

                        return (
                          <div key={idx} className="flex-1 h-full flex flex-col justify-end items-center group relative min-w-0">
                            {/* Cifra numérica arriba de la barra */}
                            <span className="text-[7.5px] sm:text-[8px] font-mono font-bold text-slate-700 truncate mb-1 whitespace-nowrap group-hover:text-indigo-600 group-hover:scale-105 transition-all">
                              {fmtShort(val)}
                            </span>

                            {/* Pista de la barra con altura fija de 96px (h-24) */}
                            <div className="w-full h-24 flex items-end justify-center">
                              <div
                                className={`w-full max-w-[16px] rounded-t shadow-sm transition-all duration-300 ${
                                  val >= 0
                                    ? 'bg-gradient-to-t from-indigo-700 to-indigo-500 hover:to-indigo-400'
                                    : 'bg-gradient-to-t from-rose-700 to-rose-500 hover:to-rose-400'
                                }`}
                                style={{ height: `${heightPct}%` }}
                              />
                            </div>

                            {/* Año abajo rotado */}
                            <span className="text-[8px] sm:text-[8.5px] text-slate-500 font-mono rotate-[-45deg] origin-top-left mt-2 whitespace-nowrap font-medium">
                              {y}
                            </span>

                            {/* Tooltip con cifra exacta al pasar el ratón */}
                            <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[9px] py-1 px-2 rounded shadow-xl z-30 pointer-events-none whitespace-nowrap">
                              <span className="font-bold text-indigo-300">{y} • {currentSeries.name}</span>
                              <span className="font-mono text-white font-bold">{fmtMoney(val)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              <div className="flex items-center justify-between text-[9px] font-bold text-slate-600 mt-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-indigo-600"></span>
                  {ep.series?.[selectedEvolSeries]?.name || 'Activos Totales'}
                </span>
                <span className="text-[10px] text-indigo-700 font-mono font-bold">
                  {fmtMoney(ep.series?.[selectedEvolSeries]?.data?.slice(-1)[0])}
                </span>
              </div>
            </div>

            {/* GRÁFICO 2: FLUJO DE CAJA (MÉTODO INDIRECTO) */}
            {chkEFE && (
              <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs mb-1">
                    FLUJO DE CAJA (Método Indirecto)
                  </h4>
                  <p className="text-[10px] text-slate-500 mb-2">Flujo Operacional vs Flujo Neto (Miles COP)</p>

                  {(() => {
                    const ops = fc.flujo_operacional || [];
                    const nets = fc.flujo_neto || [];
                    const maxF = Math.max(
                      ...(ops.map((v: number) => Math.abs(v)) || []),
                      ...(nets.map((v: number) => Math.abs(v)) || []),
                      1
                    );

                    return (
                      <div className="h-44 w-full flex items-end justify-between gap-1 pt-2 pb-6 border-b border-slate-200 relative">
                        {fc.anos?.map((y: number, idx: number) => {
                          const fOp = ops[idx] || 0;
                          const fNet = nets[idx] || 0;
                          const hOp = Math.max(8, Math.min(100, (Math.abs(fOp) / maxF) * 100));
                          const hNet = Math.max(8, Math.min(100, (Math.abs(fNet) / maxF) * 100));

                          return (
                            <div key={idx} className="flex-1 h-full flex flex-col justify-end items-center group relative min-w-0">
                              {/* Cifra de Flujo Operacional */}
                              <span className="text-[7px] sm:text-[7.5px] font-mono font-bold text-slate-700 truncate mb-1 whitespace-nowrap group-hover:text-blue-600">
                                {fmtShort(fOp)}
                              </span>

                              {/* Pista de barras paralelas de 96px (h-24) */}
                              <div className="w-full h-24 flex items-end justify-center gap-0.5 sm:gap-1">
                                {/* Barra Operacional */}
                                <div
                                  className={`w-1/2 max-w-[8px] rounded-t shadow-sm transition-all duration-300 ${
                                    fOp >= 0
                                      ? 'bg-gradient-to-t from-blue-700 to-blue-500 hover:to-blue-400'
                                      : 'bg-gradient-to-t from-rose-700 to-rose-500 hover:to-rose-400'
                                  }`}
                                  style={{ height: `${hOp}%` }}
                                  title={`Operacional: ${fmtMoney(fOp)}`}
                                />
                                {/* Barra Neta */}
                                <div
                                  className={`w-1/2 max-w-[8px] rounded-t shadow-sm transition-all duration-300 ${
                                    fNet >= 0
                                      ? 'bg-gradient-to-t from-emerald-700 to-emerald-500 hover:to-emerald-400'
                                      : 'bg-gradient-to-t from-amber-700 to-amber-500 hover:to-amber-400'
                                  }`}
                                  style={{ height: `${hNet}%` }}
                                  title={`Neto: ${fmtMoney(fNet)}`}
                                />
                              </div>

                              {/* Año abajo rotado */}
                              <span className="text-[8px] sm:text-[8.5px] text-slate-500 font-mono rotate-[-45deg] origin-top-left mt-2 whitespace-nowrap font-medium">
                                {y}
                              </span>

                              {/* Tooltip completo */}
                              <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[9px] py-1 px-2 rounded shadow-xl z-30 pointer-events-none whitespace-nowrap">
                                <span className="font-bold text-slate-300">Año {y}</span>
                                <span className="text-blue-300 font-mono">Op: {fmtMoney(fOp)}</span>
                                <span className="text-emerald-300 font-mono">Neto: {fmtMoney(fNet)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                <div className="flex flex-wrap gap-2 text-[9px] font-bold text-slate-600 mt-2">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-600"></span> Operacional</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-600"></span> Flujo Neto</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-500"></span> Negativo</span>
                </div>
              </div>
            )}

            {/* GRÁFICO 3: COMPARATIVO CON EL SECTOR */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-1">
                  COMPARATIVO CON EL SECTOR ({info.ano_actual || 2025})
                </h4>
                <p className="text-[10px] text-slate-500 mb-3">Empresa vs Promedio del Sector</p>
                <div className="h-44 w-full flex items-end justify-around gap-2 pt-2 pb-5 border-b border-slate-200">
                  {cs.map((item: any, idx: number) => {
                    const emp = item.empresa || 0;
                    const sec = item.sector || 0;
                    const maxV = Math.max(emp, sec) || 1;
                    return (
                      <div key={idx} className="flex flex-col items-center gap-1 group relative flex-1 min-w-0">
                        {/* Cifras comparativas */}
                        <div className="flex items-center gap-1 text-[7px] sm:text-[7.5px] font-mono font-bold mb-0.5">
                          <span className="text-indigo-700">{emp}</span>
                          <span className="text-slate-400">/</span>
                          <span className="text-slate-600">{sec}</span>
                        </div>

                        <div className="flex items-end justify-center gap-1 h-24 w-full">
                          <div
                            className="w-3 sm:w-3.5 bg-gradient-to-t from-indigo-700 to-indigo-500 rounded-t hover:to-indigo-400 shadow-sm transition-all"
                            style={{ height: `${Math.max(10, (emp / maxV) * 95)}%` }}
                            title={`Empresa: ${emp}`}
                          />
                          <div
                            className="w-3 sm:w-3.5 bg-gradient-to-t from-slate-400 to-slate-300 rounded-t hover:to-slate-200 shadow-sm transition-all"
                            style={{ height: `${Math.max(10, (sec / maxV) * 95)}%` }}
                            title={`Sector: ${sec}`}
                          />
                        </div>
                        <span className="text-[8px] sm:text-[8.5px] text-slate-600 font-bold max-w-[55px] truncate text-center mt-1" title={item.indicador}>
                          {item.indicador.split(' ')[0]}
                        </span>
                        <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[9px] py-1 px-2 rounded shadow-xl z-30 pointer-events-none whitespace-nowrap">
                          <span className="font-bold text-indigo-300">{item.indicador}</span>
                          <span className="font-mono text-white">Emp: {emp} | Sec: {sec}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-3 text-[9px] font-bold text-slate-600 mt-2">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-indigo-700"></span> Empresa</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-slate-300"></span> Sector</span>
              </div>
            </div>

            {/* GRÁFICO 4: TENDENCIA INDICADORES CLAVE (HEATMAP HISTÓRICO) */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-1">
                  TENDENCIA INDICADORES CLAVE (Heatmap)
                </h4>
                <p className="text-[10px] text-slate-500 mb-2">Desempeño y evolución histórica</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[9px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold">
                        <th className="pb-1">Indicador</th>
                        {ep.anos?.slice(-6).map((y: number) => (
                          <th key={y} className="pb-1 text-center font-mono">{y}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {hm.slice(0, 5).map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-1 font-sans font-semibold text-slate-700 truncate max-w-[80px]" title={row.indicador}>
                            {row.indicador}
                          </td>
                          {ep.anos?.slice(-6).map((y: number) => {
                            const val = row.valores?.[y] || 0;
                            // Asignar color según HIGHER_IS_BETTER
                            let bgClass = "bg-emerald-100 text-emerald-800";
                            if (row.tipo === "LOWER_IS_BETTER") {
                              bgClass = val <= 50 ? "bg-emerald-100 text-emerald-800" : val <= 70 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800";
                            } else {
                              bgClass = val >= 12 ? "bg-emerald-100 text-emerald-800" : val >= 5 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800";
                            }
                            return (
                              <td key={y} className={`py-1 text-center font-bold rounded ${bgClass} m-0.5`}>
                                {val.toFixed(1)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex gap-2 text-[8px] font-bold text-slate-500 mt-2">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-300"></span> Favorable</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-300"></span> Moderado</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-300"></span> Alerta</span>
              </div>
            </div>

          </div>

          {/* ============================================================ */}
          {/* 7. ALERTAS FINANCIERAS E INTERPRETACIÓN AUTOMÁTICA          */}
          {/* ============================================================ */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

            {/* ALERTAS FINANCIERAS */}
            <div className="xl:col-span-1 bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>ALERTAS FINANCIERAS AUTOMÁTICAS</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {alertas.length === 0 ? (
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Todos los ratios principales operan dentro de parámetros de normalidad prudencial.</span>
                  </div>
                ) : (
                  alertas.map((al: any, idx: number) => {
                    const isCrit = al.tipo === "CRITICA";
                    const isFav = al.tipo === "FAVORABLE";
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border text-xs leading-snug space-y-0.5 ${
                          isCrit ? 'bg-rose-50 border-rose-200 text-rose-900' :
                          isFav ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
                          'bg-amber-50 border-amber-200 text-amber-900'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>{isCrit ? '🔴 ' : isFav ? '🟢 ' : '🟠 '}{al.titulo}</span>
                          <span className="font-mono text-[10px] font-extrabold">{al.valor}</span>
                        </div>
                        <p className="text-[11px] opacity-90">{al.descripcion}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* INTERPRETACIÓN EJECUTIVA INTELIGENTE */}
            <div className="xl:col-span-2 bg-[#0a192f] text-slate-200 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span>DIAGNÓSTICO FINANCIERO EJECUTIVO (IA & BIG DATA)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {data?.interpretacion_ejecutiva || (
                    `La compañía ${info.razon_social || selectedEmpresa} registra una evolución sólida con total de activos de ${fmtMoney(kpis.activos_totales?.actual)}. La rentabilidad patrimonial ROE (${kpis.roe?.actual?.toFixed(2)}%) y el margen neto (${kpis.margen_neto?.actual?.toFixed(2)}%) se encuentran alineados con las expectativas de la categoría ${info.sector || 'empresarial'}.`
                  )}
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
                <span>Normas Internacionales NIIF | Cifras en miles de COP</span>
                <span>Versión 1.0 — Finanzia Analytics</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* MODALES DE AUTENTICACIÓN Y GESTIÓN DE USUARIOS */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      <UserManagementModal 
        isOpen={showUserModal} 
        onClose={() => setShowUserModal(false)} 
      />

    </div>
  );
}
