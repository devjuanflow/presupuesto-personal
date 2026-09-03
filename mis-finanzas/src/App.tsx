import React, { useState, useEffect, useRef } from 'react';

interface Transaction {
  id: string;
  month: string;
  category: string;
  type: 'income' | 'expense';
  desc: string;
  amount: number;
}

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
}

interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  paidAmount: number;
  monthlyPayment: number;
  totalInstallments: number;
  paidInstallments: number;
  dueDate: string;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const CATEGORIES = [
  { name: 'Salario / Ingreso Fijo', type: 'income' },
  { name: 'Ingresos Adicionales', type: 'income' },
  { name: 'Ahorro', type: 'expense' },
  { name: 'Fondo de emergencia', type: 'expense' },
  { name: 'Arriendo / Hipoteca', type: 'expense' },
  { name: 'Ayuda casa', type: 'expense' },
  { name: 'Gasolina / Transporte', type: 'expense' },
  { name: 'Celular financiado', type: 'expense' },
  { name: 'Estudio', type: 'expense' },
  { name: 'Suscripciones', type: 'expense' },
  { name: 'Facturas (Servicios)', type: 'expense' },
  { name: 'Alimentos / Mercado', type: 'expense' },
  { name: 'Deudas / Préstamos', type: 'expense' },
  { name: 'Otros Gastos', type: 'expense' },
];

const INSTALLMENT_OPTIONS = [1, 2, 3, 4, 6, 10, 12, 18, 24, 36, 48, 60];
const DUE_DATE_OPTIONS = [
  '1 de cada mes', '5 de cada mes', '10 de cada mes', 
  '15 de cada mes', '20 de cada mes', '25 de cada mes', 
  '28 de cada mes', 'Fin de mes'
];

type DetailModalType = 'Ingresos' | 'Gastos' | 'Ahorros' | 'Deudas Mes' | null;

