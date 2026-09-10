import React, { useState, useEffect, useRef, useMemo } from 'react';

interface Transaction {
  id: string;
  month: string;
  category: string;
  type: 'income' | 'expense';
  desc: string;
  amount: number;
  paid?: boolean;
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

interface CustomCategory {
  name: string;
  type: 'income' | 'expense';
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DEFAULT_CATEGORIES: CustomCategory[] = [
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
  const [activeTab, setActiveTab] = useState<'budget' | 'savings' | 'debts' | 'annual' | 'settings'>('budget');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('dark_mode') === 'true');
  const [budgetName, setBudgetName] = useState(() => localStorage.getItem('budget_name') || 'Mi Presupuesto');
  const [budgetDate, setBudgetDate] = useState(() => localStorage.getItem('budget_date') || '2026');
  const [currentMonth, setCurrentMonth] = useState('Septiembre');

  const [savedPin, setSavedPin] = useState(() => localStorage.getItem('app_pin') || '');
  const [enteredPin, setEnteredPin] = useState('');
  const [isLocked, setIsLocked] = useState(() => !!localStorage.getItem('app_pin'));

  const [categories, setCategories] = useState<CustomCategory[]>(() => {
    const saved = localStorage.getItem('custom_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
  
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

  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalCurrent, setNewGoalCurrent] = useState('');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  const [newDebtName, setNewDebtName] = useState('');
  const [newDebtTotal, setNewDebtTotal] = useState('');
  const [newDebtPaid, setNewDebtPaid] = useState('');
  const [newDebtMonthly, setNewDebtMonthly] = useState('');
  const [newDebtTotalInst, setNewDebtTotalInst] = useState(12);
  const [newDebtPaidInst, setNewDebtPaidInst] = useState(0);
  const [newDebtDueDate, setNewDebtDueDate] = useState(DUE_DATE_OPTIONS[3]);
  const [editingDebtId, setEditingDebtId] = useState<string | null>(null);
  
  const [selectedCat, setSelectedCat] = useState<CustomCategory>(categories[0]);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { localStorage.setItem('presupuesto_personal_local', JSON.stringify(txs)); }, [txs]);
  useEffect(() => { localStorage.setItem('savings_goals_local', JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem('debts_local', JSON.stringify(debts)); }, [debts]);
  useEffect(() => { localStorage.setItem('budget_name', budgetName); }, [budgetName]);
  useEffect(() => { localStorage.setItem('budget_date', budgetDate); }, [budgetDate]);
  useEffect(() => { localStorage.setItem('dark_mode', String(darkMode)); }, [darkMode]);
  useEffect(() => { localStorage.setItem('custom_categories', JSON.stringify(categories)); }, [categories]);

  const formatInputCurrency = (value: string) => {
    const cleanNum = value.replace(/\D/g, '');
    if (!cleanNum) return '';
    return new Intl.NumberFormat('es-CO').format(parseInt(cleanNum, 10));
  };

  const parseCurrency = (value: string) => {
    const clean = value.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const handleSetPin = (pinValue: string) => {
    if (pinValue.length === 4) {
      localStorage.setItem('app_pin', pinValue);
      setSavedPin(pinValue);
      alert('¡PIN de seguridad configurado con éxito!');
    } else {
      localStorage.removeItem('app_pin');
      setSavedPin('');
      alert('PIN desactivado.');
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === savedPin) {
      setIsLocked(false);
      setEnteredPin('');
    } else {
      alert('PIN incorrecto');
      setEnteredPin('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseCurrency(amount);
    if (cleanAmount <= 0) return;

    if (editingId) {
      setTxs(txs.map(t => t.id === editingId ? {
        ...t, month: currentMonth, category: selectedCat.name, type: selectedCat.type, desc: desc || selectedCat.name, amount: cleanAmount,
      } : t));
      setEditingId(null);
    } else {
      setTxs([{ id: Date.now().toString(), month: currentMonth, category: selectedCat.name, type: selectedCat.type, desc: desc || selectedCat.name, amount: cleanAmount, paid: false }, ...txs]);
    }
    setDesc(''); setAmount(''); setSelectedCat(categories[0]);
  };

  const togglePaidStatus = (id: string) => {
    setTxs(txs.map(t => t.id === id ? { ...t, paid: !t.paid } : t));
  };

  const startEdit = (t: Transaction) => {
    setEditingId(t.id);
    setCurrentMonth(t.month);
    setSelectedCat(categories.find(c => c.name === t.category) || categories[0]);
    setDesc(t.desc);
    setAmount(formatInputCurrency(t.amount.toString()));
  };

  const cancelEdit = () => { setEditingId(null); setDesc(''); setAmount(''); };
  const deleteTx = (id: string) => { if (editingId === id) cancelEdit(); setTxs(txs.filter(t => t.id !== id)); };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    if (categories.some(c => c.name.toLowerCase() === newCatName.trim().toLowerCase())) {
      alert('Esta categoría ya existe.');
      return;
    }
    setCategories([...categories, { name: newCatName.trim(), type: newCatType }]);
    setNewCatName('');
    alert('¡Categoría creada con éxito!');
  };

  const handleDeleteCategory = (catName: string) => {
    if (categories.length <= 2) {
      alert('Debes mantener al menos algunas categorías.');
      return;
    }
    setCategories(categories.filter(c => c.name !== catName));
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseCurrency(newGoalTarget);
    const current = parseCurrency(newGoalCurrent);
    if (!newGoalName || target <= 0) return;

    if (editingGoalId) {
      setGoals(goals.map(g => g.id === editingGoalId ? { ...g, name: newGoalName, targetAmount: target, currentAmount: current } : g));
      setEditingGoalId(null);
    } else {
      setGoals([...goals, { id: Date.now().toString(), name: newGoalName, targetAmount: target, currentAmount: current }]);
    }
    setNewGoalName(''); setNewGoalTarget(''); setNewGoalCurrent('');
  };

  const startEditGoal = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setNewGoalName(goal.name);
    setNewGoalTarget(formatInputCurrency(goal.targetAmount.toString()));
    setNewGoalCurrent(formatInputCurrency(goal.currentAmount.toString()));
  };
  const cancelGoalEdit = () => { setEditingGoalId(null); setNewGoalName(''); setNewGoalTarget(''); setNewGoalCurrent(''); };
  const deleteGoal = (id: string) => { if (editingGoalId === id) cancelGoalEdit(); setGoals(goals.filter(g => g.id !== id)); };

  const handleDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseCurrency(newDebtTotal);
    const paid = parseCurrency(newDebtPaid);
    const monthly = parseCurrency(newDebtMonthly);
    
    if (!newDebtName || total <= 0) return;

    if (editingDebtId) {
      setDebts(debts.map(d => d.id === editingDebtId ? { ...d, name: newDebtName, totalAmount: total, paidAmount: paid, monthlyPayment: monthly, totalInstallments: newDebtTotalInst, paidInstallments: newDebtPaidInst, dueDate: newDebtDueDate } : d));
      setEditingDebtId(null);
    } else {
      setDebts([...debts, { id: Date.now().toString(), name: newDebtName, totalAmount: total, paidAmount: paid, monthlyPayment: monthly, totalInstallments: newDebtTotalInst, paidInstallments: newDebtPaidInst, dueDate: newDebtDueDate }]);
    }
    setNewDebtName(''); setNewDebtTotal(''); setNewDebtPaid(''); setNewDebtMonthly(''); setNewDebtTotalInst(12); setNewDebtPaidInst(0); setNewDebtDueDate(DUE_DATE_OPTIONS[3]);
  };

  const startEditDebt = (debt: Debt) => {
    setEditingDebtId(debt.id);
    setNewDebtName(debt.name);
    setNewDebtTotal(formatInputCurrency(debt.totalAmount.toString()));
    setNewDebtPaid(formatInputCurrency(debt.paidAmount.toString()));
    setNewDebtMonthly(formatInputCurrency(debt.monthlyPayment.toString()));
    setNewDebtTotalInst(debt.totalInstallments);
    setNewDebtPaidInst(debt.paidInstallments);
    setNewDebtDueDate(debt.dueDate);
  };
  const cancelDebtEdit = () => { setEditingDebtId(null); setNewDebtName(''); setNewDebtTotal(''); setNewDebtPaid(''); setNewDebtMonthly(''); setNewDebtTotalInst(12); setNewDebtPaidInst(0); setNewDebtDueDate(DUE_DATE_OPTIONS[3]); };
  const deleteDebt = (id: string) => { if (editingDebtId === id) cancelDebtEdit(); setDebts(debts.filter(d => d.id !== id)); };

  const exportData = () => {
    const backup = { budgetName, budgetDate, txs, goals, debts, categories };
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
            if (Array.isArray(parsedData.categories)) setCategories(parsedData.categories);
            if (parsedData.budgetName) setBudgetName(parsedData.budgetName);
            if (parsedData.budgetDate) setBudgetDate(parsedData.budgetDate);
          }
          alert('¡Datos cargados con éxito!');
        } catch { alert('Error al leer el archivo.'); }
      };
    }
  };

  const formatCOP = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  const { monthTxs, totalIncome, totalGastosMes, totalAhorrosMes, totalDeudasMes, totalPagadoMes, totalPendienteMes, balance, porcentajeAFavor, expenseCategoriesBreakdown, filteredMonthTxs } = useMemo(() => {
    const mTxs = txs.filter(t => t.month === currentMonth);
    const tInc = mTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);

    const rGastos = mTxs.filter(t => t.type === 'expense' && t.category !== 'Ahorro' && t.category !== 'Fondo de emergencia' && t.category !== 'Suscripciones' && !t.category.includes('Deudas') && !t.category.includes('financiad'));
    const rAhorros = mTxs.filter(t => t.type === 'expense' && (t.category === 'Ahorro' || t.category === 'Fondo de emergencia'));
    const rDeudas = mTxs.filter(t => t.type === 'expense' && (t.category === 'Suscripciones' || t.category.includes('Deudas') || t.category.includes('financiad')));

    const tGastosM = rGastos.filter(t => !t.paid).reduce((acc, t) => acc + t.amount, 0);
    const tAhorrosM = rAhorros.filter(t => !t.paid).reduce((acc, t) => acc + t.amount, 0);
    const tDeudasM = rDeudas.filter(t => !t.paid).reduce((acc, t) => acc + t.amount, 0);
    
    const tPagadoM = mTxs.filter(t => t.type === 'expense' && t.paid).reduce((acc, t) => acc + t.amount, 0);
    const tPendienteM = tGastosM + tAhorrosM + tDeudasM;

    const paidExpenseTotal = rGastos.filter(t => t.paid).reduce((a, b) => a + b.amount, 0) +
                             rAhorros.filter(t => t.paid).reduce((a, b) => a + b.amount, 0) +
                             rDeudas.filter(t => t.paid).reduce((a, b) => a + b.amount, 0);

    const bal = tInc - (tGastosM + paidExpenseTotal + tAhorrosM + tDeudasM);
    const porc = tInc > 0 ? Math.max(0, (bal / tInc) * 100) : 0;

    const fTxs = mTxs.filter(t => {
      const matchesSearch = t.desc.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' ? true : statusFilter === 'paid' ? t.paid : !t.paid;
      return matchesSearch && matchesStatus;
    });

    const expBreakdown = rGastos.reduce((acc: { [key: string]: number }, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

    return {
      monthTxs: mTxs,
      totalIncome: tInc,
      totalGastosMes: tGastosM,
      totalAhorrosMes: tAhorrosM,
      totalDeudasMes: tDeudasM,
      totalPagadoMes: tPagadoM,
      totalPendienteMes: tPendienteM,
      balance: bal,
      porcentajeAFavor: porc,
      expenseCategoriesBreakdown: expBreakdown,
      filteredMonthTxs: fTxs
    };
  }, [txs, currentMonth, searchTerm, statusFilter]);

  const getModalTransactions = () => {
    if (modalType === 'Ingresos') return monthTxs.filter(t => t.type === 'income');
    if (modalType === 'Gastos') return monthTxs.filter(t => t.type === 'expense' && t.category !== 'Ahorro' && t.category !== 'Fondo de emergencia' && t.category !== 'Suscripciones' && !t.category.includes('Deudas') && !t.category.includes('financiad'));
    if (modalType === 'Ahorros') return monthTxs.filter(t => t.type === 'expense' && (t.category === 'Ahorro' || t.category === 'Fondo de emergencia'));
    if (modalType === 'Deudas Mes') return monthTxs.filter(t => t.type === 'expense' && (t.category === 'Suscripciones' || t.category.includes('Deudas') || t.category.includes('financiad')));
    return [];
  };

  const modalItems = getModalTransactions();
  const modalTotalBruto = modalItems.reduce((acc, item) => acc + item.amount, 0);
  const modalTotalPagado = modalItems.filter(item => item.paid).reduce((acc, item) => acc + item.amount, 0);
  const modalTotalPendiente = modalItems.filter(item => !item.paid).reduce((acc, item) => acc + item.amount, 0);

  const totalHistoricoAhorros = txs.filter(t => t.category === 'Ahorro').reduce((acc, t) => acc + t.amount, 0);
  const totalHistoricoEmergencia = txs.filter(t => t.category === 'Fondo de emergencia').reduce((acc, t) => acc + t.amount, 0);
  const totalDeudaReal = debts.reduce((acc, d) => acc + d.totalAmount, 0);
  const totalPagadoDeudas = debts.reduce((acc, d) => acc + d.paidAmount, 0);
  const totalPendienteDeudas = totalDeudaReal - totalPagadoDeudas;

  const annualSummary = useMemo(() => {
    return MONTHS.map(m => {
      const mItems = txs.filter(t => t.month === m);
      const inc = mItems.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const exp = mItems.filter(t => t.type === 'expense' && t.category !== 'Ahorro' && t.category !== 'Fondo de emergencia' && t.category !== 'Suscripciones' && !t.category.includes('Deudas') && !t.category.includes('financiad')).reduce((acc, t) => acc + t.amount, 0);
      const sav = mItems.filter(t => t.type === 'expense' && (t.category === 'Ahorro' || t.category === 'Fondo de emergencia')).reduce((acc, t) => acc + t.amount, 0);
      const deb = mItems.filter(t => t.type === 'expense' && (t.category === 'Suscripciones' || t.category.includes('Deudas') || t.category.includes('financiad'))).reduce((acc, t) => acc + t.amount, 0);
      return { month: m, income: inc, expense: exp, savings: sav, debts: deb, net: inc - (exp + sav + deb) };
    });
  }, [txs]);

  const grandAnnualIncome = annualSummary.reduce((acc, cur) => acc + cur.income, 0);
  const grandAnnualExpense = annualSummary.reduce((acc, cur) => acc + cur.expense, 0);
  const grandAnnualSavings = annualSummary.reduce((acc, cur) => acc + cur.savings, 0);
  const grandAnnualDebts = annualSummary.reduce((acc, cur) => acc + cur.debts, 0);
  const grandAnnualNet = annualSummary.reduce((acc, cur) => acc + cur.net, 0);

  const currentMonthIndex = MONTHS.indexOf(currentMonth);
  const prevMonthName = currentMonthIndex > 0 ? MONTHS[currentMonthIndex - 1] : null;
  const prevMonthTotalExpense = prevMonthName ? annualSummary.find(s => s.month === prevMonthName)?.expense || 0 : 0;
  const expenseDiffPercent = prevMonthTotalExpense > 0 ? ((totalGastosMes - prevMonthTotalExpense) / prevMonthTotalExpense) * 100 : 0;

  const todayDay = new Date().getDate();
  const getDebtAlert = (dueDateStr: string) => {
    if (dueDateStr.includes('Fin')) return false;
    const matchDay = parseInt(dueDateStr.split(' ')[0], 10);
    if (!isNaN(matchDay)) {
      const diff = matchDay - todayDay;
      return diff >= 0 && diff <= 3;
    }
    return false;
  };

  if (isLocked && savedPin) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 font-sans ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>
        <div className={`p-8 rounded-3xl shadow-2xl max-w-sm w-full border backdrop-blur-xl text-center ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/30">🔒</div>
          <h2 className="text-xl font-bold mb-1 tracking-tight">Acceso Seguro</h2>
          <p className="text-xs opacity-60 mb-6 font-medium">Ingresa tu PIN de 4 dígitos para gestionar tus finanzas.</p>
          <form onSubmit={handleUnlock} className="flex flex-col gap-4">
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={enteredPin}
              onChange={e => setEnteredPin(e.target.value)}
              className={`p-4 text-center text-3xl tracking-widest border rounded-2xl outline-none font-bold transition-all ${darkMode ? 'bg-slate-800/50 border-slate-700 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'}`}
              autoFocus
            />
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/30 active:scale-95 transition-all">
              Desbloquear App
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans relative pb-16 transition-colors duration-500 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      <div className="max-w-md mx-auto p-3 sm:p-5">
        
        <div className={`p-4 rounded-3xl shadow-sm mb-4 flex flex-col gap-3 border backdrop-blur-xl transition-all ${darkMode ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white/80 border-slate-200/80'}`}>
          <div className="flex justify-between items-center">
            <input
              type="text"
              value={budgetName}
              onChange={e => setBudgetName(e.target.value)}
              placeholder="Nombre del Presupuesto"
              className={`text-lg font-extrabold tracking-tight border-b pb-1 outline-none bg-transparent w-full transition-colors ${darkMode ? 'border-slate-700 text-white focus:border-indigo-500' : 'border-slate-200 text-slate-800 focus:border-indigo-500'}`}
            />
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`ml-3 p-2.5 rounded-2xl text-xs font-bold border transition-all active:scale-95 shadow-sm ${darkMode ? 'bg-slate-800/80 border-slate-700 text-amber-400 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
              title="Cambiar Modo"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
          <div className="flex justify-between items-center text-xs opacity-75 font-medium">
            <span>Periodo Fiscal:</span>
            <input
              type="text"
              value={budgetDate}
              onChange={e => setBudgetDate(e.target.value)}
              placeholder="Ej. Año 2026"
              className={`font-semibold border rounded-xl px-3 py-1.5 outline-none w-32 text-right transition-all ${darkMode ? 'bg-slate-800/50 border-slate-700 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-indigo-500'}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1.5 mb-4 p-1 rounded-2xl bg-slate-200/50 dark:bg-slate-900/50 border border-slate-200/30 dark:border-slate-800/30">
          <button
            onClick={() => setActiveTab('budget')}
            className={`py-2 px-1 rounded-xl font-bold text-[11px] transition-all ${activeTab === 'budget' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'opacity-70 hover:opacity-100'}`}
          >
            📊 Presup.
          </button>
          <button
            onClick={() => setActiveTab('savings')}
            className={`py-2 px-1 rounded-xl font-bold text-[11px] transition-all ${activeTab === 'savings' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30' : 'opacity-70 hover:opacity-100'}`}
          >
            🎯 Ahorros
          </button>
          <button
            onClick={() => setActiveTab('debts')}
            className={`py-2 px-1 rounded-xl font-bold text-[11px] transition-all ${activeTab === 'debts' ? 'bg-orange-600 text-white shadow-md shadow-orange-500/30' : 'opacity-70 hover:opacity-100'}`}
          >
            💳 Deudas
          </button>
          <button
            onClick={() => setActiveTab('annual')}
            className={`py-2 px-1 rounded-xl font-bold text-[11px] transition-all ${activeTab === 'annual' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30' : 'opacity-70 hover:opacity-100'}`}
          >
            📈 Anual
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 rounded-xl font-bold text-[11px] transition-all ${activeTab === 'settings' ? 'bg-slate-800 text-white shadow-md shadow-slate-700/30' : 'opacity-70 hover:opacity-100'}`}
          >
            ⚙️ Ajustes
          </button>
        </div>

        <div className="flex gap-2 mb-5">
          <button onClick={exportData} className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold shadow-sm active:scale-95 transition-all border ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            📥 Respaldo Datos
          </button>
          <button onClick={() => fileInputRef.current?.click()} className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold shadow-sm active:scale-95 transition-all border ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            📂 Restaurar Archivo
          </button>
          <input type="file" ref={fileInputRef} onChange={importData} accept=".json" className="hidden" />
        </div>

        {activeTab === 'budget' ? (
          <>
            <div className="mb-4">
              <label className="text-[11px] font-bold opacity-60 uppercase tracking-wider block mb-1.5 pl-1">Mes Seleccionado:</label>
              <select
                value={currentMonth}
                onChange={e => setCurrentMonth(e.target.value)}
                className={`w-full p-3.5 border rounded-2xl font-bold shadow-sm outline-none text-sm transition-all ${darkMode ? 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'}`}
              >
                {MONTHS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-3.5">
              <div onClick={() => setModalType('Ingresos')} className={`p-3.5 rounded-2xl shadow-sm text-center border cursor-pointer transition-all hover:scale-[1.02] ${darkMode ? 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-100 hover:border-emerald-500/50'}`}>
                <p className="text-[10px] opacity-60 font-bold uppercase tracking-wider">Ingresos (Ver 🔍)</p>
                <p className="text-sm font-extrabold text-emerald-500 mt-1 truncate">{formatCOP(totalIncome)}</p>
              </div>
              <div onClick={() => setModalType('Gastos')} className={`p-3.5 rounded-2xl shadow-sm text-center border cursor-pointer transition-all hover:scale-[1.02] ${darkMode ? 'bg-slate-900/90 border-slate-800 hover:border-red-500/50' : 'bg-white border-slate-100 hover:border-red-500/50'}`}>
                <p className="text-[10px] opacity-60 font-bold uppercase tracking-wider">Gastos Pend. (Ver 🔍)</p>
                <p className="text-sm font-extrabold text-red-500 mt-1 truncate">{formatCOP(totalGastosMes)}</p>
              </div>
              <div onClick={() => setModalType('Ahorros')} className={`p-3.5 rounded-2xl shadow-sm text-center border cursor-pointer transition-all hover:scale-[1.02] ${darkMode ? 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-100 hover:border-emerald-500/50'}`}>
                <p className="text-[10px] opacity-60 font-bold uppercase tracking-wider">Ahorros Pend. (Ver 🔍)</p>
                <p className="text-sm font-extrabold text-emerald-500 mt-1 truncate">{formatCOP(totalAhorrosMes)}</p>
              </div>
              <div onClick={() => setModalType('Deudas Mes')} className={`p-3.5 rounded-2xl shadow-sm text-center border cursor-pointer transition-all hover:scale-[1.02] ${darkMode ? 'bg-slate-900/90 border-slate-800 hover:border-orange-500/50' : 'bg-white border-slate-100 hover:border-orange-500/50'}`}>
                <p className="text-[10px] opacity-60 font-bold uppercase tracking-wider">Deudas Pend. (Ver 🔍)</p>
                <p className="text-sm font-extrabold text-orange-500 mt-1 truncate">{formatCOP(totalDeudasMes)}</p>
              </div>
            </div>

            <div className={`p-4 rounded-2xl shadow-sm border mb-3.5 grid grid-cols-2 gap-2 text-center transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="border-r border-slate-200 dark:border-slate-800 pr-2">
                <p className="text-[10px] opacity-60 font-bold uppercase tracking-wider">✅ Efectivo Pagado</p>
                <p className="text-xs font-bold text-emerald-500 mt-1">{formatCOP(totalPagadoMes)}</p>
              </div>
              <div>
                <p className="text-[10px] opacity-60 font-bold uppercase tracking-wider">⏳ Saldo Pendiente</p>
                <p className="text-xs font-bold text-orange-500 mt-1">{formatCOP(totalPendienteMes)}</p>
              </div>
            </div>

            {prevMonthName && (
              <div className={`p-3.5 rounded-2xl shadow-sm border mb-3.5 text-xs flex justify-between items-center ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-100 text-slate-600'}`}>
                <span>📊 Comparativa vs <strong>{prevMonthName}</strong>:</span>
                <span className={`font-bold ${expenseDiffPercent <= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {expenseDiffPercent <= 0 ? `↓ ${Math.abs(expenseDiffPercent).toFixed(1)}% gastos` : `↑ ${expenseDiffPercent.toFixed(1)}% gastos`}
                </span>
              </div>
            )}
            
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-500/20 mb-4 flex justify-between items-center px-5">
              <span className="text-xs font-bold opacity-90 uppercase tracking-wider">% a Favor del Mes:</span>
              <span className="text-lg font-black">{porcentajeAFavor.toFixed(1)}%</span>
            </div>

            <form onSubmit={handleSubmit} className={`p-5 rounded-3xl shadow-sm mb-5 flex flex-col gap-3.5 border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} ${editingId ? 'border-indigo-500 ring-2 ring-indigo-500/20' : ''}`}>
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider opacity-80">
                  {editingId ? 'Editando Movimiento' : `Nuevo Movimiento (${currentMonth})`}
                </label>
                {editingId && (
                  <button type="button" onClick={cancelEdit} className="text-xs text-red-400 font-bold underline">Cancelar</button>
                )}
              </div>

              <select
                value={selectedCat.name}
                onChange={e => {
                  const cat = categories.find(c => c.name === e.target.value);
                  if (cat) setSelectedCat(cat);
                }}
                className={`p-3.5 border rounded-2xl text-sm font-semibold outline-none transition-all ${darkMode ? 'bg-slate-800/60 border-slate-700 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500'}`}
              >
                {categories.map(cat => (
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
                className={`p-3.5 border rounded-2xl text-sm outline-none transition-all ${darkMode ? 'bg-slate-800/60 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500'}`}
              />

              <input
                type="text"
                inputMode="numeric"
                placeholder="Monto en COP"
                value={amount}
                onChange={e => setAmount(formatInputCurrency(e.target.value))}
                className={`p-3.5 border rounded-2xl text-sm outline-none font-semibold transition-all ${darkMode ? 'bg-slate-800/60 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500'}`}
              />

              <button type="submit" className={`py-3.5 rounded-2xl font-bold text-sm shadow-md text-white active:scale-95 transition-all ${editingId ? 'bg-emerald-600 shadow-emerald-600/30' : 'bg-blue-600 shadow-blue-600/30'}`}>
                {editingId ? 'Actualizar Movimiento' : `Añadir a ${currentMonth}`}
              </button>
            </form>

            <div className="flex flex-col gap-2.5 mb-4">
              <input
                type="text"
                placeholder="🔍 Buscar por detalle o categoría..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={`p-3 border rounded-2xl text-xs outline-none transition-all ${darkMode ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'}`}
              />
              <div className="flex gap-1.5">
                <button onClick={() => setStatusFilter('all')} className={`flex-1 py-2 rounded-xl text-[11px] font-bold border transition-all ${statusFilter === 'all' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>Todos</button>
                <button onClick={() => setStatusFilter('pending')} className={`flex-1 py-2 rounded-xl text-[11px] font-bold border transition-all ${statusFilter === 'pending' ? 'bg-orange-600 text-white border-orange-600 shadow-sm' : darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>Pendientes</button>
                <button onClick={() => setStatusFilter('paid')} className={`flex-1 py-2 rounded-xl text-[11px] font-bold border transition-all ${statusFilter === 'paid' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>Pagados</button>
              </div>
            </div>

            <h2 className="text-xs font-bold opacity-60 uppercase tracking-wider mb-2 pl-1">Registros de {currentMonth}</h2>
            <div className={`rounded-3xl shadow-sm overflow-hidden mb-5 border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[320px]">
                  <thead>
                    <tr className={`border-b text-[10px] uppercase opacity-60 font-bold ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                      <th className="p-3.5">Estado / Detalle</th>
                      <th className="p-3.5">Monto</th>
                      <th className="p-3.5 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y text-xs ${darkMode ? 'divide-slate-800/80' : 'divide-slate-100'}`}>
                    {filteredMonthTxs.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-8 text-center opacity-40 font-medium">No hay registros coincidentes</td>
                      </tr>
                    )}
                    {filteredMonthTxs.map(t => (
                      <tr key={t.id} className={`transition-all duration-200 ${darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/80'} ${t.paid ? (darkMode ? 'bg-emerald-950/15' : 'bg-emerald-50/40') : ''}`}>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2 mb-1">
                            <button
                              type="button"
                              onClick={() => togglePaidStatus(t.id)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border transition-all active:scale-95 ${
                                t.paid 
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20' 
                                  : darkMode ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              {t.paid ? '✓ Pagado' : 'Pendiente'}
                            </button>
                            <span className={`font-bold ${t.paid ? 'line-through opacity-40' : ''}`}>{t.category}</span>
                          </div>
                          <span className="opacity-60 text-[11px] pl-1 font-medium">{t.desc}</span>
                        </td>
                        <td className={`p-3.5 font-extrabold whitespace-nowrap ${t.type === 'income' ? 'text-emerald-500' : t.paid ? 'opacity-40 line-through' : 'text-red-500'}`}>
                          {t.type === 'income' ? '+' : '-'}{formatCOP(t.amount)}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <button onClick={() => startEdit(t)} className="text-indigo-400 font-bold px-2.5 py-1.5 bg-indigo-500/10 rounded-xl mr-1 text-[11px] hover:bg-indigo-500/20 transition-all">Editar</button>
                          <button onClick={() => deleteTx(t.id)} className="text-red-400 font-bold px-2.5 py-1.5 bg-red-500/10 rounded-xl text-[11px] hover:bg-red-500/20 transition-all">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {Object.keys(expenseCategoriesBreakdown).length > 0 && (
              <div className={`p-5 rounded-3xl shadow-sm border mb-5 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <h3 className="text-xs font-bold uppercase tracking-wider opacity-70 mb-4">📊 Distribución de Gastos (Pendientes)</h3>
                <div className="space-y-3">
                  {Object.entries(expenseCategoriesBreakdown).map(([cat, val]) => {
                    const percentage = totalGastosMes > 0 ? (val / totalGastosMes) * 100 : 0;
                    return (
                      <div key={cat} className="text-xs">
                        <div className="flex justify-between mb-1.5 font-medium">
                          <span className="opacity-90">{cat}</span>
                          <span className="font-bold">{formatCOP(val)} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className={`w-full h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, percentage)}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={`p-4 rounded-2xl shadow-sm flex justify-between items-center border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">Balance Neto ({currentMonth}):</span>
              <span className={`text-base font-black ${balance >= 0 ? 'text-indigo-400' : 'text-red-500'}`}>
                {formatCOP(balance)}
              </span>
            </div>
          </>
        ) : activeTab === 'savings' ? (
          <>
            <div className="grid grid-cols-1 gap-3 mb-5">
              <div className={`p-5 rounded-3xl shadow-sm border text-center transition-colors ${darkMode ? 'bg-slate-900 border-emerald-900/40' : 'bg-white border-emerald-100'}`}>
                <p className="text-[11px] opacity-60 uppercase font-bold tracking-wider">Total Ahorrado (Histórico)</p>
                <p className="text-2xl font-black text-emerald-500 mt-1">{formatCOP(totalHistoricoAhorros)}</p>
              </div>
              <div className={`p-5 rounded-3xl shadow-sm border text-center transition-colors ${darkMode ? 'bg-slate-900 border-amber-900/40' : 'bg-white border-amber-100'}`}>
                <p className="text-[11px] opacity-60 uppercase font-bold tracking-wider">Fondo de Emergencia</p>
                <p className="text-2xl font-black text-amber-500 mt-1">{formatCOP(totalHistoricoEmergencia)}</p>
              </div>
            </div>

            <form onSubmit={handleGoalSubmit} className={`p-5 rounded-3xl shadow-sm mb-5 flex flex-col gap-3.5 border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} ${editingGoalId ? 'border-emerald-500 ring-2 ring-emerald-500/20' : ''}`}>
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider opacity-80">{editingGoalId ? 'Editando Meta' : 'Añadir Nueva Meta'}</label>
                {editingGoalId && <button type="button" onClick={cancelGoalEdit} className="text-xs text-red-400 font-bold underline">Cancelar</button>}
              </div>
              <input type="text" placeholder="Nombre de la meta..." value={newGoalName} onChange={e => setNewGoalName(e.target.value)} className={`p-3.5 border rounded-2xl text-sm outline-none transition-all ${darkMode ? 'bg-slate-800/60 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500'}`} />
              <input type="text" inputMode="numeric" placeholder="Monto objetivo total" value={newGoalTarget} onChange={e => setNewGoalTarget(formatInputCurrency(e.target.value))} className={`p-3.5 border rounded-2xl text-sm outline-none font-semibold transition-all ${darkMode ? 'bg-slate-800/60 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500'}`} />
              <input type="text" inputMode="numeric" placeholder="Monto actual ahorrado" value={newGoalCurrent} onChange={e => setNewGoalCurrent(formatInputCurrency(e.target.value))} className={`p-3.5 border rounded-2xl text-sm outline-none font-semibold transition-all ${darkMode ? 'bg-slate-800/60 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500'}`} />
              <button type="submit" className={`py-3.5 rounded-2xl font-bold text-sm text-white shadow-md active:scale-95 transition-all ${editingGoalId ? 'bg-emerald-600 shadow-emerald-600/30' : 'bg-emerald-600 shadow-emerald-600/30'}`}>{editingGoalId ? 'Actualizar Meta' : 'Crear Meta'}</button>
            </form>

            <h2 className="text-xs font-bold opacity-60 uppercase tracking-wider mb-2 pl-1">Tus Metas y Objetivos</h2>
            <div className="flex flex-col gap-3 mb-5">
              {goals.length === 0 && <p className="text-sm opacity-40 text-center py-8 rounded-3xl border transition-colors font-medium">No hay metas creadas</p>}
              {goals.map(goal => {
                const progress = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
                return (
                  <div key={goal.id} className={`p-5 rounded-3xl shadow-sm border transition-all flex flex-col gap-3.5 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm tracking-tight">{goal.name}</span>
                      <div className="flex gap-1.5">
                        <button onClick={() => startEditGoal(goal)} className="text-emerald-400 text-[11px] font-bold px-2.5 py-1 bg-emerald-500/10 rounded-xl hover:bg-emerald-500/20 transition-all">Editar</button>
                        <button onClick={() => deleteGoal(goal.id)} className="text-red-400 text-[11px] font-bold px-2.5 py-1 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-all">✕</button>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs font-medium opacity-80">
                      <span>Ahorrado: <strong className="text-emerald-500 font-bold">{formatCOP(goal.currentAmount)}</strong></span>
                      <span>Meta: <strong className="font-bold">{formatCOP(goal.targetAmount)}</strong></span>
                    </div>
                    <div className={`w-full h-3 rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center text-xs opacity-60 font-semibold pt-0.5">
                      <span>{progress.toFixed(1)}% completado</span>
                      <div className="flex gap-2">
                        <button onClick={() => setGoals(goals.map(g => g.id === goal.id ? { ...g, currentAmount: g.currentAmount + 50000 } : g))} className={`px-2.5 py-1.5 border rounded-xl font-bold text-[11px] active:scale-95 transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}>+ $50k</button>
                        <button onClick={() => setGoals(goals.map(g => g.id === goal.id ? { ...g, currentAmount: g.currentAmount + 200000 } : g))} className={`px-2.5 py-1.5 border rounded-xl font-bold text-[11px] active:scale-95 transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}>+ $200k</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : activeTab === 'debts' ? (
          <>
            <div className="grid grid-cols-1 gap-2.5 mb-4">
              <div className={`p-3.5 rounded-2xl shadow-sm text-center border flex justify-between items-center px-4 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}><span className="text-xs opacity-60 font-bold uppercase tracking-wider">Deuda Total Inicial</span><strong className="text-sm font-black">{formatCOP(totalDeudaReal)}</strong></div>
              <div className={`p-3.5 rounded-2xl shadow-sm text-center border flex justify-between items-center px-4 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}><span className="text-xs opacity-60 font-bold uppercase tracking-wider">Total Pagado</span><strong className="text-sm font-black text-emerald-500">{formatCOP(totalPagadoDeudas)}</strong></div>
              <div className={`p-3.5 rounded-2xl shadow-sm text-center border flex justify-between items-center px-4 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}><span className="text-xs opacity-60 font-bold uppercase tracking-wider">Saldo Pendiente</span><strong className="text-sm font-black text-red-500">{formatCOP(totalPendienteDeudas)}</strong></div>
            </div>

            <form onSubmit={handleDebtSubmit} className={`p-5 rounded-3xl shadow-sm mb-5 flex flex-col gap-3.5 border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} ${editingDebtId ? 'border-orange-500 ring-2 ring-orange-500/20' : ''}`}>
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider opacity-80">{editingDebtId ? 'Editando Deuda' : 'Nueva Deuda'}</label>
                {editingDebtId && <button type="button" onClick={cancelDebtEdit} className="text-xs text-red-400 font-bold underline">Cancelar</button>}
              </div>
              <input type="text" placeholder="Nombre (ej. Tarjeta de Crédito...)" value={newDebtName} onChange={e => setNewDebtName(e.target.value)} className={`p-3.5 border rounded-2xl text-sm outline-none transition-all ${darkMode ? 'bg-slate-800/60 border-slate-700 text-white placeholder-slate-500 focus:border-orange-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-orange-500'}`} />
              <div className="grid grid-cols-2 gap-2.5">
                <input type="text" inputMode="numeric" placeholder="Monto Total" value={newDebtTotal} onChange={e => setNewDebtTotal(formatInputCurrency(e.target.value))} className={`p-3.5 border rounded-2xl text-sm outline-none transition-all ${darkMode ? 'bg-slate-800/60 border-slate-700 text-white placeholder-slate-500 focus:border-orange-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-orange-500'}`} />
                <input type="text" inputMode="numeric" placeholder="Monto Pagado" value={newDebtPaid} onChange={e => setNewDebtPaid(formatInputCurrency(e.target.value))} className={`p-3.5 border rounded-2xl text-sm outline-none transition-all ${darkMode ? 'bg-slate-800/60 border-slate-700 text-white placeholder-slate-500 focus:border-orange-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-orange-500'}`} />
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <input type="text" inputMode="numeric" placeholder="Cuota" value={newDebtMonthly} onChange={e => setNewDebtMonthly(formatInputCurrency(e.target.value))} className={`p-3.5 border rounded-2xl text-sm outline-none transition-all ${darkMode ? 'bg-slate-800/60 border-slate-700 text-white placeholder-slate-500 focus:border-orange-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-orange-500'}`} />
                <select value={newDebtTotalInst} onChange={e => setNewDebtTotalInst(parseInt(e.target.value))} className={`p-3.5 border rounded-2xl text-xs outline-none transition-all ${darkMode ? 'bg-slate-800/60 border-slate-700 text-white focus:border-orange-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-orange-500'}`}>
                  {INSTALLMENT_OPTIONS.map(n => <option key={n} value={n}>{n} cuotas</option>)}
                </select>
                <select value={newDebtPaidInst} onChange={e => setNewDebtPaidInst(parseInt(e.target.value))} className={`p-3.5 border rounded-2xl text-xs outline-none transition-all ${darkMode ? 'bg-slate-800/60 border-slate-700 text-white focus:border-orange-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-orange-500'}`}>
                  {Array.from({ length: newDebtTotalInst + 1 }, (_, i) => i).map(n => <option key={n} value={n}>{n} pag.</option>)}
                </select>
              </div>
              <select value={newDebtDueDate} onChange={e => setNewDebtDueDate(e.target.value)} className={`p-3.5 border rounded-2xl text-sm outline-none transition-all ${darkMode ? 'bg-slate-800/60 border-slate-700 text-white focus:border-orange-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-orange-500'}`}>
                {DUE_DATE_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <button type="submit" className={`py-3.5 rounded-2xl font-bold text-sm text-white shadow-md active:scale-95 transition-all ${editingDebtId ? 'bg-emerald-600 shadow-emerald-600/30' : 'bg-orange-600 shadow-orange-600/30'}`}>{editingDebtId ? 'Actualizar Deuda' : 'Guardar Deuda'}</button>
            </form>

            <h2 className="text-xs font-bold opacity-60 uppercase tracking-wider mb-2 pl-1">Control de Deudas y Alertas</h2>
            <div className="flex flex-col gap-3.5 mb-5">
              {debts.length === 0 && <p className="text-sm opacity-40 text-center py-8 rounded-3xl border transition-colors font-medium">No hay deudas registradas</p>}
              {debts.map(debt => {
                const remaining = Math.max(0, debt.totalAmount - debt.paidAmount);
                const remainingInstallments = Math.max(0, debt.totalInstallments - debt.paidInstallments);
                const progress = debt.totalAmount > 0 ? Math.min(100, (debt.paidAmount / debt.totalAmount) * 100) : 0;
                const isPaidOff = remaining === 0 || remainingInstallments === 0;
                const showAlert = getDebtAlert(debt.dueDate);

                return (
                  <div key={debt.id} className={`p-5 rounded-3xl shadow-sm border transition-all flex flex-col gap-3.5 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} ${showAlert ? 'border-red-500/80 ring-2 ring-red-500/20' : ''}`}>
                    {showAlert && (
                      <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-[11px] font-bold p-2.5 rounded-2xl flex items-center gap-2 animate-pulse">
                        <span>⚠️ ¡Alerta! Esta deuda vence pronto ({debt.dueDate})</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-sm tracking-tight block">{debt.name}</span>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full inline-block mt-1 ${isPaidOff ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {isPaidOff ? '¡Deuda Cancelada! 🎉' : `Faltan ${remainingInstallments} cuotas`}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => startEditDebt(debt)} className="text-orange-400 text-[11px] font-bold px-2.5 py-1 bg-orange-500/10 rounded-xl hover:bg-orange-500/20 transition-all">Editar</button>
                        <button onClick={() => deleteDebt(debt.id)} className="text-red-400 text-[11px] font-bold px-2.5 py-1 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-all">✕</button>
                      </div>
                    </div>
                    <div className={`grid grid-cols-2 text-xs font-medium p-3.5 rounded-2xl gap-2.5 border ${darkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-100'}`}>
                      <div>Total: <strong className="block font-bold">{formatCOP(debt.totalAmount)}</strong></div>
                      <div>Pagado: <strong className="text-emerald-500 block font-bold">{formatCOP(debt.paidAmount)}</strong></div>
                      <div>Cuota: <strong className="text-indigo-400 block font-bold">{formatCOP(debt.monthlyPayment)}</strong></div>
                      <div>Corte: <strong className="text-purple-400 block font-bold">{debt.dueDate}</strong></div>
                    </div>
                    <div className={`w-full h-3 rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center text-xs opacity-60 font-semibold">
                      <span>{progress.toFixed(1)}% pagado</span>
                      <button onClick={() => {
                        const nextInst = Math.min(debt.totalInstallments, debt.paidInstallments + 1);
                        const nextAmt = Math.min(debt.totalAmount, debt.paidAmount + debt.monthlyPayment);
                        setDebts(debts.map(d => d.id === debt.id ? { ...d, paidAmount: nextAmt, paidInstallments: nextInst } : d));
                      }} className={`px-3 py-2 rounded-xl font-bold text-xs active:scale-95 transition-all shadow-sm ${darkMode ? 'bg-slate-100 text-slate-900 hover:bg-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>+ Pagar Cuota</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : activeTab === 'annual' ? (
          <>
            <div className={`p-5 rounded-3xl shadow-sm border mb-4 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <h2 className="text-sm font-bold mb-1 tracking-tight">Balance Anual ({budgetDate})</h2>
              <p className="text-[11px] opacity-60 mb-4 font-medium">Comportamiento financiero acumulado del año fiscal.</p>

              <div className="grid grid-cols-2 gap-2.5">
                <div className={`p-3.5 rounded-2xl text-center border ${darkMode ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-emerald-50/60 border-emerald-100'}`}><p className="text-[10px] opacity-60 font-bold uppercase tracking-wider">Ingresos</p><p className="text-xs font-black text-emerald-500 mt-1">{formatCOP(grandAnnualIncome)}</p></div>
                <div className={`p-3.5 rounded-2xl text-center border ${darkMode ? 'bg-red-950/20 border-red-900/40' : 'bg-red-50/60 border-red-100'}`}><p className="text-[10px] opacity-60 font-bold uppercase tracking-wider">Gastos</p><p className="text-xs font-black text-red-500 mt-1">{formatCOP(grandAnnualExpense)}</p></div>
                <div className={`p-3.5 rounded-2xl text-center border ${darkMode ? 'bg-teal-950/20 border-teal-900/40' : 'bg-teal-50/60 border-teal-100'}`}><p className="text-[10px] opacity-60 font-bold uppercase tracking-wider">Ahorros</p><p className="text-xs font-black text-teal-500 mt-1">{formatCOP(grandAnnualSavings)}</p></div>
                <div className={`p-3.5 rounded-2xl text-center border ${darkMode ? 'bg-orange-950/20 border-orange-900/40' : 'bg-orange-50/60 border-orange-100'}`}><p className="text-[10px] opacity-60 font-bold uppercase tracking-wider">Deudas</p><p className="text-xs font-black text-orange-500 mt-1">{formatCOP(grandAnnualDebts)}</p></div>
              </div>
              <div className={`p-4 rounded-2xl text-center border mt-3 ${darkMode ? 'bg-indigo-950/20 border-indigo-900/40' : 'bg-indigo-50/60 border-indigo-100'}`}><p className="text-[10px] opacity-60 font-bold uppercase tracking-wider">Neto Anual</p><p className={`text-sm font-black mt-1 ${grandAnnualNet >= 0 ? 'text-indigo-400' : 'text-red-400'}`}>{formatCOP(grandAnnualNet)}</p></div>
            </div>

            <div className={`rounded-3xl shadow-sm overflow-hidden mb-4 border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[320px]">
                  <thead>
                    <tr className={`border-b text-[10px] uppercase opacity-60 font-bold ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                      <th className="p-3.5">Mes</th>
                      <th className="p-3.5">Ingresos</th>
                      <th className="p-3.5">Gastos</th>
                      <th className="p-3.5">Neto</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y text-xs ${darkMode ? 'divide-slate-800/80' : 'divide-slate-100'}`}>
                    {annualSummary.map(row => (
                      <tr key={row.month} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/80'}`}>
                        <td className="p-3.5 font-bold">{row.month}</td>
                        <td className="p-3.5 font-bold text-emerald-500">{formatCOP(row.income)}</td>
                        <td className="p-3.5 font-bold text-red-500">{formatCOP(row.expense)}</td>
                        <td className={`p-3.5 font-black ${row.net >= 0 ? 'text-indigo-400' : 'text-red-400'}`}>{formatCOP(row.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={`p-5 rounded-3xl shadow-sm border mb-4 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <h2 className="text-sm font-bold mb-1 tracking-tight">🔒 Seguridad y Bloqueo por PIN</h2>
              <p className="text-[11px] opacity-60 mb-4 font-medium">Protege tu información financiera con un PIN de 4 dígitos.</p>
              
              <div className="flex gap-2">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="Nuevo PIN (4 dígitos)"
                  id="pinInput"
                  className={`p-3.5 border rounded-2xl text-sm outline-none flex-1 transition-all ${darkMode ? 'bg-slate-800/60 border-slate-700 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500'}`}
                />
                <button
                  onClick={() => {
                    const el = document.getElementById('pinInput') as HTMLInputElement;
                    if (el) handleSetPin(el.value);
                  }}
                  className="bg-blue-600 text-white px-5 rounded-2xl font-bold text-xs shadow-md shadow-blue-600/30 active:scale-95 transition-all"
                >
                  Guardar PIN
                </button>
              </div>
              {savedPin && <p className="text-[11px] text-emerald-500 font-bold mt-2.5">✓ PIN de seguridad activo actualmente.</p>}
            </div>

            <div className={`p-5 rounded-3xl shadow-sm border mb-4 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <h2 className="text-sm font-bold mb-1 tracking-tight">🏷️ Gestionar Categorías Personalizadas</h2>
              <p className="text-[11px] opacity-60 mb-4 font-medium">Crea nuevas categorías adaptadas a tus necesidades.</p>

              <form onSubmit={handleAddCategory} className="flex flex-col gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Nombre de la categoría..."
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className={`p-3.5 border rounded-2xl text-sm outline-none transition-all ${darkMode ? 'bg-slate-800/60 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500'}`}
                />
                <select
                  value={newCatType}
                  onChange={e => setNewCatType(e.target.value as 'income' | 'expense')}
                  className={`p-3.5 border rounded-2xl text-xs outline-none transition-all ${darkMode ? 'bg-slate-800/60 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500'}`}
                >
                  <option value="expense">Tipo: Gasto / Destino</option>
                  <option value="income">Tipo: Ingreso</option>
                </select>
                <button type="submit" className="bg-emerald-600 text-white py-3.5 rounded-2xl font-bold text-xs shadow-md shadow-emerald-600/30 active:scale-95 transition-all">
                  + Añadir Categoría
                </button>
              </form>

              <h3 className="text-xs font-bold uppercase opacity-60 mb-2 tracking-wider">Categorías Actuales</h3>
              <div className="max-h-52 overflow-y-auto space-y-2 divide-y divide-slate-100 dark:divide-slate-800/60 pr-1">
                {categories.map(c => (
                  <div key={c.name} className="pt-2.5 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold">{c.name}</span>
                      <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full font-bold ${c.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {c.type === 'income' ? 'Ingreso' : 'Gasto'}
                      </span>
                    </div>
                    <button onClick={() => handleDeleteCategory(c.name)} className="text-red-400 text-xs font-bold px-2.5 py-1 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-all">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {modalType && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3.5 z-50 animate-fadeIn">
            <div className={`rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col max-h-[85vh] border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
              <div className="flex justify-between items-center mb-3.5 border-b pb-3 dark:border-slate-800">
                <h3 className="font-bold text-sm tracking-tight">
                  Detalle de <span className="text-indigo-400 font-extrabold">{modalType}</span> ({currentMonth})
                </h3>
                <button 
                  onClick={() => setModalType(null)} 
                  className={`font-bold text-base px-2.5 py-1 rounded-xl transition-all ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  ✕
                </button>
              </div>

              <div className={`overflow-y-auto flex-1 divide-y text-xs pr-1 ${darkMode ? 'divide-slate-800/80' : 'divide-slate-100'}`}>
                {modalItems.length === 0 ? (
                  <p className="text-center opacity-40 py-8 font-medium">No hay registros en esta categoría.</p>
                ) : (
                  modalItems.map(item => (
                    <div key={item.id} className="py-3.5 flex justify-between items-center gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {modalType !== 'Ingresos' && (
                            <button
                              type="button"
                              onClick={() => togglePaidStatus(item.id)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                                item.paid 
                                  ? 'bg-emerald-600 text-white border-emerald-600' 
                                  : darkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}
                            >
                              {item.paid ? '✓ Pagado' : 'Pendiente'}
                            </button>
                          )}
                          <span className={`text-[10px] font-bold opacity-50 uppercase tracking-wider ${item.paid ? 'line-through' : ''}`}>{item.category}</span>
                        </div>
                        <p className={`font-medium ${item.paid ? 'line-through opacity-50' : ''}`}>{item.desc}</p>
                      </div>
                      <span className={`font-extrabold whitespace-nowrap ${item.type === 'income' ? 'text-emerald-500' : item.paid ? 'opacity-40 line-through' : 'text-red-500'}`}>
                        {item.type === 'income' ? '+' : '-'}{formatCOP(item.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className={`mt-4 pt-3.5 border-t flex flex-col gap-2 text-xs font-medium ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="flex justify-between items-center">
                  <span className="opacity-60">Total Bruto:</span>
                  <span className="font-bold">{formatCOP(modalTotalBruto)}</span>
                </div>
                {modalType !== 'Ingresos' && (
                  <>
                    <div className="flex justify-between items-center text-emerald-500">
                      <span>✓ Ya Pagado:</span>
                      <span className="font-bold">{formatCOP(modalTotalPagado)}</span>
                    </div>
                    <div className="flex justify-between items-center text-orange-500">
                      <span>⏳ Saldo Pendiente:</span>
                      <span className="font-bold">{formatCOP(modalTotalPendiente)}</span>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setModalType(null)}
                className="mt-4 w-full bg-indigo-600 text-white py-3.5 rounded-2xl font-bold text-xs shadow-md shadow-indigo-600/30 active:scale-95 transition-all"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}