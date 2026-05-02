import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Car, 
  Bike, 
  Fuel, 
  Settings, 
  Bell, 
  Plus, 
  ChevronRight, 
  History, 
  FileText, 
  TrendingUp, 
  Shield, 
  AlertCircle,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Calendar,
  Wrench,
  Sun,
  Moon,
  Globe,
  Camera,
  Languages
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { useAuth } from './components/AuthProvider';
import { useVehicles, useFuelLogs, useMaintenance, useDocuments } from './lib/hooks';
import { Vehicle, FuelLog, Maintenance, VehicleDocument } from './types';
import { translations } from './lib/translations';
import { getFuelPriceRecommendation, scanDocument, scanMaintenanceBill } from './lib/gemini';
import { 
  AreaChart,
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell,
  BarChart,
  Bar
} from 'recharts';

export default function App() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const { vehicles, loading: vehiclesLoading, addVehicle } = useVehicles();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [lang, setLang] = useState<'en' | 'ne'>('en');

  const t = (key: keyof typeof translations.en) => translations[lang][key];

  // Apply theme class to root
  useMemo(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);
  
  const activeVehicle = useMemo(() => 
    vehicles.find(v => v.id === selectedVehicleId) || vehicles[0], 
    [vehicles, selectedVehicleId]
  );

  const { logs } = useFuelLogs(activeVehicle?.id);
  const { records } = useMaintenance(activeVehicle?.id);
  const { docs } = useDocuments();

  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showAddFuel, setShowAddFuel] = useState(false);

  // Derived Analytics
  const analytics = useMemo(() => {
    if (!logs.length || logs.length < 2) return { avgMileage: 0, totalCost: 0, costPerKm: 0, chartData: [] };
    
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const totalLiters = logs.reduce((sum, l) => sum + (l.liters || 0), 0);
    const totalCost = logs.reduce((sum, l) => sum + (l.totalCost || 0), 0) + records.reduce((sum, r) => sum + (r.cost || 0), 0);
    
    const distance = sortedLogs[sortedLogs.length - 1].odometer - sortedLogs[0].odometer;
    const avgMileage = distance > 0 ? distance / totalLiters : 0;
    const costPerKm = distance > 0 ? totalCost / distance : 0;

    const chartData = sortedLogs.slice(1).map((log, i) => {
      const prevLog = sortedLogs[i];
      const dist = log.odometer - prevLog.odometer;
      const efficiency = dist / log.liters;
      return {
        date: format(parseISO(log.date), 'MMM d'),
        efficiency: Number(efficiency.toFixed(1)),
        cost: log.totalCost,
        fullDate: log.date
      };
    });

    const fuelTotal = logs.reduce((sum, l) => sum + (l.totalCost || 0), 0);
    const maintenanceTotal = records.reduce((sum, r) => sum + (r.cost || 0), 0);

    return { avgMileage, totalCost, fuelTotal, maintenanceTotal, costPerKm, chartData };
  }, [logs, records]);

  if (authLoading) return <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-white">Loading...</div>;

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950 px-6 overflow-hidden transition-colors duration-500">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.05),transparent)] pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bento-card p-8 text-center space-y-6 bg-slate-900 border-slate-800"
        >
          <div className="w-16 h-16 bg-sky-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-sky-500/20">
            <Car className="text-white w-8 h-8" />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight text-white">MotoLog<span className="text-sky-400">PRO</span></h1>
            <p className="text-slate-400">{t('welcome')}</p>
            <div className="flex justify-center gap-2">
              <button 
                onClick={() => setLang('en')} 
                className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all ${lang === 'en' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-500'}`}
              >
                ENGLISH
              </button>
              <button 
                onClick={() => setLang('ne')} 
                className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all ${lang === 'ne' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-500'}`}
              >
                नेपाली
              </button>
            </div>
          </div>
          <button 
            onClick={signInWithGoogle}
            className="w-full py-4 bg-white text-slate-950 font-black rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <Globe className="w-5 h-5" /> {t('signIn')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 transition-colors duration-300">
      <header className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-sky-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shadow-sky-500/20 text-white">M</div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter">MotoLog<span className="text-sky-400">PRO</span></h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-900 rounded-full p-1 border border-slate-200 dark:border-slate-800">
            <button 
              onClick={() => setLang('en')}
              className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${lang === 'en' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-500'}`}
            >
              EN
            </button>
            <button 
              onClick={() => setLang('ne')}
              className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${lang === 'ne' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-500'}`}
            >
              NE
            </button>
          </div>

          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500 transition-all"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-orange-400" /> : <Moon className="w-4 h-4 text-sky-600" />}
          </button>

          <div className="flex items-center gap-3 ml-2 pl-4 border-l border-slate-200 dark:border-slate-800">
            <button 
              onClick={signOut}
              className="w-9 h-9 rounded-full overflow-hidden border-2 border-sky-500 ring-4 ring-sky-500/10 hover:scale-105 transition-transform"
            >
               <img src={user.photoURL || ''} alt="" className="w-full h-full object-cover" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-min">
        {/* Active Vehicle Card */}
        <section className="md:col-span-4 bento-row-span-2 bento-card bg-gradient-to-br from-slate-900 to-slate-800 border-sky-900/50 p-6">
          <div className="flex justify-between items-start mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">Active Vehicle</span>
            <div className={`status-badge ${activeVehicle?.fuelType === 'petrol' ? 'status-ok' : 'status-warning'}`}>
              {activeVehicle?.fuelType || 'NONE'}
            </div>
          </div>
          
          {activeVehicle ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-3xl font-bold mb-1 leading-tight">{activeVehicle.name}</h2>
                <p className="text-slate-400 text-sm">{activeVehicle.make} {activeVehicle.model} • {activeVehicle.year}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Odometer</div>
                  <div className="text-xl font-bold mono">{activeVehicle.currentOdometer.toLocaleString()} <span className="text-xs font-normal opacity-50">KM</span></div>
                </div>
                <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Last Service</div>
                  <div className="text-xl font-bold mono">
                    {records[0]?.odometer?.toLocaleString() || '---'} <span className="text-xs font-normal opacity-50">KM</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => setShowAddFuel(true)}
                  className="flex-1 bg-sky-600 hover:bg-sky-500 text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Fuel
                </button>
                <button className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                  <Settings className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <Car className="w-12 h-12 text-slate-700" />
              <p className="text-slate-500 text-sm">No vehicles yet</p>
              <button 
                onClick={() => setShowAddVehicle(true)}
                className="bg-sky-600 hover:bg-sky-500 text-white px-6 py-2 rounded-lg text-sm font-bold transition-all"
              >
                Add Your First Vehicle
              </button>
            </div>
          )}
        </section>

        {/* Efficiency Chart */}
        <section className="md:col-span-5 bento-card min-h-[300px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Fuel Efficiency Trend</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Efficiency</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 min-h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <YAxis hide domain={[0, 'auto']} />
                <Tooltip 
                  cursor={{fill: '#1e293b'}}
                  contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '12px'}}
                  itemStyle={{color: '#38bdf8'}}
                />
                <Bar dataKey="efficiency" radius={[4, 4, 0, 0]}>
                  {analytics.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.efficiency > 15 ? '#38bdf8' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-between mt-4 text-[10px] text-slate-500 font-bold uppercase">
            <span>Last 6 Sessions</span>
            <span className="text-sky-400">Avg: {analytics.avgMileage.toFixed(1)} KM/L</span>
          </div>
        </section>

        {/* Stats Column */}
        <div className="md:col-span-3 space-y-4">
          <div className="bento-card border-l-4 border-l-orange-500 py-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Average Mileage</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-black">{analytics.avgMileage.toFixed(1)}</span>
              <span className="text-lg text-slate-500 font-semibold uppercase">KM/L</span>
            </div>
          </div>
          <div className="bento-card border-l-4 border-l-sky-500 py-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cost Per KM</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-black">₹{analytics.costPerKm.toFixed(2)}</span>
            </div>
            <div className="text-[10px] text-sky-400 font-bold mt-1 uppercase">Fuel + Service</div>
          </div>
        </div>

        {/* Maintenance Reminders */}
        <section className="md:col-span-3 bento-card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-sky-400" /> {t('maintenance')}
            </h3>
            <button className="p-1 px-3 bg-slate-100 dark:bg-slate-800 text-[9px] font-black rounded-lg text-slate-500 hover:text-sky-500 transition-colors uppercase">SCAN</button>
          </div>
          <div className="space-y-2 flex-1 overflow-y-auto max-h-[160px] scrollbar-hide">
            {records.slice(0, 4).map((record) => (
              <div key={record.id} className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center group cursor-pointer hover:border-sky-500/30 transition-all">
                <div className="flex flex-col">
                  <span className="text-xs font-black truncate max-w-[100px]">{record.type}</span>
                  <span className="text-[10px] text-slate-500 font-bold">{format(parseISO(record.date), 'MMM d, yyyy')}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-sky-500">₹{record.cost}</div>
                </div>
              </div>
            ))}
            {records.length === 0 && (
              <div className="flex flex-col items-center justify-center h-24 opacity-30 italic text-[10px] uppercase font-black">
                No history
              </div>
            )}
          </div>
          <button className="mt-4 w-full py-2.5 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-800 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all">
            ALL RECORDS
          </button>
        </section>

        {/* Cost Analysis */}
        <section className="md:col-span-6 bento-card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('expenseDistribution')}</h3>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
            <div className="flex flex-col justify-center pr-0 md:pr-8 border-slate-100 dark:border-slate-800 min-h-[120px]">
               <div className="text-[10px] font-black text-slate-500 mb-1 uppercase tracking-widest">TOTAL LIFETIME</div>
               <div className="text-5xl font-black tracking-tighter mb-1">₹{analytics.totalCost.toLocaleString()}</div>
               <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">Combined fuel and maintenance costs.</p>
            </div>
            <div className="space-y-4 flex flex-col justify-center">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                  <span className="text-slate-500">{t('fuel')}</span>
                  <span className="text-sky-500">{analytics.totalCost > 0 ? Math.round((analytics.fuelTotal / analytics.totalCost) * 100) : 0}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 transition-all duration-1000" style={{ width: `${analytics.totalCost > 0 ? (analytics.fuelTotal / analytics.totalCost) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                  <span className="text-slate-500">{t('maintenance')}</span>
                  <span className="text-orange-500">{analytics.totalCost > 0 ? Math.round((analytics.maintenanceTotal / analytics.totalCost) * 100) : 0}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${analytics.totalCost > 0 ? (analytics.maintenanceTotal / analytics.totalCost) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Documents */}
        <section className="md:col-span-3 bento-card bg-orange-500/5 border-orange-500/20">
          <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400 mb-6 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Documents
          </h3>
          <div className="space-y-4 flex-1">
            {docs.map((doc) => {
              const daysLeft = differenceInDays(parseISO(doc.expiryDate), new Date());
              return (
                <div key={doc.id} className="flex items-start gap-3 group">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${daysLeft < 30 ? 'bg-orange-500/20 text-orange-500' : 'bg-slate-800 text-slate-400'}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-100">{doc.title}</div>
                    <div className={`text-[10px] font-bold uppercase ${daysLeft < 30 ? 'text-orange-500 animate-pulse' : 'text-slate-500'}`}>
                      {daysLeft < 0 ? 'Expired' : `Expires in ${daysLeft} days`}
                    </div>
                  </div>
                </div>
              );
            })}
            {docs.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full opacity-30 italic text-sm text-orange-200">
                No documents
              </div>
            )}
          </div>
          <button className="mt-6 w-full py-2.5 border border-orange-500/30 text-orange-500 text-[10px] font-bold rounded uppercase tracking-widest hover:bg-orange-500/10 transition-colors">
            Add Document
          </button>
        </section>
      </main>

      {/* Add Vehicle Modal (Simplified for MVP) */}
      <AnimatePresence>
        {showAddVehicle && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 w-full max-w-md rounded-2xl p-6 border border-slate-800"
            >
              <VehicleForm onSubmit={() => setShowAddVehicle(false)} onCancel={() => setShowAddVehicle(false)} />
            </motion.div>
          </div>
        )}
        {showAddFuel && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 w-full max-w-md rounded-2xl p-6 border border-slate-800"
            >
              <FuelForm vehicleId={activeVehicle?.id || ''} onSubmit={() => setShowAddFuel(false)} onCancel={() => setShowAddFuel(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function VehicleForm({ onSubmit, onCancel }: { onSubmit: () => void, onCancel: () => void }) {
  const { addVehicle } = useVehicles();
  const [formData, setFormData] = useState({
    name: '',
    type: 'motorcycle' as 'motorcycle' | 'car',
    fuelType: 'petrol' as 'petrol' | 'diesel',
    make: '',
    model: '',
    year: 2024,
    currentOdometer: 0,
    initialOdometer: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addVehicle({ ...formData, initialOdometer: formData.currentOdometer });
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-black tracking-tighter text-slate-100 uppercase">New Vehicle</h3>
        <Car className="w-5 h-5 text-sky-500" />
      </div>
      <div className="space-y-1">
         <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nick Name</label>
         <input 
           autoFocus required
           className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:border-sky-500 outline-none transition-all placeholder:text-slate-700 font-bold"
           value={formData.name}
           onChange={e => setFormData({ ...formData, name: e.target.value })}
           placeholder="e.g. Blue Bullet"
         />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Type</label>
          <select 
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm font-bold appearance-none cursor-pointer focus:border-sky-500 outline-none"
            value={formData.type}
            onChange={e => setFormData({ ...formData, type: e.target.value as any })}
          >
            <option value="motorcycle">Motorcycle</option>
            <option value="car">Car</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Fuel</label>
          <select 
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm font-bold appearance-none cursor-pointer focus:border-sky-500 outline-none"
            value={formData.fuelType}
            onChange={e => setFormData({ ...formData, fuelType: e.target.value as any })}
          >
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Odometer (KM)</label>
          <input 
            type="number" required
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm font-black"
            value={formData.currentOdometer}
            onChange={e => setFormData({ ...formData, currentOdometer: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Year</label>
          <input 
            type="number" required
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm font-black"
            value={formData.year}
            onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) || 2024 })}
          />
        </div>
      </div>
      <div className="flex gap-3 pt-6">
        <button type="button" onClick={onCancel} className="flex-1 py-3 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all">Cancel</button>
        <button type="submit" className="flex-1 py-3 bg-sky-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-sky-600/20 active:scale-95 transition-all">Create</button>
      </div>
    </form>
  );
}

function FuelForm({ vehicleId, onSubmit, onCancel }: { vehicleId: string, onSubmit: () => void, onCancel: () => void }) {
  const { addFuelLog } = useFuelLogs(vehicleId);
  const { vehicles } = useVehicles();
  const vehicle = vehicles.find(v => v.id === vehicleId);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    odometer: vehicle?.currentOdometer || 0,
    liters: 0,
    pricePerLiter: 172,
    totalCost: 0,
    isFullTank: true
  });

  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    async function fetchPrice() {
      const price = await getFuelPriceRecommendation(vehicle?.fuelType || 'petrol');
      setFormData(prev => ({ ...prev, pricePerLiter: price }));
    }
    fetchPrice();
  }, [vehicle]);

  const handleLitersChange = (val: number) => {
    setFormData(prev => ({ ...prev, liters: val, totalCost: Number((val * prev.pricePerLiter).toFixed(2)) }));
  };

  const handleCostChange = (val: number) => {
    setFormData(prev => ({ ...prev, totalCost: val, liters: Number((val / prev.pricePerLiter).toFixed(2)) }));
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await scanMaintenanceBill(base64, file.type);
        if (result.totalCost) {
          handleCostChange(result.totalCost);
        }
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.odometer < (vehicle?.currentOdometer || 0)) {
       alert("Odometer must be strictly non-decreasing!");
       return;
    }
    await addFuelLog({
      ...formData,
      vehicleId,
      totalCost: formData.totalCost || (formData.liters * formData.pricePerLiter)
    });
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-black tracking-tighter text-slate-100 uppercase flex items-center gap-2">
           <Fuel className="w-5 h-5 text-sky-500" /> Fuel Refill
        </h3>
        <label className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-sky-500 transition-colors cursor-pointer">
          <Camera className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
          <input type="file" className="hidden" accept="image/*" onChange={handleScan} />
        </label>
      </div>
      
      <div className="space-y-1">
         <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Odometer Readings (≥ {vehicle?.currentOdometer})</label>
         <input 
           type="number" required
           className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm font-black focus:border-sky-500 outline-none"
           value={formData.odometer}
           onChange={e => setFormData({ ...formData, odometer: parseInt(e.target.value) || 0 })}
         />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Liters</label>
          <input 
            type="number" step="0.01" required
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm font-black focus:border-sky-500 outline-none"
            value={formData.liters}
            onChange={e => handleLitersChange(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total cost (₹)</label>
          <input 
            type="number" step="0.01" required
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm font-black focus:border-sky-500 outline-none"
            value={formData.totalCost}
            onChange={e => handleCostChange(parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="p-3 bg-sky-500/5 rounded-xl border border-sky-500/10 flex justify-between items-center">
        <div className="text-[10px] font-black text-sky-500 uppercase tracking-widest">Auto Price Fill (NOC)</div>
        <div className="text-xs font-black text-slate-400">₹{formData.pricePerLiter}/L</div>
      </div>

      <div className="flex gap-3 pt-6">
        <button type="button" onClick={onCancel} className="flex-1 py-3 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all">Cancel</button>
        <button type="submit" className="flex-1 py-3 bg-sky-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-sky-600/20 active:scale-95 transition-all">Record</button>
      </div>
    </form>
  );
}

function MaintenanceForm({ vehicleId, onSubmit, onCancel }: { vehicleId: string, onSubmit: () => void, onCancel: () => void }) {
  const { addMaintenance } = useMaintenance(vehicleId);
  const [isScanning, setIsScanning] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: '',
    odometer: 0,
    cost: 0,
    notes: '',
    businessName: '',
    placeOfMaintenance: ''
  });

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await scanMaintenanceBill(base64, file.type);
        setFormData(prev => ({
          ...prev,
          type: result.works?.[0]?.description || result.type || '',
          cost: result.totalCost || 0,
          businessName: result.businessName || '',
          placeOfMaintenance: result.place || ''
        }));
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addMaintenance({ ...formData, vehicleId });
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-black tracking-tighter text-slate-100 uppercase flex items-center gap-2">
           <Wrench className="w-5 h-5 text-sky-500" /> Service Record
        </h3>
        <label className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-sky-500 transition-colors cursor-pointer">
          <Camera className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
          <input type="file" className="hidden" accept="image/*" onChange={handleScan} />
        </label>
      </div>

      <div className="space-y-1">
         <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Work Description</label>
         <input 
           required className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm font-bold"
           value={formData.type}
           onChange={e => setFormData({ ...formData, type: e.target.value })}
           placeholder="e.g. Engine Oil Change"
         />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cost (₹)</label>
          <input 
            type="number" required
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm font-black"
            value={formData.cost}
            onChange={e => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Odometer</label>
          <input 
            type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm font-black"
            value={formData.odometer}
            onChange={e => setFormData({ ...formData, odometer: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-6">
        <button type="button" onClick={onCancel} className="flex-1 py-3 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all">Cancel</button>
        <button type="submit" className="flex-1 py-3 bg-sky-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-sky-600/20 active:scale-95 transition-all">Save Record</button>
      </div>
    </form>
  );
}
