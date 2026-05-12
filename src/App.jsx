import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  Settings, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info,
  Layers,
  Zap
} from 'lucide-react';

// --- Constantes de Ingeniería FTTH ---
const PON_STANDARDS = {
  GPON_B_PLUS: { name: 'GPON Clase B+', txMin: 1.5, txMax: 5, rxSens: -28, overload: -8 },
  GPON_C_PLUS: { name: 'GPON Clase C+', txMin: 3, txMax: 7, rxSens: -32, overload: -12 },
  XGSPON_N1: { name: 'XGS-PON N1', txMin: 2, txMax: 7, rxSens: -28, overload: -9 },
};

const SPLITTER_LOSS = {
  '1:2': 3.7,
  '1:4': 7.2,
  '1:8': 10.5,
  '1:16': 13.8,
  '1:32': 17.1,
  '1:64': 20.5,
  'none': 0
};

const FTTHCalculator = () => {
  // --- Estado de la aplicación ---
  const [config, setConfig] = useState({
    standard: 'GPON_B_PLUS',
    distance: 10, // km
    fiberAttenuation: 0.35, // dB/km (típico 1310nm)
    splitter1: '1:8',
    splitter2: '1:8',
    connectors: 4,
    splices: 6,
    connectorLoss: 0.25,
    spliceLoss: 0.05,
    safetyMargin: 2,
  });

  // --- Lógica de Cálculo (Memoized para performance) ---
  const results = useMemo(() => {
    const std = PON_STANDARDS[config.standard];
    
    const fiberLoss = config.distance * config.fiberAttenuation;
    const s1Loss = SPLITTER_LOSS[config.splitter1];
    const s2Loss = SPLITTER_LOSS[config.splitter2];
    const connLoss = config.connectors * config.connectorLoss;
    const spliceLoss = config.splices * config.spliceLoss;
    
    const totalLoss = fiberLoss + s1Loss + s2Loss + connLoss + spliceLoss + config.safetyMargin;
    const rxPower = std.txMin - totalLoss;
    
    const margin = rxPower - std.rxSens;
    let status = 'SUCCESS';
    if (margin < 0) status = 'FAIL';
    else if (margin < 3) status = 'WARNING';

    return {
      totalLoss: totalLoss.toFixed(2),
      rxPower: rxPower.toFixed(2),
      margin: margin.toFixed(2),
      status,
      details: { fiberLoss, s1Loss, s2Loss, connLoss, spliceLoss }
    };
  }, [config]);

  // --- Componentes de UI internos ---
  const InputField = ({ label, name, value, type = "number", step = "0.01", icon: Icon }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
        {Icon && <Icon size={12} />} {label}
      </label>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => setConfig({ ...config, [name]: type === "number" ? parseFloat(e.target.value) : e.target.value })}
        className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-200">
            <Activity className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">FTTH Link Budget Pro</h1>
            <p className="text-slate-500">Calculadora de Presupuesto Óptico de Precisión</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna de Configuración */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="flex items-center gap-2 font-bold mb-4 text-slate-700">
                <Settings size={18} /> Parámetros del Enlace
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Estándar PON</label>
                  <select 
                    value={config.standard}
                    onChange={(e) => setConfig({...config, standard: e.target.value})}
                    className="border border-gray-200 rounded-lg px-3 py-2 bg-white"
                  >
                    {Object.entries(PON_STANDARDS).map(([key, val]) => (
                      <option key={key} value={key}>{val.name}</option>
                    ))}
                  </select>
                </div>

                <InputField label="Distancia (Km)" name="distance" value={config.distance} />
                
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Primer Splitter (Nivel 1)</label>
                  <select 
                    value={config.splitter1}
                    onChange={(e) => setConfig({...config, splitter1: e.target.value})}
                    className="border border-gray-200 rounded-lg px-3 py-2 bg-white"
                  >
                    {Object.keys(SPLITTER_LOSS).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Segundo Splitter (Nivel 2)</label>
                  <select 
                    value={config.splitter2}
                    onChange={(e) => setConfig({...config, splitter2: e.target.value})}
                    className="border border-gray-200 rounded-lg px-3 py-2 bg-white"
                  >
                    {Object.keys(SPLITTER_LOSS).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="flex items-center gap-2 font-bold mb-4 text-slate-700">
                <Layers size={18} /> Pérdidas Pasivas y Margen
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InputField label="Conectores (n)" name="connectors" value={config.connectors} />
                <InputField label="Empalmes (n)" name="splices" value={config.splices} />
                <InputField label="Atenuación Fibra" name="fiberAttenuation" value={config.fiberAttenuation} />
                <InputField label="Margen Seguridad" name="safetyMargin" value={config.safetyMargin} />
              </div>
            </section>
          </div>

          {/* Columna de Resultados */}
          <div className="space-y-6">
            <div className={`p-6 rounded-3xl shadow-xl transition-colors ${
              results.status === 'SUCCESS' ? 'bg-emerald-600 text-white' : 
              results.status === 'WARNING' ? 'bg-amber-500 text-white' : 'bg-rose-600 text-white'
            }`}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-medium opacity-80 uppercase tracking-wider">Potencia Recibida</span>
                {results.status === 'SUCCESS' && <CheckCircle2 size={24} />}
                {results.status === 'WARNING' && <AlertTriangle size={24} />}
                {results.status === 'FAIL' && <XCircle size={24} />}
              </div>
              
              <div className="text-5xl font-black mb-2">
                {results.rxPower} <span className="text-xl font-normal">dBm</span>
              </div>
              
              <div className="text-sm opacity-90 border-t border-white/20 pt-4 mt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Pérdida Total:</span>
                  <span className="font-bold">{results.totalLoss} dB</span>
                </div>
                <div className="flex justify-between">
                  <span>Margen Actual:</span>
                  <span className="font-bold">{results.margin} dB</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                <Zap size={14} /> Desglose de pérdidas
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between py-1 border-b border-slate-50 italic">
                  <span>Fibra ({config.distance}km):</span>
                  <span className="font-mono">-{results.details.fiberLoss.toFixed(2)} dB</span>
                </li>
                <li className="flex justify-between py-1 border-b border-slate-50">
                  <span>Splitters (1+2):</span>
                  <span className="font-mono">-{(results.details.s1Loss + results.details.s2Loss).toFixed(2)} dB</span>
                </li>
                <li className="flex justify-between py-1 border-b border-slate-50">
                  <span>Conectores ({config.connectors}):</span>
                  <span className="font-mono">-{results.details.connLoss.toFixed(2)} dB</span>
                </li>
                <li className="flex justify-between py-1 border-b border-slate-50">
                  <span>Empalmes ({config.splices}):</span>
                  <span className="font-mono">-{results.details.spliceLoss.toFixed(2)} dB</span>
                </li>
              </ul>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-xl flex items-start gap-3">
                <Info size={20} className="text-blue-500 flex-shrink-0 mt-1" />
                <p className="text-xs text-blue-800 leading-relaxed">
                  Sensibilidad para {PON_STANDARDS[config.standard].name}: 
                  <strong className="block text-sm">{PON_STANDARDS[config.standard].rxSens} dBm</strong>
                  El valor ideal debería estar entre -15 y -25 dBm para GPON B+.
                </p>
              </div>
            </div>
          </div>

        </div>

        <footer className="mt-12 text-center text-slate-400 text-sm">
          <p>© 2024 FTTH Engineering Tool - Expert Mode</p>
        </footer>
      </div>
    </div>
  );
};

export default FTTHCalculator;
