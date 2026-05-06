/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Target, 
  History, 
  Settings,
  TrendingUp,
  Calendar as CalendarIcon,
  ShoppingBag,
  ArrowUpRight,
  ChevronRight,
  MoreVertical,
  X,
  CreditCard,
  Hash,
  Clock,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppData } from './hooks/useAppData';
import { formatCurrency, formatPercent, cn } from './lib/utils';
import { getDashboardStats, calculateGoalProgress, getSalesByInterval } from './utils/calculations';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Page = 'dashboard' | 'sales' | 'goals' | 'history' | 'settings';

export default function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const { 
    data, 
    addSale, 
    deleteSale, 
    addGoal, 
    updateGoal, 
    deleteGoal, 
    addCategory, 
    updateCategory, 
    deleteCategory, 
    toggleWorkingDay 
  } = useAppData();

  const stats = useMemo(() => getDashboardStats(data.sales, data.goals, data.workingDays), [data]);

  // Chart Data Preparation
  const last7DaysData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
      const daySales = data.sales
        .filter(s => s.date === date)
        .reduce((acc, s) => acc + s.value, 0);
      return {
        name: format(subDays(new Date(), 6 - i), 'EEE', { locale: ptBR }),
        vendas: daySales
      };
    });
  }, [data.sales]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 md:pb-0 md:pl-64">
      {/* Sidebar Navigation - Desktop */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 flex-col p-6 z-30">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <TrendingUp size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">MetaSmart</h1>
        </div>

        <div className="space-y-2">
          <NavItem active={activePage === 'dashboard'} onClick={() => setActivePage('dashboard')} icon={LayoutDashboard} label="Dashboard" />
          <NavItem active={activePage === 'sales'} onClick={() => setActivePage('sales')} icon={ShoppingBag} label="Vendas" />
          <NavItem active={activePage === 'goals'} onClick={() => setActivePage('goals')} icon={Target} label="Metas" />
          <NavItem active={activePage === 'history'} onClick={() => setActivePage('history')} icon={History} label="Histórico" />
          <NavItem active={activePage === 'settings'} onClick={() => setActivePage('settings')} icon={Settings} label="Configurações" />
        </div>
      </nav>

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 flex items-center justify-around py-3 px-2 z-40">
        <MobileNavItem active={activePage === 'dashboard'} onClick={() => setActivePage('dashboard')} icon={LayoutDashboard} label="Início" />
        <MobileNavItem active={activePage === 'sales'} onClick={() => setActivePage('sales')} icon={ShoppingBag} label="Vendas" />
        <MobileNavItem active={activePage === 'goals'} onClick={() => setActivePage('goals')} icon={Target} label="Metas" />
        <MobileNavItem active={activePage === 'history'} onClick={() => setActivePage('history')} icon={History} label="Histórico" />
        <MobileNavItem active={activePage === 'settings'} onClick={() => setActivePage('settings')} icon={Settings} label="Config" />
      </nav>

      {/* Main Content Area */}
      <main className="p-4 md:p-8 max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {activePage === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <header className="flex flex-col gap-1">
                <h2 className="text-3xl font-bold">Hoje, {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}</h2>
                <p className="text-slate-500">Acompanhe seu desempenho e metas em tempo real.</p>
              </header>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard 
                  title="Vendido Hoje" 
                  value={formatCurrency(stats.salesToday)} 
                  subvalue={`${stats.countToday} vendas`}
                  icon={ArrowUpRight}
                  color="bg-indigo-500"
                />
                <StatsCard 
                  title="Vendido no Mês" 
                  value={formatCurrency(stats.salesMonthTotal)} 
                  subvalue="Referente a Maio"
                  icon={TrendingUp}
                  color="bg-emerald-500"
                />
                <StatsCard 
                  title="Projeção Mensal" 
                  value={formatCurrency(stats.projection)} 
                  subvalue="Baseado no ritmo atual"
                  icon={TrendingUp}
                  color="bg-amber-500"
                />
                <StatsCard 
                  title="Total Geral" 
                  value={formatCurrency(stats.salesTotalOverall)} 
                  subvalue="Todas as vendas"
                  icon={TrendingUp}
                  color="bg-slate-800"
                />
              </div>

              {/* Main Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-lg text-slate-800">Evolução de Vendas (7 dias)</h3>
                    <div className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                      +12.4% vs anterior
                    </div>
                  </div>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={last7DaysData}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: number) => [formatCurrency(value), 'Vendidos']}
                        />
                        <Area type="monotone" dataKey="vendas" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Categories Breakdown */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-semibold text-lg text-slate-800 mb-6">Por Categoria</h3>
                  <div className="space-y-4">
                    {data.categories.slice(0, 5).map(cat => {
                      const catSales = data.sales
                        .filter(s => s.categoryId === cat.id && s.date.startsWith(format(new Date(), 'yyyy-MM')))
                        .reduce((acc, s) => acc + s.value, 0);
                      const totalMonth = stats.salesMonthTotal || 1;
                      const percent = (catSales / totalMonth) * 100;

                      return (
                        <div key={cat.id} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-slate-600">{cat.name}</span>
                            <span className="text-slate-400">{formatCurrency(catSales)}</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full" 
                              style={{ width: `${percent}%`, backgroundColor: cat.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Goals Progress */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-800">Suas Metas Ativas</h3>
                  <button 
                    onClick={() => setActivePage('goals')}
                    className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-1"
                  >
                    Ver todas <ChevronRight size={16} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.goals.filter(g => g.status === 'active').slice(0, 4).map(goal => {
                    const prog = calculateGoalProgress(goal, data.sales, data.workingDays);
                    return (
                      <div key={goal.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-slate-800">{goal.name}</h4>
                            <p className="text-xs text-slate-400">Até {format(parseISO(goal.endDate), 'dd/MM/yyyy')}</p>
                          </div>
                          <div className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold uppercase">
                            {data.categories.find(c => c.id === goal.categoryId)?.name || 'Geral'}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500 font-medium">{formatPercent(prog.percent / 100)}</span>
                            <span className="text-slate-700 font-bold">{formatCurrency(prog.totalSold)} / {formatCurrency(goal.targetValue)}</span>
                          </div>
                          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(prog.percent, 100)}%` }}
                              className="h-full bg-indigo-600"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="bg-slate-50 p-3 rounded-xl">
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Média Necessária</p>
                            <p className="font-bold text-indigo-600 text-sm">{formatCurrency(prog.dailyNeeded)}/dia</p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl">
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Dias Restantes</p>
                            <p className="font-bold text-slate-700 text-sm">{prog.remainingWorkingDays} úteis</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {data.goals.filter(g => g.status === 'active').length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                      <Target size={48} className="mb-4 opacity-20" />
                      <p>Nenhuma meta ativa encontrada.</p>
                      <button 
                        onClick={() => setActivePage('goals')}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm"
                      >
                        Criar primeira meta
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activePage === 'sales' && (
            <SalesPage 
              data={data} 
              onAddSale={addSale} 
              onDeleteSale={deleteSale} 
              categories={data.categories} 
            />
          )}

          {activePage === 'goals' && (
            <GoalsPage 
              data={data} 
              onAddGoal={addGoal}
              updateGoal={updateGoal}
              onDeleteGoal={deleteGoal}
              categories={data.categories}
              workingDays={data.workingDays}
            />
          )}

          {activePage === 'history' && (
            <HistoryPage 
              data={data}
              categories={data.categories}
            />
          )}

          {activePage === 'settings' && (
            <SettingsPage 
              data={data}
              addCategory={addCategory}
              updateCategory={updateCategory}
              deleteCategory={deleteCategory}
              toggleWorkingDay={toggleWorkingDay}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// UI Components
function NavItem({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
        active 
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
          : "text-slate-500 hover:bg-slate-100"
      )}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );
}

function MobileNavItem({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 min-w-[64px]",
        active ? "text-indigo-600" : "text-slate-400"
      )}
    >
      <Icon size={22} color="currentColor" />
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </button>
  );
}

function StatsCard({ title, value, subvalue, icon: Icon, color }: { title: string; value: string; subvalue: string; icon: any; color: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <span className="text-slate-500 text-sm font-medium">{title}</span>
        <div className={cn("p-2 rounded-lg text-white", color)}>
          <Icon size={18} />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-xs text-slate-400 mt-1">{subvalue}</div>
      </div>
    </div>
  );
}

// --- Page Components (Sub-components) ---

function SalesPage({ data, onAddSale, onDeleteSale, categories }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    value: '',
    categoryId: 'all',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    observation: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddSale({
      value: parseFloat(formData.value),
      categoryId: formData.categoryId,
      date: formData.date,
      time: formData.time,
      observation: formData.observation
    });
    setFormData({
      value: '',
      categoryId: 'all',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      observation: ''
    });
    setIsAdding(false);
  };

  const salesSorted = [...data.sales].sort((a, b) => {
    return new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime();
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Vendas</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 transition-transform"
        >
          <PlusCircle size={20} /> Lancar Venda
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Data / Hora</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Observação</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Valor</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salesSorted.map(sale => {
                const cat = categories.find((c: any) => c.id === sale.categoryId);
                return (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-800">{format(parseISO(sale.date), 'dd/MM/yyyy')}</div>
                      <div className="text-xs text-slate-400">{sale.time}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat?.color }} />
                        <span className="text-sm text-slate-600 font-medium">{cat?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-400">{sale.observation || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(sale.value)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onDeleteSale(sale.id)}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {salesSorted.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                    Nenhuma venda lançada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lancar Venda */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setIsAdding(false)}
                className="absolute right-6 top-6 text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
              
              <h3 className="text-2xl font-bold mb-6">Lançar Nova Venda</h3>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                    <CreditCard size={16} /> Valor da Venda (R$)
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    autoFocus
                    placeholder="0,00"
                    className="w-full text-2xl font-bold p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:ring-2 ring-indigo-500"
                    value={formData.value}
                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                      <Hash size={16} /> Categoria
                    </label>
                    <select
                      className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200"
                      value={formData.categoryId}
                      onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                    >
                      {categories.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                      <Clock size={16} /> Horário
                    </label>
                    <input 
                      type="time" 
                      className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200"
                      value={formData.time}
                      onChange={e => setFormData({ ...formData, time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                    <CalendarIcon size={16} /> Data
                  </label>
                  <input 
                    type="date" 
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                    <FileText size={16} /> Observação (opcional)
                  </label>
                  <textarea 
                    placeholder="Algum detalhe extra?"
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 h-24 resize-none"
                    value={formData.observation}
                    onChange={e => setFormData({ ...formData, observation: e.target.value })}
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors"
                >
                  Salvar Venda
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function GoalsPage({ data, onAddGoal, onDeleteGoal, categories, workingDays }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    targetValue: '',
    categoryId: 'all',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddGoal({
      ...formData,
      targetValue: parseFloat(formData.targetValue),
      status: 'active'
    });
    setFormData({
      name: '',
      targetValue: '',
      categoryId: 'all',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    });
    setIsAdding(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Metas Inteligentes</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
        >
          <Target size={20} /> Nova Meta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.goals.map((goal: any) => {
          const prog = calculateGoalProgress(goal, data.sales, workingDays);
          const cat = categories.find((c: any) => c.id === goal.categoryId);
          
          return (
            <motion.div 
              key={goal.id} 
              layout
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative group overflow-hidden"
            >
              <div 
                className="absolute top-0 left-0 h-1 w-full" 
                style={{ backgroundColor: cat?.color || '#ccc' }} 
              />
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{goal.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold text-slate-400">Restaurante: {cat?.name || 'Geral'}</span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs font-semibold text-slate-400">{format(parseISO(goal.startDate), 'dd/MM')} - {format(parseISO(goal.endDate), 'dd/MM')}</span>
                  </div>
                </div>
                <button 
                  onClick={() => onDeleteGoal(goal.id)}
                  className="p-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-500">{formatPercent(prog.percent / 100)} concluído</span>
                    <span className="font-bold text-slate-900">{formatCurrency(prog.totalSold)} / {formatCurrency(goal.targetValue)}</span>
                  </div>
                  <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(prog.percent, 100)}%` }}
                      className="h-full bg-indigo-600 rounded-full shadow-sm"
                      style={{ backgroundColor: cat?.color }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Média Diária Alvo</p>
                    <p className="text-lg font-bold text-indigo-600">{formatCurrency(prog.dailyNeeded)}/dia</p>
                    <p className="text-[10px] text-slate-400 mt-1">Nos dias trabalhados restantes</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Status do Percurso</p>
                    <div className="flex items-center gap-1">
                      <p className={cn(
                        "text-lg font-bold",
                        prog.percent >= 100 ? "text-emerald-500" : prog.percent > 50 ? "text-amber-500" : "text-slate-700"
                      )}>
                        {prog.percent >= 100 ? 'Finalizada' : `${prog.remainingWorkingDays} dias restantes`}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Conforme calendário</p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        {data.goals.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-300">
             <Target size={64} className="mb-4 opacity-10" />
             <p className="font-medium">Define sua primeira meta para começar.</p>
          </div>
        )}
      </div>

       {/* Modal Nova Meta */}
       <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setIsAdding(false)}
                className="absolute right-6 top-6 text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
              
              <h3 className="text-2xl font-bold mb-6 text-slate-800">Criar Nova Meta</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-600">Título da Meta</label>
                  <input 
                    type="text" 
                    required 
                    autoFocus
                    placeholder="Ex: Meta de Vendas Maio"
                    className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:ring-2 ring-indigo-500"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-600">Valor Alvo (R$)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      required 
                      className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:ring-2 ring-indigo-500 font-bold"
                      value={formData.targetValue}
                      onChange={e => setFormData({ ...formData, targetValue: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-600">Categoria</label>
                    <select
                      className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200"
                      value={formData.categoryId}
                      onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                    >
                      {categories.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-600">Data Inicial</label>
                    <input 
                      type="date" 
                      className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200"
                      value={formData.startDate}
                      onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-600">Data Final</label>
                    <input 
                      type="date" 
                      className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200"
                      value={formData.endDate}
                      onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-slate-800 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-slate-900 transition-colors"
                  >
                    Ativar Meta
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HistoryPage({ data, categories }: any) {
  const [filterCategory, setFilterCategory] = useState('all');
  
  const filteredSales = useMemo(() => {
    return data.sales.filter((s: any) => filterCategory === 'all' || s.categoryId === filterCategory);
  }, [data.sales, filterCategory]);

  const salesByMonth = useMemo(() => {
    const months: any = {};
    filteredSales.forEach((s: any) => {
      const m = format(parseISO(s.date), 'yyyy-MM');
      if (!months[m]) months[m] = 0;
      months[m] += s.value;
    });
    return Object.entries(months).map(([name, total]) => ({ name, total }));
  }, [filteredSales]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold">Histórico e Análise</h2>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
           <span className="text-xs font-bold text-slate-400 px-3 truncate">FILTRAR POR:</span>
           <select 
            className="text-sm font-semibold p-2 bg-transparent outline-none cursor-pointer"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
             {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Comparativo Mensal</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={salesByMonth}>
                 <Tooltip formatter={(v: any) => formatCurrency(v)} />
                 <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Totais por Categorias</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Tooltip formatter={(v: any) => formatCurrency(v)} />
                 <Pie 
                    data={categories.map((c: any) => ({
                      name: c.name,
                      value: filteredSales.filter((s:any) => s.categoryId === c.id).reduce((acc:any, s:any) => acc + s.value, 0)
                    }))} 
                    dataKey="value" 
                    innerRadius={60} 
                    outerRadius={80} 
                    paddingAngle={5}
                  >
                   {categories.map((c:any, i:any) => <Cell key={i} fill={c.color} />)}
                 </Pie>
               </PieChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-lg">Registro Detalhado</h3>
          <p className="text-slate-400 text-xs">{filteredSales.length} registros encontrados</p>
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-left">
             <thead className="sticky top-0 bg-slate-50 shadow-sm">
                <tr>
                   <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Data</th>
                   <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Categoria</th>
                   <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Valor</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {filteredSales.sort((a: any,b: any) => b.date.localeCompare(a.date)).map((s: any) => {
                 const cat = categories.find((c: any) => c.id === s.categoryId);
                 return (
                   <tr key={s.id}>
                     <td className="px-6 py-4 text-sm font-medium">{format(parseISO(s.date), 'dd/MM/yy')}</td>
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat?.color }} />
                           <span className="text-sm text-slate-500">{cat?.name}</span>
                        </div>
                     </td>
                     <td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(s.value)}</td>
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

function SettingsPage({ data, addCategory, updateCategory, deleteCategory, toggleWorkingDay }: any) {
  const [activeTab, setActiveTab] = useState<'categories' | 'calendar'>('categories');
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');

  // Calendar logic
  const monthDays = useMemo(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    return eachDayOfInterval({ start, end });
  }, []);

  return (
    <div className="space-y-8">
       <h2 className="text-3xl font-bold">Configurações</h2>
       
       <div className="flex gap-4 border-b border-slate-200">
          <button 
            className={cn("pb-4 font-bold text-sm transition-all", activeTab === 'categories' ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-400")}
            onClick={() => setActiveTab('categories')}
          >
            Categorias
          </button>
          <button 
            className={cn("pb-4 font-bold text-sm transition-all", activeTab === 'calendar' ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-400")}
            onClick={() => setActiveTab('calendar')}
          >
            Dias Trabalhados
          </button>
       </div>

       {activeTab === 'categories' && (
         <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold">Gerenciar Categorias</h3>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Nome da categoria" 
                  className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 ring-indigo-500"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                />
                <input 
                  type="color" 
                  className="w-12 h-12 p-1 bg-white rounded-xl border border-slate-200 cursor-pointer"
                  value={newCatColor}
                  onChange={e => setNewCatColor(e.target.value)}
                />
                <button 
                  onClick={() => {
                    if (newCatName) {
                      addCategory({ name: newCatName, color: newCatColor, status: 'active' });
                      setNewCatName('');
                    }
                  }}
                  className="bg-indigo-600 text-white px-4 rounded-xl font-bold"
                >
                  Adicionar
                </button>
              </div>

              <div className="space-y-2 mt-6">
                 {data.categories.map((cat: any) => (
                   <div key={cat.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                         <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                         <span className="font-bold text-slate-700">{cat.name}</span>
                      </div>
                      {cat.id !== 'all' && (
                        <button 
                          onClick={() => deleteCategory(cat.id)}
                          className="text-slate-300 hover:text-red-500 p-2"
                        >
                          <X size={18} />
                        </button>
                      )}
                   </div>
                 ))}
              </div>
            </div>
         </div>
       )}

       {activeTab === 'calendar' && (
         <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
               <div>
                  <h3 className="font-bold text-slate-800">Seu Calendário de Trabalho</h3>
                  <p className="text-sm text-slate-400">Marque apenas os dias em que planeja trabalhar para que os cálculos de metas sejam precisos.</p>
               </div>
               
               <div className="grid grid-cols-7 gap-2">
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                    <div key={i} className="text-center text-[10px] uppercase font-bold text-slate-300 mb-2">{d}</div>
                  ))}
                  {monthDays.map(date => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const isWorking = data.workingDays[dateStr] !== false;
                    return (
                      <button 
                        key={dateStr}
                        onClick={() => toggleWorkingDay(dateStr)}
                        className={cn(
                          "aspect-square rounded-xl text-sm font-bold flex items-center justify-center transition-all",
                          isWorking 
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                        )}
                      >
                        {format(date, 'd')}
                      </button>
                    );
                  })}
               </div>
               
               <div className="flex gap-4 mt-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-indigo-600" />
                    <span className="text-xs font-bold text-slate-500">Dia Útil</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-slate-100 border border-slate-200" />
                    <span className="text-xs font-bold text-slate-500">Folga / Inativo</span>
                  </div>
               </div>
            </div>
         </div>
       )}
    </div>
  );
}