export default function App() {
  const [activeTab, setActiveTab] = useState<'budget' | 'savings' | 'debts' | 'annual'>('budget');
  const [budgetName, setBudgetName] = useState(() => localStorage.getItem('budget_name') || 'Mi Presupuesto');
  const [budgetDate, setBudgetDate] = useState(() => localStorage.getItem('budget_date') || '2026');
  const [currentMonth, setCurrentMonth] = useState('Septiembre');
  
  const [txs, setTxs] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('presupuesto_personal_local');
    return saved ? JSON.parse(saved) : [];
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('savings_goals_local');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Viaje de vacaciones', targetAmount: 2500000, currentAmount: 500000 },
      { id: '2', name: 'Compra de computador', targetAmount: 4000000, currentAmount: 1200000 }
    ];
  });

  const [debts, setDebts] = useState<Debt[]>(() => {
    const saved = localStorage.getItem('debts_local');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Tarjeta de Crédito Bancolombia', totalAmount: 1500000, paidAmount: 300000, monthlyPayment: 250000, totalInstallments: 12, paidInstallments: 2, dueDate: '15 de cada mes' },
      { id: '2', name: 'Celular Financiado (Claro)', totalAmount: 1200000, paidAmount: 400000, monthlyPayment: 100000, totalInstallments: 12, paidInstallments: 4, dueDate: '28 de cada mes' }
    ];
  });

  const [modalType, setModalType] = useState<DetailModalType>(null);

  // Estados Formulario Metas
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalCurrent, setNewGoalCurrent] = useState('');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // Estados Formulario Deudas
  const [newDebtName, setNewDebtName] = useState('');
  const [newDebtTotal, setNewDebtTotal] = useState('');
  const [newDebtPaid, setNewDebtPaid] = useState('');
  const [newDebtMonthly, setNewDebtMonthly] = useState('');
  const [newDebtTotalInst, setNewDebtTotalInst] = useState(12);
  const [newDebtPaidInst, setNewDebtPaidInst] = useState(0);
  const [newDebtDueDate, setNewDebtDueDate] = useState(DUE_DATE_OPTIONS[3]);
  const [editingDebtId, setEditingDebtId] = useState<string | null>(null);
  
  // Estados Formulario Presupuesto
  const [selectedCat, setSelectedCat] = useState(CATEGORIES[0]);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { localStorage.setItem('presupuesto_personal_local', JSON.stringify(txs)); }, [txs]);
  useEffect(() => { localStorage.setItem('savings_goals_local', JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem('debts_local', JSON.stringify(debts)); }, [debts]);
  useEffect(() => { localStorage.setItem('budget_name', budgetName); }, [budgetName]);
  useEffect(() => { localStorage.setItem('budget_date', budgetDate); }, [budgetDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
    if (isNaN(cleanAmount) || cleanAmount <= 0) return;

    if (editingId) {
      setTxs(txs.map(t => t.id === editingId ? {
        ...t, month: currentMonth, category: selectedCat.name, type: selectedCat.type as 'income' | 'expense', desc: desc || selectedCat.name, amount: cleanAmount,
      } : t));
      setEditingId(null);
    } else {
      setTxs([{ id: Date.now().toString(), month: currentMonth, category: selectedCat.name, type: selectedCat.type as 'income' | 'expense', desc: desc || selectedCat.name, amount: cleanAmount }, ...txs]);
    }
    setDesc(''); setAmount(''); setSelectedCat(CATEGORIES[0]);
  };

  const startEdit = (t: Transaction) => {
    setEditingId(t.id);
    setCurrentMonth(t.month);
    setSelectedCat(CATEGORIES.find(c => c.name === t.category) || CATEGORIES[0]);
    setDesc(t.desc);
    setAmount(t.amount.toString());
  };

  const cancelEdit = () => { setEditingId(null); setDesc(''); setAmount(''); };
  const deleteTx = (id: string) => { if (editingId === id) cancelEdit(); setTxs(txs.filter(t => t.id !== id)); };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(newGoalTarget.replace(/\./g, '').replace(',', '.'));
    const current = parseFloat((newGoalCurrent || '0').replace(/\./g, '').replace(',', '.'));
    if (!newGoalName || isNaN(target) || target <= 0) return;

    if (editingGoalId) {
      setGoals(goals.map(g => g.id === editingGoalId ? { ...g, name: newGoalName, targetAmount: target, currentAmount: isNaN(current) ? 0 : current } : g));
      setEditingGoalId(null);
    } else {
      setGoals([...goals, { id: Date.now().toString(), name: newGoalName, targetAmount: target, currentAmount: isNaN(current) ? 0 : current }]);
    }
    setNewGoalName(''); setNewGoalTarget(''); setNewGoalCurrent('');
  };

  const startEditGoal = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setNewGoalName(goal.name);
    setNewGoalTarget(goal.targetAmount.toString());
    setNewGoalCurrent(goal.currentAmount.toString());
  };
  const cancelGoalEdit = () => { setEditingGoalId(null); setNewGoalName(''); setNewGoalTarget(''); setNewGoalCurrent(''); };
  const deleteGoal = (id: string) => { if (editingGoalId === id) cancelGoalEdit(); setGoals(goals.filter(g => g.id !== id)); };

  const handleDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(newDebtTotal.replace(/\./g, '').replace(',', '.'));
    const paid = parseFloat((newDebtPaid || '0').replace(/\./g, '').replace(',', '.'));
    const monthly = parseFloat((newDebtMonthly || '0').replace(/\./g, '').replace(',', '.'));
    
    if (!newDebtName || isNaN(total) || total <= 0) return;

    if (editingDebtId) {
      setDebts(debts.map(d => d.id === editingDebtId ? { ...d, name: newDebtName, totalAmount: total, paidAmount: isNaN(paid) ? 0 : paid, monthlyPayment: isNaN(monthly) ? 0 : monthly, totalInstallments: newDebtTotalInst, paidInstallments: newDebtPaidInst, dueDate: newDebtDueDate } : d));
      setEditingDebtId(null);
    } else {
      setDebts([...debts, { id: Date.now().toString(), name: newDebtName, totalAmount: total, paidAmount: isNaN(paid) ? 0 : paid, monthlyPayment: isNaN(monthly) ? 0 : monthly, totalInstallments: newDebtTotalInst, paidInstallments: newDebtPaidInst, dueDate: newDebtDueDate }]);
    }
    setNewDebtName(''); setNewDebtTotal(''); setNewDebtPaid(''); setNewDebtMonthly(''); setNewDebtTotalInst(12); setNewDebtPaidInst(0); setNewDebtDueDate(DUE_DATE_OPTIONS[3]);
  };

  const startEditDebt = (debt: Debt) => {
    setEditingDebtId(debt.id);
    setNewDebtName(debt.name);
    setNewDebtTotal(debt.totalAmount.toString());
    setNewDebtPaid(debt.paidAmount.toString());
    setNewDebtMonthly(debt.monthlyPayment.toString());
    setNewDebtTotalInst(debt.totalInstallments);
    setNewDebtPaidInst(debt.paidInstallments);
    setNewDebtDueDate(debt.dueDate);
  };
  const cancelDebtEdit = () => { setEditingDebtId(null); setNewDebtName(''); setNewDebtTotal(''); setNewDebtPaid(''); setNewDebtMonthly(''); setNewDebtTotalInst(12); setNewDebtPaidInst(0); setNewDebtDueDate(DUE_DATE_OPTIONS[3]); };
  const deleteDebt = (id: string) => { if (editingDebtId === id) cancelDebtEdit(); setDebts(debts.filter(d => d.id !== id)); };

  const exportData = () => {
    const backup = { budgetName, budgetDate, txs, goals, debts };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `presupuesto_${budgetName.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = event => {
        try {
          const parsedData = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsedData)) {
            setTxs(parsedData);
          } else if (parsedData) {
            if (Array.isArray(parsedData.txs)) setTxs(parsedData.txs);
            if (Array.isArray(parsedData.goals)) setGoals(parsedData.goals);
            if (Array.isArray(parsedData.debts)) setDebts(parsedData.debts);
            if (parsedData.budgetName) setBudgetName(parsedData.budgetName);
            if (parsedData.budgetDate) setBudgetDate(parsedData.budgetDate);
          }
          alert('¡Datos cargados con éxito!');
        } catch { alert('Error al leer el archivo.'); }
      };
    }
  };

  const formatCOP = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  const monthTxs = txs.filter(t => t.month === currentMonth);
  const totalIncome = monthTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalGastosMes = monthTxs.filter(t => t.type === 'expense' && t.category !== 'Ahorro' && t.category !== 'Fondo de emergencia' && t.category !== 'Suscripciones' && !t.category.includes('Deudas') && !t.category.includes('financiad')).reduce((acc, t) => acc + t.amount, 0);
  const totalAhorrosMes = monthTxs.filter(t => t.type === 'expense' && (t.category === 'Ahorro' || t.category === 'Fondo de emergencia')).reduce((acc, t) => acc + t.amount, 0);
  const totalDeudasMes = monthTxs.filter(t => t.type === 'expense' && (t.category === 'Suscripciones' || t.category.includes('Deudas') || t.category.includes('financiad'))).reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = totalGastosMes + totalAhorrosMes + totalDeudasMes;
  const balance = totalIncome - totalExpense;
  const porcentajeAFavor = totalIncome > 0 ? Math.max(0, (balance / totalIncome) * 100) : 0;

  const getModalTransactions = () => {
    if (modalType === 'Ingresos') return monthTxs.filter(t => t.type === 'income');
    if (modalType === 'Gastos') return monthTxs.filter(t => t.type === 'expense' && t.category !== 'Ahorro' && t.category !== 'Fondo de emergencia' && t.category !== 'Suscripciones' && !t.category.includes('Deudas') && !t.category.includes('financiad'));
    if (modalType === 'Ahorros') return monthTxs.filter(t => t.type === 'expense' && (t.category === 'Ahorro' || t.category === 'Fondo de emergencia'));
    if (modalType === 'Deudas Mes') return monthTxs.filter(t => t.type === 'expense' && (t.category === 'Suscripciones' || t.category.includes('Deudas') || t.category.includes('financiad')));
    return [];
  };

  const totalHistoricoAhorros = txs.filter(t => t.category === 'Ahorro').reduce((acc, t) => acc + t.amount, 0);
  const totalHistoricoEmergencia = txs.filter(t => t.category === 'Fondo de emergencia').reduce((acc, t) => acc + t.amount, 0);
  const totalDeudaReal = debts.reduce((acc, d) => acc + d.totalAmount, 0);
  const totalPagadoDeudas = debts.reduce((acc, d) => acc + d.paidAmount, 0);
  const totalPendienteDeudas = totalDeudaReal - totalPagadoDeudas;

  const annualSummary = MONTHS.map(m => {
    const mItems = txs.filter(t => t.month === m);
    const inc = mItems.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const exp = mItems.filter(t => t.type === 'expense' && t.category !== 'Ahorro' && t.category !== 'Fondo de emergencia' && t.category !== 'Suscripciones' && !t.category.includes('Deudas') && !t.category.includes('financiad')).reduce((acc, t) => acc + t.amount, 0);
    const sav = mItems.filter(t => t.type === 'expense' && (t.category === 'Ahorro' || t.category === 'Fondo de emergencia')).reduce((acc, t) => acc + t.amount, 0);
    const deb = mItems.filter(t => t.type === 'expense' && (t.category === 'Suscripciones' || t.category.includes('Deudas') || t.category.includes('financiad'))).reduce((acc, t) => acc + t.amount, 0);
    return { month: m, income: inc, expense: exp, savings: sav, debts: deb, net: inc - (exp + sav + deb) };
  });

  const grandAnnualIncome = annualSummary.reduce((acc, cur) => acc + cur.income, 0);
  const grandAnnualExpense = annualSummary.reduce((acc, cur) => acc + cur.expense, 0);
  const grandAnnualSavings = annualSummary.reduce((acc, cur) => acc + cur.savings, 0);
  const grandAnnualDebts = annualSummary.reduce((acc, cur) => acc + cur.debts, 0);
  const grandAnnualNet = annualSummary.reduce((acc, cur) => acc + cur.net, 0);

  return (
    <div className="max-w-md mx-auto p-3 sm:p-4 bg-gray-50 min-h-screen font-sans relative pb-12">
      
      {/* Cabecera Personalizable Optimizada para Móvil */}
      <div className="bg-white p-3.5 rounded-2xl shadow-sm mb-3 flex flex-col gap-2 border border-gray-100">
        <input
          type="text"
          value={budgetName}
          onChange={e => setBudgetName(e.target.value)}
          placeholder="Nombre del Presupuesto"
          className="text-base sm:text-lg font-bold text-gray-800 border-b pb-1 outline-none focus:border-blue-500 bg-transparent"
        />
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Periodo:</span>
          <input
            type="text"
            value={budgetDate}
            onChange={e => setBudgetDate(e.target.value)}
            placeholder="Ej. Año 2026"
            className="font-semibold text-gray-700 border rounded-lg px-2 py-1 outline-none focus:border-blue-500 w-28 text-right bg-gray-50"
          />
        </div>
      </div>

      {/* Navegación por Pestañas (Grid Adaptado a Móvil) */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() => setActiveTab('budget')}
          className={`py-2.5 px-2 rounded-xl font-bold text-xs shadow-sm transition-all ${activeTab === 'budget' ? 'bg-blue-600 text-white shadow-blue-200 shadow-md' : 'bg-white text-gray-700 border border-gray-100'}`}
        >
          📊 Presupuesto
        </button>
        <button
          onClick={() => setActiveTab('savings')}
          className={`py-2.5 px-2 rounded-xl font-bold text-xs shadow-sm transition-all ${activeTab === 'savings' ? 'bg-emerald-600 text-white shadow-emerald-200 shadow-md' : 'bg-white text-gray-700 border border-gray-100'}`}
        >
          🎯 Ahorros
        </button>
        <button
          onClick={() => setActiveTab('debts')}
          className={`py-2.5 px-2 rounded-xl font-bold text-xs shadow-sm transition-all ${activeTab === 'debts' ? 'bg-orange-600 text-white shadow-orange-200 shadow-md' : 'bg-white text-gray-700 border border-gray-100'}`}
        >
          💳 Deudas Reales
        </button>
        <button
          onClick={() => setActiveTab('annual')}
          className={`py-2.5 px-2 rounded-xl font-bold text-xs shadow-sm transition-all ${activeTab === 'annual' ? 'bg-purple-600 text-white shadow-purple-200 shadow-md' : 'bg-white text-gray-700 border border-gray-100'}`}
        >
          📈 Resumen Anual
        </button>
      </div>

      {/* Botones de Respaldo y Restauración Compactos */}
      <div className="flex gap-2 mb-4">
        <button onClick={exportData} className="flex-1 bg-gray-800 text-white py-2 px-3 rounded-xl text-xs font-semibold shadow-sm active:scale-95 transition-transform">
          📥 Guardar Respaldo
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-gray-700 text-white py-2 px-3 rounded-xl text-xs font-semibold shadow-sm active:scale-95 transition-transform">
          📂 Abrir Archivo
        </button>
        <input type="file" ref={fileInputRef} onChange={importData} accept=".json" className="hidden" />
      </div>

      {activeTab === 'budget' ? (
        <>
          {/* Selector de Mes */}
          <div className="mb-4">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Seleccionar Mes:</label>
            <select
              value={currentMonth}
              onChange={e => setCurrentMonth(e.target.value)}
              className="w-full p-3 border rounded-xl bg-white font-bold text-gray-800 shadow-sm outline-none text-sm border-gray-200"
            >
              {MONTHS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Tarjetas de Resumen Interactivas (Distribución Móvil 2x2 + 1) */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div 
              onClick={() => setModalType('Ingresos')}
              className="bg-white p-3 rounded-xl shadow-sm text-center border border-gray-100 cursor-pointer active:bg-green-50 transition-colors"
            >
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Ingresos (Ver 🔍)</p>
              <p className="text-sm font-bold text-green-600 mt-1 truncate">{formatCOP(totalIncome)}</p>
            </div>
            <div 
              onClick={() => setModalType('Gastos')}
              className="bg-white p-3 rounded-xl shadow-sm text-center border border-gray-100 cursor-pointer active:bg-red-50 transition-colors"
            >
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Gastos (Ver 🔍)</p>
              <p className="text-sm font-bold text-red-600 mt-1 truncate">{formatCOP(totalGastosMes)}</p>
            </div>
            <div 
              onClick={() => setModalType('Ahorros')}
              className="bg-white p-3 rounded-xl shadow-sm text-center border border-gray-100 cursor-pointer active:bg-emerald-50 transition-colors"
            >
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Ahorros (Ver 🔍)</p>
              <p className="text-sm font-bold text-emerald-600 mt-1 truncate">{formatCOP(totalAhorrosMes)}</p>
            </div>
            <div 
              onClick={() => setModalType('Deudas Mes')}
              className="bg-white p-3 rounded-xl shadow-sm text-center border border-gray-100 cursor-pointer active:bg-orange-50 transition-colors"
            >
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Deudas Mes (Ver 🔍)</p>
              <p className="text-sm font-bold text-orange-600 mt-1 truncate">{formatCOP(totalDeudasMes)}</p>
            </div>
          </div>
          
          <div className="bg-blue-600 text-white p-3 rounded-xl shadow-sm text-center mb-5 flex justify-between items-center px-4">
            <span className="text-xs font-medium opacity-90">% a Favor del Mes:</span>
            <span className="text-base font-bold">{porcentajeAFavor.toFixed(1)}%</span>
          </div>

          {/* Formulario de Ingreso / Edición Optimizada */}
          <form onSubmit={handleSubmit} className={`bg-white p-4 rounded-2xl shadow-sm mb-5 flex flex-col gap-3 border ${editingId ? 'border-blue-500 bg-blue-50/10' : 'border-gray-100'}`}>
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                {editingId ? 'Editando Movimiento' : `Nuevo Movimiento (${currentMonth})`}
              </label>
              {editingId && (
                <button type="button" onClick={cancelEdit} className="text-xs text-red-500 font-bold underline">
                  Cancelar
                </button>
              )}
            </div>

            <select
              value={selectedCat.name}
              onChange={e => {
                const cat = CATEGORIES.find(c => c.name === e.target.value);
                if (cat) setSelectedCat(cat);
              }}
              className="p-3 border rounded-xl text-sm bg-white font-medium text-gray-800 outline-none border-gray-200"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.name} value={cat.name}>
                  {cat.name} ({cat.type === 'income' ? 'Ingreso' : 'Destino'})
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Detalle (ej. Quincena, Netflix...)"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="p-3 border rounded-xl text-sm text-gray-800 outline-none border-gray-200"
            />

            <input
              type="text"
              inputMode="numeric"
              placeholder="Monto en COP"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="p-3 border rounded-xl text-sm text-gray-800 outline-none font-medium border-gray-200"
            />

            <button type="submit" className={`py-3.5 rounded-xl font-bold text-sm shadow-sm text-white active:scale-95 transition-transform ${editingId ? 'bg-green-600' : 'bg-blue-600'}`}>
              {editingId ? 'Actualizar Movimiento' : `Añadir a ${currentMonth}`}
            </button>
          </form>

          {/* Tabla de Registros */}
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Registros de {currentMonth}</h2>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4 border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[300px]">
                <thead>
                  <tr className="border-b bg-gray-50 text-[10px] text-gray-400 uppercase">
                    <th className="p-3">Categoría / Detalle</th>
                    <th className="p-3">Monto</th>
                    <th className="p-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {monthTxs.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-gray-400">Sin registros para {currentMonth}</td>
                    </tr>
                  )}
                  {monthTxs.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="p-3">
                        <span className="font-bold text-gray-800 block">{t.category}</span>
                        <span className="text-gray-400 text-[11px]">{t.desc}</span>
                      </td>
                      <td className={`p-3 font-bold whitespace-nowrap ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCOP(t.amount)}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <button onClick={() => startEdit(t)} className="text-blue-500 font-bold px-2 py-1 bg-blue-50 rounded-lg mr-1 text-[11px]">Editar</button>
                        <button onClick={() => deleteTx(t.id)} className="text-red-400 font-bold px-2 py-1 bg-red-50 rounded-lg text-[11px]">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Balance Final del Mes */}
          <div className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center border border-gray-100">
            <span className="text-xs font-bold text-gray-600 uppercase">Balance Neto ({currentMonth}):</span>
            <span className={`text-base font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCOP(balance)}
            </span>
          </div>
        </>
      ) : activeTab === 'savings' ? (
        <>
          <div className="grid grid-cols-1 gap-3 mb-5">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 text-center">
              <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider">Total Ahorrado (Histórico)</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">{formatCOP(totalHistoricoAhorros)}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-amber-100 text-center">
              <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider">Fondo de Emergencia</p>
              <p className="text-xl font-bold text-amber-600 mt-1">{formatCOP(totalHistoricoEmergencia)}</p>
            </div>
          </div>

          <form onSubmit={handleGoalSubmit} className={`bg-white p-4 rounded-2xl shadow-sm mb-5 flex flex-col gap-3 border ${editingGoalId ? 'border-emerald-500 bg-emerald-50/10' : 'border-gray-100'}`}>
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">{editingGoalId ? 'Editando Meta' : 'Añadir Nueva Meta'}</label>
              {editingGoalId && <button type="button" onClick={cancelGoalEdit} className="text-xs text-red-500 font-bold underline">Cancelar</button>}
            </div>
            <input type="text" placeholder="Nombre de la meta (ej. Viaje...)" value={newGoalName} onChange={e => setNewGoalName(e.target.value)} className="p-3 border rounded-xl text-sm outline-none border-gray-200" />
            <input type="text" inputMode="numeric" placeholder="Monto objetivo total" value={newGoalTarget} onChange={e => setNewGoalTarget(e.target.value)} className="p-3 border rounded-xl text-sm outline-none font-medium border-gray-200" />
            <input type="text" inputMode="numeric" placeholder="Monto actual ahorrado" value={newGoalCurrent} onChange={e => setNewGoalCurrent(e.target.value)} className="p-3 border rounded-xl text-sm outline-none font-medium border-gray-200" />
            <button type="submit" className={`py-3.5 rounded-xl font-bold text-sm text-white active:scale-95 transition-transform ${editingGoalId ? 'bg-green-600' : 'bg-emerald-600'}`}>{editingGoalId ? 'Actualizar Meta' : 'Crear Meta'}</button>
          </form>

          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tus Metas y Objetivos</h2>
          <div className="flex flex-col gap-3 mb-5">
            {goals.length === 0 && <p className="text-sm text-gray-400 text-center py-6 bg-white rounded-2xl border border-gray-100">No hay metas creadas</p>}
            {goals.map(goal => {
              const progress = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
              return (
                <div key={goal.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800 text-sm">{goal.name}</span>
                    <div className="flex gap-1">
                      <button onClick={() => startEditGoal(goal)} className="text-emerald-600 text-[11px] font-bold px-2 py-1 bg-emerald-50 rounded-lg">Editar</button>
                      <button onClick={() => deleteGoal(goal.id)} className="text-red-400 text-[11px] font-bold px-2 py-1 bg-red-50 rounded-lg">✕</button>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Ahorrado: <strong className="text-emerald-600">{formatCOP(goal.currentAmount)}</strong></span>
                    <span>Meta: <strong>{formatCOP(goal.targetAmount)}</strong></span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${progress}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-400 pt-1">
                    <span>{progress.toFixed(1)}% completado</span>
                    <div className="flex gap-1.5">
                      <button onClick={() => setGoals(goals.map(g => g.id === goal.id ? { ...g, currentAmount: g.currentAmount + 50000 } : g))} className="px-2 py-1 bg-gray-50 border rounded-lg font-bold text-gray-700 text-[11px]">+ $50k</button>
                      <button onClick={() => setGoals(goals.map(g => g.id === goal.id ? { ...g, currentAmount: g.currentAmount + 200000 } : g))} className="px-2 py-1 bg-gray-50 border rounded-lg font-bold text-gray-700 text-[11px]">+ $200k</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : activeTab === 'debts' ? (
        <>
          <div className="grid grid-cols-1 gap-2 mb-4">
            <div className="bg-white p-3 rounded-xl shadow-sm text-center border border-gray-100 flex justify-between items-center px-4"><span className="text-xs text-gray-400 font-semibold uppercase">Deuda Total Inicial</span><strong className="text-sm font-bold text-gray-800">{formatCOP(totalDeudaReal)}</strong></div>
            <div className="bg-white p-3 rounded-xl shadow-sm text-center border border-gray-100 flex justify-between items-center px-4"><span className="text-xs text-gray-400 font-semibold uppercase">Total Pagado</span><strong className="text-sm font-bold text-emerald-600">{formatCOP(totalPagadoDeudas)}</strong></div>
            <div className="bg-white p-3 rounded-xl shadow-sm text-center border border-gray-100 flex justify-between items-center px-4"><span className="text-xs text-gray-400 font-semibold uppercase">Saldo Pendiente</span><strong className="text-sm font-bold text-red-600">{formatCOP(totalPendienteDeudas)}</strong></div>
          </div>

          <form onSubmit={handleDebtSubmit} className={`bg-white p-4 rounded-2xl shadow-sm mb-5 flex flex-col gap-3 border ${editingDebtId ? 'border-orange-500 bg-orange-50/10' : 'border-gray-100'}`}>
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">{editingDebtId ? 'Editando Deuda' : 'Nueva Deuda'}</label>
              {editingDebtId && <button type="button" onClick={cancelDebtEdit} className="text-xs text-red-500 font-bold underline">Cancelar</button>}
            </div>
            <input type="text" placeholder="Nombre (ej. Tarjeta de Crédito...)" value={newDebtName} onChange={e => setNewDebtName(e.target.value)} className="p-3 border rounded-xl text-sm outline-none border-gray-200" />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" inputMode="numeric" placeholder="Monto Total" value={newDebtTotal} onChange={e => setNewDebtTotal(e.target.value)} className="p-3 border rounded-xl text-sm outline-none border-gray-200" />
              <input type="text" inputMode="numeric" placeholder="Monto Pagado" value={newDebtPaid} onChange={e => setNewDebtPaid(e.target.value)} className="p-3 border rounded-xl text-sm outline-none border-gray-200" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input type="text" inputMode="numeric" placeholder="Cuota" value={newDebtMonthly} onChange={e => setNewDebtMonthly(e.target.value)} className="p-3 border rounded-xl text-sm outline-none border-gray-200" />
              <select value={newDebtTotalInst} onChange={e => setNewDebtTotalInst(parseInt(e.target.value))} className="p-3 border rounded-xl text-xs bg-white outline-none border-gray-200">
                {INSTALLMENT_OPTIONS.map(n => <option key={n} value={n}>{n} cuotas</option>)}
              </select>
              <select value={newDebtPaidInst} onChange={e => setNewDebtPaidInst(parseInt(e.target.value))} className="p-3 border rounded-xl text-xs bg-white outline-none border-gray-200">
                {Array.from({ length: newDebtTotalInst + 1 }, (_, i) => i).map(n => <option key={n} value={n}>{n} pag.</option>)}
              </select>
            </div>
            <select value={newDebtDueDate} onChange={e => setNewDebtDueDate(e.target.value)} className="p-3 border rounded-xl text-sm bg-white outline-none border-gray-200">
              {DUE_DATE_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <button type="submit" className={`py-3.5 rounded-xl font-bold text-sm text-white active:scale-95 transition-transform ${editingDebtId ? 'bg-green-600' : 'bg-orange-600'}`}>{editingDebtId ? 'Actualizar Deuda' : 'Guardar Deuda'}</button>
          </form>

          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Control de Deudas</h2>
          <div className="flex flex-col gap-3 mb-5">
            {debts.length === 0 && <p className="text-sm text-gray-400 text-center py-6 bg-white rounded-2xl border border-gray-100">No hay deudas registradas</p>}
            {debts.map(debt => {
              const remaining = Math.max(0, debt.totalAmount - debt.paidAmount);
              const remainingInstallments = Math.max(0, debt.totalInstallments - debt.paidInstallments);
              const progress = debt.totalAmount > 0 ? Math.min(100, (debt.paidAmount / debt.totalAmount) * 100) : 0;
              const isPaidOff = remaining === 0 || remainingInstallments === 0;

              return (
                <div key={debt.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-gray-800 text-sm block">{debt.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${isPaidOff ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {isPaidOff ? '¡Deuda Cancelada! 🎉' : `Faltan ${remainingInstallments} cuotas`}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => startEditDebt(debt)} className="text-orange-600 text-[11px] font-bold px-2 py-1 bg-orange-50 rounded-lg">Editar</button>
                      <button onClick={() => deleteDebt(debt.id)} className="text-red-400 text-[11px] font-bold px-2 py-1 bg-red-50 rounded-lg">✕</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-xl gap-2 border border-gray-100">
                    <div>Total: <strong className="text-gray-800 block">{formatCOP(debt.totalAmount)}</strong></div>
                    <div>Pagado: <strong className="text-emerald-600 block">{formatCOP(debt.paidAmount)}</strong></div>
                    <div>Cuota: <strong className="text-blue-600 block">{formatCOP(debt.monthlyPayment)}</strong></div>
                    <div>Plazo: <strong className="text-purple-600 block">{debt.paidInstallments}/{debt.totalInstallments} pagadas</strong></div>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${progress}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>{progress.toFixed(1)}% pagado</span>
                    <button onClick={() => {
                      const nextInst = Math.min(debt.totalInstallments, debt.paidInstallments + 1);
                      const nextAmt = Math.min(debt.totalAmount, debt.paidAmount + debt.monthlyPayment);
                      setDebts(debts.map(d => d.id === debt.id ? { ...d, paidAmount: nextAmt, paidInstallments: nextInst } : d));
                    }} className="px-3 py-1.5 bg-gray-900 text-white rounded-xl font-bold text-xs active:scale-95 transition-transform">+ Pagar Cuota</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4">
            <h2 className="text-sm font-bold text-gray-800 mb-1">Balance Anual ({budgetDate})</h2>
            <p className="text-[11px] text-gray-400 mb-3">Comportamiento financiero acumulado del año.</p>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-green-50 p-3 rounded-xl text-center border border-green-100"><p className="text-[10px] text-gray-400 font-bold uppercase">Ingresos</p><p className="text-xs font-bold text-green-600 mt-1">{formatCOP(grandAnnualIncome)}</p></div>
              <div className="bg-red-50 p-3 rounded-xl text-center border border-red-100"><p className="text-[10px] text-gray-400 font-bold uppercase">Gastos</p><p className="text-xs font-bold text-red-600 mt-1">{formatCOP(grandAnnualExpense)}</p></div>
              <div className="bg-emerald-50 p-3 rounded-xl text-center border border-emerald-100"><p className="text-[10px] text-gray-400 font-bold uppercase">Ahorros</p><p className="text-xs font-bold text-emerald-600 mt-1">{formatCOP(grandAnnualSavings)}</p></div>
              <div className="bg-orange-50 p-3 rounded-xl text-center border border-orange-100"><p className="text-[10px] text-gray-400 font-bold uppercase">Deudas</p><p className="text-xs font-bold text-orange-600 mt-1">{formatCOP(grandAnnualDebts)}</p></div>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl text-center border border-blue-100 mt-2"><p className="text-[10px] text-gray-400 font-bold uppercase">Neto Anual</p><p className={`text-sm font-bold mt-1 ${grandAnnualNet >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCOP(grandAnnualNet)}</p></div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4 border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[320px]">
                <thead>
                  <tr className="border-b bg-gray-50 text-[10px] text-gray-400 uppercase">
                    <th className="p-3">Mes</th>
                    <th className="p-3">Ingresos</th>
                    <th className="p-3">Gastos</th>
                    <th className="p-3">Neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {annualSummary.map(row => (
                    <tr key={row.month} className="hover:bg-gray-50">
                      <td className="p-3 font-bold text-gray-800">{row.month}</td>
                      <td className="p-3 font-semibold text-green-600">{formatCOP(row.income)}</td>
                      <td className="p-3 font-semibold text-red-600">{formatCOP(row.expense)}</td>
                      <td className={`p-3 font-bold ${row.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCOP(row.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal / Ventana Detallada Móvil */}
      {modalType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-3 border-b pb-2">
              <h3 className="font-bold text-gray-800 text-sm">
                Detalle de <span className="text-blue-600">{modalType}</span> ({currentMonth})
              </h3>
              <button 
                onClick={() => setModalType(null)} 
                className="text-gray-400 font-bold text-base px-2 py-0.5 rounded-lg bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-gray-100 text-xs">
              {getModalTransactions().length === 0 ? (
                <p className="text-center text-gray-400 py-6">No hay registros en esta categoría.</p>
              ) : (
                getModalTransactions().map(item => (
                  <div key={item.id} className="py-2.5 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{item.category}</p>
                      <p className="font-medium text-gray-800">{item.desc}</p>
                    </div>
                    <span className={`font-bold ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {item.type === 'income' ? '+' : '-'}{formatCOP(item.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 pt-3 border-t flex justify-between items-center text-xs">
              <span className="font-semibold text-gray-500">Total:</span>
              <span className="font-bold text-gray-800 text-sm">
                {formatCOP(
                  modalType === 'Ingresos' ? totalIncome :
                  modalType === 'Gastos' ? totalGastosMes :
                  modalType === 'Ahorros' ? totalAhorrosMes : totalDeudasMes
                )}
              </span>
            </div>

            <button
              onClick={() => setModalType(null)}
              className="mt-3 w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-transform"
            >
              Cerrar Detalle
            </button>
          </div>
        </div>
      )}

    </div>
  );
}