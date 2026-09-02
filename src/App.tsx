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
  { name: 'Suscripciones', type: 'expense' }, // Las suscripciones operan como deudas recurrentes
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
  const [budgetName, setBudgetName] = useState(() => localStorage.getItem('budget_name') || 'Mi Presupuesto Personal');
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

  useEffect(() => {
    localStorage.setItem('presupuesto_personal_local', JSON.stringify(txs));
  }, [txs]);

  useEffect(() => {
    localStorage.setItem('savings_goals_local', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('debts_local', JSON.stringify(debts));
  }, [debts]);

  useEffect(() => {
    localStorage.setItem('budget_name', budgetName);
  }, [budgetName]);

  useEffect(() => {
    localStorage.setItem('budget_date', budgetDate);
  }, [budgetDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
    if (isNaN(cleanAmount) || cleanAmount <= 0) return;

    if (editingId) {
      setTxs(txs.map(t => t.id === editingId ? {
        ...t,
        month: currentMonth,
        category: selectedCat.name,
        type: selectedCat.type as 'income' | 'expense',
        desc: desc || selectedCat.name,
        amount: cleanAmount,
      } : t));
      setEditingId(null);
    } else {
      setTxs([
        {
          id: Date.now().toString(),
          month: currentMonth,
          category: selectedCat.name,
          type: selectedCat.type as 'income' | 'expense',
          desc: desc || selectedCat.name,
          amount: cleanAmount,
        },
        ...txs,
      ]);
    }

    setDesc('');
    setAmount('');
    setSelectedCat(CATEGORIES[0]);
  };

  const startEdit = (t: Transaction) => {
    setEditingId(t.id);
    setCurrentMonth(t.month);
    const cat = CATEGORIES.find(c => c.name === t.category) || CATEGORIES[0];
    setSelectedCat(cat);
    setDesc(t.desc);
    setAmount(t.amount.toString());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDesc('');
    setAmount('');
  };

  const deleteTx = (id: string) => {
    if (editingId === id) cancelEdit();
    setTxs(txs.filter(t => t.id !== id));
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(newGoalTarget.replace(/\./g, '').replace(',', '.'));
    const current = parseFloat((newGoalCurrent || '0').replace(/\./g, '').replace(',', '.'));
    if (!newGoalName || isNaN(target) || target <= 0) return;

    if (editingGoalId) {
      setGoals(goals.map(g => g.id === editingGoalId ? {
        ...g,
        name: newGoalName,
        targetAmount: target,
        currentAmount: isNaN(current) ? 0 : current
      } : g));
      setEditingGoalId(null);
    } else {
      setGoals([...goals, { 
        id: Date.now().toString(), 
        name: newGoalName, 
        targetAmount: target, 
        currentAmount: isNaN(current) ? 0 : current 
      }]);
    }

    setNewGoalName('');
    setNewGoalTarget('');
    setNewGoalCurrent('');
  };

  const startEditGoal = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setNewGoalName(goal.name);
    setNewGoalTarget(goal.targetAmount.toString());
    setNewGoalCurrent(goal.currentAmount.toString());
  };

  const cancelGoalEdit = () => {
    setEditingGoalId(null);
    setNewGoalName('');
    setNewGoalTarget('');
    setNewGoalCurrent('');
  };

  const deleteGoal = (id: string) => {
    if (editingGoalId === id) cancelGoalEdit();
    setGoals(goals.filter(g => g.id !== id));
  };

  const handleDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(newDebtTotal.replace(/\./g, '').replace(',', '.'));
    const paid = parseFloat((newDebtPaid || '0').replace(/\./g, '').replace(',', '.'));
    const monthly = parseFloat((newDebtMonthly || '0').replace(/\./g, '').replace(',', '.'));
    
    if (!newDebtName || isNaN(total) || total <= 0) return;

    if (editingDebtId) {
      setDebts(debts.map(d => d.id === editingDebtId ? {
        ...d,
        name: newDebtName,
        totalAmount: total,
        paidAmount: isNaN(paid) ? 0 : paid,
        monthlyPayment: isNaN(monthly) ? 0 : monthly,
        totalInstallments: newDebtTotalInst,
        paidInstallments: newDebtPaidInst,
        dueDate: newDebtDueDate
      } : d));
      setEditingDebtId(null);
    } else {
      setDebts([...debts, {
        id: Date.now().toString(),
        name: newDebtName,
        totalAmount: total,
        paidAmount: isNaN(paid) ? 0 : paid,
        monthlyPayment: isNaN(monthly) ? 0 : monthly,
        totalInstallments: newDebtTotalInst,
        paidInstallments: newDebtPaidInst,
        dueDate: newDebtDueDate
      }]);
    }

    setNewDebtName('');
    setNewDebtTotal('');
    setNewDebtPaid('');
    setNewDebtMonthly('');
    setNewDebtTotalInst(12);
    setNewDebtPaidInst(0);
    setNewDebtDueDate(DUE_DATE_OPTIONS[3]);
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

  const cancelDebtEdit = () => {
    setEditingDebtId(null);
    setNewDebtName('');
    setNewDebtTotal('');
    setNewDebtPaid('');
    setNewDebtMonthly('');
    setNewDebtTotalInst(12);
    setNewDebtPaidInst(0);
    setNewDebtDueDate(DUE_DATE_OPTIONS[3]);
  };

  const deleteDebt = (id: string) => {
    if (editingDebtId === id) cancelDebtEdit();
    setDebts(debts.filter(d => d.id !== id));
  };

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
          alert('¡Datos cargados y restaurados con éxito!');
        } catch {
          alert('Error al leer el archivo.');
        }
      };
    }
  };

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  // Cálculos de presupuesto del mes seleccionado
  const monthTxs = txs.filter(t => t.month === currentMonth);
  const totalIncome = monthTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  
  const totalGastosMes = monthTxs
    .filter(t => t.type === 'expense' && t.category !== 'Ahorro' && t.category !== 'Fondo de emergencia' && t.category !== 'Suscripciones' && !t.category.includes('Deudas') && !t.category.includes('financiad'))
    .reduce((acc, t) => acc + t.amount, 0);

  const totalAhorrosMes = monthTxs
    .filter(t => t.type === 'expense' && (t.category === 'Ahorro' || t.category === 'Fondo de emergencia'))
    .reduce((acc, t) => acc + t.amount, 0);

  const totalDeudasMes = monthTxs
    .filter(t => t.type === 'expense' && (t.category === 'Suscripciones' || t.category.includes('Deudas') || t.category.includes('financiad')))
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = totalGastosMes + totalAhorrosMes + totalDeudasMes;
  const balance = totalIncome - totalExpense;
  const porcentajeAFavor = totalIncome > 0 ? Math.max(0, (balance / totalIncome) * 100) : 0;

  // Filtrador para el modal de detalles
  const getModalTransactions = () => {
    if (modalType === 'Ingresos') {
      return monthTxs.filter(t => t.type === 'income');
    }
    if (modalType === 'Gastos') {
      return monthTxs.filter(t => t.type === 'expense' && t.category !== 'Ahorro' && t.category !== 'Fondo de emergencia' && t.category !== 'Suscripciones' && !t.category.includes('Deudas') && !t.category.includes('financiad'));
    }
    if (modalType === 'Ahorros') {
      return monthTxs.filter(t => t.type === 'expense' && (t.category === 'Ahorro' || t.category === 'Fondo de emergencia'));
    }
    if (modalType === 'Deudas Mes') {
      return monthTxs.filter(t => t.type === 'expense' && (t.category === 'Suscripciones' || t.category.includes('Deudas') || t.category.includes('financiad')));
    }
    return [];
  };

  // Cálculos históricos
  const totalHistoricoAhorros = txs.filter(t => t.category === 'Ahorro').reduce((acc, t) => acc + t.amount, 0);
  const totalHistoricoEmergencia = txs.filter(t => t.category === 'Fondo de emergencia').reduce((acc, t) => acc + t.amount, 0);
  const totalDeudaReal = debts.reduce((acc, d) => acc + d.totalAmount, 0);
  const totalPagadoDeudas = debts.reduce((acc, d) => acc + d.paidAmount, 0);
  const totalPendienteDeudas = totalDeudaReal - totalPagadoDeudas;

  // Datos para el Resumen Anual
  const annualSummary = MONTHS.map(m => {
    const mItems = txs.filter(t => t.month === m);
    const inc = mItems.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const exp = mItems
      .filter(t => t.type === 'expense' && t.category !== 'Ahorro' && t.category !== 'Fondo de emergencia' && t.category !== 'Suscripciones' && !t.category.includes('Deudas') && !t.category.includes('financiad'))
      .reduce((acc, t) => acc + t.amount, 0);
    const sav = mItems
      .filter(t => t.type === 'expense' && (t.category === 'Ahorro' || t.category === 'Fondo de emergencia'))
      .reduce((acc, t) => acc + t.amount, 0);
    const deb = mItems
      .filter(t => t.type === 'expense' && (t.category === 'Suscripciones' || t.category.includes('Deudas') || t.category.includes('financiad')))
      .reduce((acc, t) => acc + t.amount, 0);
    const totalOut = exp + sav + deb;
    const net = inc - totalOut;
    return { month: m, income: inc, expense: exp, savings: sav, debts: deb, net };
  });

  const grandAnnualIncome = annualSummary.reduce((acc, cur) => acc + cur.income, 0);
  const grandAnnualExpense = annualSummary.reduce((acc, cur) => acc + cur.expense, 0);
  const grandAnnualSavings = annualSummary.reduce((acc, cur) => acc + cur.savings, 0);
  const grandAnnualDebts = annualSummary.reduce((acc, cur) => acc + cur.debts, 0);
  const grandAnnualNet = annualSummary.reduce((acc, cur) => acc + cur.net, 0);

  return (
    <div className="max-w-md sm:max-w-4xl mx-auto p-4 bg-gray-50 min-h-screen font-sans relative">
      
      {/* Cabecera Personalizable */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-4 flex flex-col gap-2 border">
        <input
          type="text"
          value={budgetName}
          onChange={e => setBudgetName(e.target.value)}
          placeholder="Nombre del Presupuesto"
          className="text-lg font-bold text-gray-800 border-b pb-1 outline-none focus:border-blue-500 bg-transparent"
        />
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Fecha / Periodo:</span>
          <input
            type="text"
            value={budgetDate}
            onChange={e => setBudgetDate(e.target.value)}
            placeholder="Ej. Año 2026"
            className="font-semibold text-gray-700 border rounded px-2 py-1 outline-none focus:border-blue-500 w-32 text-right"
          />
        </div>
      </div>

      {/* Navegación por Pestañas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <button
          onClick={() => setActiveTab('budget')}
          className={`py-3 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-colors ${activeTab === 'budget' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
        >
          📊 Presupuesto
        </button>
        <button
          onClick={() => setActiveTab('savings')}
          className={`py-3 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-colors ${activeTab === 'savings' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700 border'}`}
        >
          🎯 Ahorros
        </button>
        <button
          onClick={() => setActiveTab('debts')}
          className={`py-3 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-colors ${activeTab === 'debts' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 border'}`}
        >
          💳 Deudas Reales
        </button>
        <button
          onClick={() => setActiveTab('annual')}
          className={`py-3 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-colors ${activeTab === 'annual' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 border'}`}
        >
          📈 Resumen Anual
        </button>
      </div>

      {/* Botones de Respaldo y Restauración */}
      <div className="flex gap-2 mb-4">
        <button onClick={exportData} className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-xs font-semibold shadow-sm">
          📥 Guardar Respaldo
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-gray-700 text-white py-2 rounded-lg text-xs font-semibold shadow-sm">
          📂 Abrir Archivo
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={importData} 
          accept=".json" 
          className="hidden" 
        />
      </div>

      {activeTab === 'budget' ? (
        <>
          {/* Selector de Mes */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Seleccionar Mes:</label>
            <select
              value={currentMonth}
              onChange={e => setCurrentMonth(e.target.value)}
              className="w-full p-3 border rounded-xl bg-white font-bold text-gray-800 shadow-sm outline-none"
            >
              {MONTHS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Tarjetas de Resumen Interactivas */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
            <div 
              onClick={() => setModalType('Ingresos')}
              className="bg-white p-3 rounded-xl shadow-sm text-center border cursor-pointer hover:border-green-500 hover:bg-green-50/10 transition-all"
            >
              <p className="text-[11px] text-gray-500 font-medium">Ingresos (Ver 🔍)</p>
              <p className="text-xs sm:text-sm font-bold text-green-600 mt-1">{formatCOP(totalIncome)}</p>
            </div>
            <div 
              onClick={() => setModalType('Gastos')}
              className="bg-white p-3 rounded-xl shadow-sm text-center border cursor-pointer hover:border-red-500 hover:bg-red-50/10 transition-all"
            >
              <p className="text-[11px] text-gray-500 font-medium">Gastos (Ver 🔍)</p>
              <p className="text-xs sm:text-sm font-bold text-red-600 mt-1">{formatCOP(totalGastosMes)}</p>
            </div>
            <div 
              onClick={() => setModalType('Ahorros')}
              className="bg-white p-3 rounded-xl shadow-sm text-center border cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/10 transition-all"
            >
              <p className="text-[11px] text-gray-500 font-medium">Ahorros (Ver 🔍)</p>
              <p className="text-xs sm:text-sm font-bold text-emerald-600 mt-1">{formatCOP(totalAhorrosMes)}</p>
            </div>
            <div 
              onClick={() => setModalType('Deudas Mes')}
              className="bg-white p-3 rounded-xl shadow-sm text-center border cursor-pointer hover:border-orange-500 hover:bg-orange-50/10 transition-all"
            >
              <p className="text-[11px] text-gray-500 font-medium">Deudas Mes (Ver 🔍)</p>
              <p className="text-xs sm:text-sm font-bold text-orange-600 mt-1">{formatCOP(totalDeudasMes)}</p>
            </div>
            <div className="bg-blue-600 text-white p-3 rounded-xl shadow-sm text-center col-span-2 sm:col-span-1">
              <p className="text-[11px] opacity-85 font-medium">% a Favor</p>
              <p className="text-xs sm:text-sm font-bold mt-1">{porcentajeAFavor.toFixed(1)}%</p>
            </div>
          </div>

          {/* Formulario de Ingreso / Edición */}
          <form onSubmit={handleSubmit} className={`bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-col gap-3 border ${editingId ? 'border-blue-500 bg-blue-50/20' : ''}`}>
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-gray-600 uppercase">
                {editingId ? 'Editando Movimiento' : `Nuevo Movimiento (${currentMonth})`}
              </label>
              {editingId && (
                <button type="button" onClick={cancelEdit} className="text-xs text-red-500 font-bold underline">
                  Cancelar edición
                </button>
              )}
            </div>

            <select
              value={selectedCat.name}
              onChange={e => {
                const cat = CATEGORIES.find(c => c.name === e.target.value);
                if (cat) setSelectedCat(cat);
              }}
              className="p-3 border rounded-lg text-sm bg-white font-medium text-gray-800 outline-none"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.name} value={cat.name}>
                  {cat.name} ({cat.type === 'income' ? 'Ingreso' : 'Destino'})
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Detalle (ej. Netflix, Cuota Claro, Gasolina...)"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="p-3 border rounded-lg text-sm text-gray-800 outline-none"
            />

            <input
              type="text"
              inputMode="numeric"
              placeholder="Monto en COP"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="p-3 border rounded-lg text-sm text-gray-800 outline-none font-medium"
            />

            <button type="submit" className={`py-3 rounded-lg font-medium text-sm shadow-sm text-white ${editingId ? 'bg-green-600' : 'bg-blue-600'}`}>
              {editingId ? 'Actualizar Movimiento' : `Añadir a ${currentMonth}`}
            </button>
          </form>

          {/* Tabla de Registros */}
          <h2 className="text-md font-semibold mb-2 text-gray-700">Registros de {currentMonth}</h2>
          <div className="bg-white rounded-xl shadow-sm overflow-x-auto mb-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-100 text-xs text-gray-600 uppercase">
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Detalle</th>
                  <th className="p-3">Monto</th>
                  <th className="p-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {monthTxs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-gray-400">Sin registros para {currentMonth}</td>
                  </tr>
                )}
                {monthTxs.map(t => (
                  <tr key={t.id} className={`hover:bg-gray-50 ${editingId === t.id ? 'bg-blue-50' : ''}`}>
                    <td className="p-3 font-medium text-gray-700">{t.category}</td>
                    <td className="p-3 text-gray-600">{t.desc}</td>
                    <td className={`p-3 font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCOP(t.amount)}
                    </td>
                    <td className="p-3 text-center flex justify-center gap-2">
                      <button onClick={() => startEdit(t)} className="text-blue-500 hover:text-blue-700 text-xs font-bold px-2 py-1 bg-blue-50 rounded">
                        Editar
                      </button>
                      <button onClick={() => deleteTx(t.id)} className="text-red-400 hover:text-red-600 text-xs font-bold px-2 py-1 bg-red-50 rounded">
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Balance Final del Mes */}
          <div className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
            <span className="font-semibold text-gray-700">Balance Neto ({currentMonth}):</span>
            <span className={`text-lg font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCOP(balance)}
            </span>
          </div>
        </>
      ) : activeTab === 'savings' ? (
        <>
          {/* Pestaña de Ahorros, Fondo de Emergencia y Metas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100 text-center">
              <p className="text-xs text-gray-500 uppercase font-semibold">Total Ahorrado (Histórico)</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCOP(totalHistoricoAhorros)}</p>
              <p className="text-[11px] text-gray-400 mt-1">Registrado en categoría "Ahorro"</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-amber-100 text-center">
              <p className="text-xs text-gray-500 uppercase font-semibold">Fondo de Emergencia</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{formatCOP(totalHistoricoEmergencia)}</p>
              <p className="text-[11px] text-gray-400 mt-1">Registrado en "Fondo de emergencia"</p>
            </div>
          </div>

          {/* Formulario para agregar o editar Meta */}
          <form onSubmit={handleGoalSubmit} className={`bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-col gap-3 border ${editingGoalId ? 'border-emerald-500 bg-emerald-50/20' : ''}`}>
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-gray-600 uppercase">
                {editingGoalId ? 'Editando Meta u Objetivo' : 'Añadir Nueva Meta u Objetivo'}
              </label>
              {editingGoalId && (
                <button type="button" onClick={cancelGoalEdit} className="text-xs text-red-500 font-bold underline">
                  Cancelar
                </button>
              )}
            </div>

            <input
              type="text"
              placeholder="Nombre de la meta (ej. Moto nueva, Viaje...)"
              value={newGoalName}
              onChange={e => setNewGoalName(e.target.value)}
              className="p-3 border rounded-lg text-sm text-gray-800 outline-none"
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="Monto objetivo total en COP"
              value={newGoalTarget}
              onChange={e => setNewGoalTarget(e.target.value)}
              className="p-3 border rounded-lg text-sm text-gray-800 outline-none font-medium"
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="Monto actual ahorrado (Opcional)"
              value={newGoalCurrent}
              onChange={e => setNewGoalCurrent(e.target.value)}
              className="p-3 border rounded-lg text-sm text-gray-800 outline-none font-medium"
            />

            <button type="submit" className={`py-3 rounded-lg font-medium text-sm shadow-sm text-white ${editingGoalId ? 'bg-green-600' : 'bg-emerald-600'}`}>
              {editingGoalId ? 'Actualizar Meta' : 'Crear Meta'}
            </button>
          </form>

          {/* Listado de Metas y Objetivos */}
          <h2 className="text-md font-semibold mb-3 text-gray-700">Tus Metas y Objetivos Financieros</h2>
          <div className="flex flex-col gap-3 mb-6">
            {goals.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4 bg-white rounded-xl">No hay metas creadas aún</p>
            )}
            {goals.map(goal => {
              const progress = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
              return (
                <div key={goal.id} className={`bg-white p-4 rounded-xl shadow-sm border flex flex-col gap-3 ${editingGoalId === goal.id ? 'border-emerald-500 bg-emerald-50/10' : ''}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800 text-sm">{goal.name}</span>
                    <div className="flex gap-2">
                      <button onClick={() => startEditGoal(goal)} className="text-emerald-600 hover:text-emerald-800 text-xs font-bold px-2 py-1 bg-emerald-50 rounded">
                        Editar
                      </button>
                      <button onClick={() => deleteGoal(goal.id)} className="text-red-400 hover:text-red-600 text-xs font-bold px-2 py-1 bg-red-50 rounded">
                        ✕
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Ahorrado: <strong className="text-emerald-600">{formatCOP(goal.currentAmount)}</strong></span>
                    <span>Meta: <strong>{formatCOP(goal.targetAmount)}</strong></span>
                  </div>

                  {/* Barra de Progreso */}
                  <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
                    <span>{progress.toFixed(1)}% completado</span>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        const updated = goal.currentAmount + 50000;
                        setGoals(goals.map(g => g.id === goal.id ? { ...g, currentAmount: updated } : g));
                      }} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded font-bold text-gray-700">+ $50k</button>
                      <button onClick={() => {
                        const updated = goal.currentAmount + 200000;
                        setGoals(goals.map(g => g.id === goal.id ? { ...g, currentAmount: updated } : g));
                      }} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded font-bold text-gray-700">+ $200k</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : activeTab === 'debts' ? (
        <>
          {/* Pestaña de Deudas Reales */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-white p-3 rounded-xl shadow-sm text-center border border-orange-100">
              <p className="text-xs text-gray-500 uppercase font-semibold">Deuda Total Inicial</p>
              <p className="text-lg font-bold text-gray-800 mt-1">{formatCOP(totalDeudaReal)}</p>
            </div>
            <div className="bg-white p-3 rounded-xl shadow-sm text-center border border-emerald-100">
              <p className="text-xs text-gray-500 uppercase font-semibold">Total Pagado</p>
              <p className="text-lg font-bold text-emerald-600 mt-1">{formatCOP(totalPagadoDeudas)}</p>
            </div>
            <div className="bg-white p-3 rounded-xl shadow-sm text-center border border-red-100">
              <p className="text-xs text-gray-500 uppercase font-semibold">Saldo Pendiente</p>
              <p className="text-lg font-bold text-red-600 mt-1">{formatCOP(totalPendienteDeudas)}</p>
            </div>
          </div>

          {/* Formulario de Deudas con Selectores */}
          <form onSubmit={handleDebtSubmit} className={`bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-col gap-3 border ${editingDebtId ? 'border-orange-500 bg-orange-50/20' : ''}`}>
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-gray-600 uppercase">
                {editingDebtId ? 'Editando Deuda Real' : 'Añadir Nueva Deuda Real'}
              </label>
              {editingDebtId && (
                <button type="button" onClick={cancelDebtEdit} className="text-xs text-red-500 font-bold underline">
                  Cancelar
                </button>
              )}
            </div>

            <input
              type="text"
              placeholder="Nombre de la deuda (ej. Tarjeta, Celular financiado...)"
              value={newDebtName}
              onChange={e => setNewDebtName(e.target.value)}
              className="p-3 border rounded-lg text-sm text-gray-800 outline-none"
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase">Monto Total de la Deuda</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ej. 1500000"
                  value={newDebtTotal}
                  onChange={e => setNewDebtTotal(e.target.value)}
                  className="p-3 border rounded-lg text-sm text-gray-800 outline-none font-medium w-full"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase">Monto ya Pagado</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ej. 300000"
                  value={newDebtPaid}
                  onChange={e => setNewDebtPaid(e.target.value)}
                  className="p-3 border rounded-lg text-sm text-gray-800 outline-none font-medium w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase">Cuota Mensual</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ej. 150000"
                  value={newDebtMonthly}
                  onChange={e => setNewDebtMonthly(e.target.value)}
                  className="p-3 border rounded-lg text-sm text-gray-800 outline-none font-medium w-full"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase">Total Cuotas</label>
                <select
                  value={newDebtTotalInst}
                  onChange={e => setNewDebtTotalInst(parseInt(e.target.value, 10))}
                  className="p-3 border rounded-lg text-sm bg-white font-medium text-gray-800 outline-none w-full"
                >
                  {INSTALLMENT_OPTIONS.map(num => (
                    <option key={num} value={num}>{num} cuotas</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase">Cuotas Pagadas</label>
                <select
                  value={newDebtPaidInst}
                  onChange={e => setNewDebtPaidInst(parseInt(e.target.value, 10))}
                  className="p-3 border rounded-lg text-sm bg-white font-medium text-gray-800 outline-none w-full"
                >
                  {Array.from({ length: newDebtTotalInst + 1 }, (_, i) => i).map(num => (
                    <option key={num} value={num}>{num} pagadas</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase">Fecha de Corte / Pago</label>
              <select
                value={newDebtDueDate}
                onChange={e => setNewDebtDueDate(e.target.value)}
                className="p-3 border rounded-lg text-sm bg-white font-medium text-gray-800 outline-none w-full"
              >
                {DUE_DATE_OPTIONS.map(dateOpt => (
                  <option key={dateOpt} value={dateOpt}>{dateOpt}</option>
                ))}
              </select>
            </div>

            <button type="submit" className={`py-3 rounded-lg font-medium text-sm shadow-sm text-white ${editingDebtId ? 'bg-green-600' : 'bg-orange-600'}`}>
              {editingDebtId ? 'Actualizar Deuda' : 'Guardar Deuda'}
            </button>
          </form>

          {/* Listado / Tabla de Deudas Reales */}
          <h2 className="text-md font-semibold mb-3 text-gray-700">Control de Deudas y Cuotas</h2>
          <div className="flex flex-col gap-3 mb-6">
            {debts.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4 bg-white rounded-xl">No hay deudas registradas</p>
            )}
            {debts.map(debt => {
              const remaining = Math.max(0, debt.totalAmount - debt.paidAmount);
              const remainingInstallments = Math.max(0, debt.totalInstallments - debt.paidInstallments);
              const progress = debt.totalAmount > 0 ? Math.min(100, (debt.paidAmount / debt.totalAmount) * 100) : 0;
              const isPaidOff = remaining === 0 || remainingInstallments === 0;

              return (
                <div key={debt.id} className={`bg-white p-4 rounded-xl shadow-sm border flex flex-col gap-3 ${editingDebtId === debt.id ? 'border-orange-500 bg-orange-50/10' : ''}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-gray-800 text-sm block">{debt.name}</span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${isPaidOff ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {isPaidOff ? '¡Deuda Cancelada! 🎉' : `Faltan ${remainingInstallments} cuotas (${formatCOP(remaining)})`}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEditDebt(debt)} className="text-orange-600 hover:text-orange-800 text-xs font-bold px-2 py-1 bg-orange-50 rounded">
                        Editar
                      </button>
                      <button onClick={() => deleteDebt(debt.id)} className="text-red-400 hover:text-red-600 text-xs font-bold px-2 py-1 bg-red-50 rounded">
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg gap-2">
                    <div>Total Deuda: <strong className="text-gray-800 block">{formatCOP(debt.totalAmount)}</strong></div>
                    <div>Pagado: <strong className="text-emerald-600 block">{formatCOP(debt.paidAmount)}</strong></div>
                    <div>Cuota Mensual: <strong className="text-blue-600 block">{formatCOP(debt.monthlyPayment)}</strong></div>
                    <div>Cuotas Pagadas: <strong className="text-purple-600 block">{debt.paidInstallments} de {debt.totalInstallments}</strong></div>
                    <div>Cuotas Debidas: <strong className="text-red-600 block">{remainingInstallments} cuotas restantes</strong></div>
                    <div>Corte: <strong className="text-gray-700 block">{debt.dueDate}</strong></div>
                  </div>

                  {/* Barra de Progreso de Pago */}
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{progress.toFixed(1)}% pagado</span>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        const nextPaidInst = Math.min(debt.totalInstallments, debt.paidInstallments + 1);
                        const nextPaidAmount = Math.min(debt.totalAmount, debt.paidAmount + debt.monthlyPayment);
                        setDebts(debts.map(d => d.id === debt.id ? { ...d, paidAmount: nextPaidAmount, paidInstallments: nextPaidInst } : d));
                      }} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded font-bold text-gray-700">+ Pagar Cuota</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* Pestaña de Resumen Anual */}
          <div className="bg-white p-4 rounded-xl shadow-sm border mb-4">
            <h2 className="text-md font-bold text-gray-800 mb-1">Recopilación y Balance Anual ({budgetDate})</h2>
            <p className="text-xs text-gray-500 mb-4">Revisa el comportamiento mes a mes para identificar en qué periodos tuviste mayores gastos y qué puedes mejorar.</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <div className="bg-green-50 p-3 rounded-lg text-center border border-green-100">
                <p className="text-[10px] text-gray-500 uppercase font-bold">Total Ingresos Anual</p>
                <p className="text-sm sm:text-base font-bold text-green-600 mt-1">{formatCOP(grandAnnualIncome)}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center border border-red-100">
                <p className="text-[10px] text-gray-500 uppercase font-bold">Total Gastos Anual</p>
                <p className="text-sm sm:text-base font-bold text-red-600 mt-1">{formatCOP(grandAnnualExpense)}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg text-center border border-emerald-100">
                <p className="text-[10px] text-gray-500 uppercase font-bold">Total Ahorros Anual</p>
                <p className="text-sm sm:text-base font-bold text-emerald-600 mt-1">{formatCOP(grandAnnualSavings)}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-100">
                <p className="text-[10px] text-gray-500 uppercase font-bold">Balance Neto Anual</p>
                <p className={`text-sm sm:text-base font-bold mt-1 ${grandAnnualNet >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCOP(grandAnnualNet)}</p>
              </div>
            </div>
          </div>

          {/* Tabla Desglosada Mes a Mes */}
          <div className="bg-white rounded-xl shadow-sm overflow-x-auto mb-4 border">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-100 text-[11px] text-gray-600 uppercase">
                  <th className="p-3">Mes</th>
                  <th className="p-3">Ingresos</th>
                  <th className="p-3">Gastos</th>
                  <th className="p-3">Ahorros</th>
                  <th className="p-3">Deudas</th>
                  <th className="p-3">Neto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {annualSummary.map(row => (
                  <tr key={row.month} className="hover:bg-gray-50">
                    <td className="p-3 font-bold text-gray-800">{row.month}</td>
                    <td className="p-3 font-semibold text-green-600">{formatCOP(row.income)}</td>
                    <td className="p-3 font-semibold text-red-600">{formatCOP(row.expense)}</td>
                    <td className="p-3 font-semibold text-emerald-600">{formatCOP(row.savings)}</td>
                    <td className="p-3 font-semibold text-orange-600">{formatCOP(row.debts)}</td>
                    <td className={`p-3 font-bold ${row.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCOP(row.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sugerencias Automáticas para Mejorar */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 rounded-2xl shadow-md mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-200 mb-2">💡 Sugerencias Inteligentes para Mejorar</h3>
            <ul className="text-xs space-y-2 opacity-90 leading-relaxed">
              <li>• <strong>Control de Deudas y Suscripciones:</strong> Procura destinar un tope máximo del 30% de tus ingresos a deudas para evitar sobrecargas financieras a fin de año.</li>
              <li>• <strong>Consistencia en el Ahorro:</strong> Intenta separar al menos un monto fijo cada mes apenas recibas tus ingresos, antes de realizar gastos operativos o de ocio.</li>
              <li>• <strong>Evaluación de Meses Críticos:</strong> Revisa en la tabla superior qué meses registraron un balance negativo y anticipa recortes en rubros de "Otros Gastos" para el próximo periodo.</li>
            </ul>
          </div>
        </>
      )}

      {/* Modal / Ventana Detallada al hacer clic en las tarjetas de resumen */}
      {modalType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 max-w-lg w-full shadow-xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="font-bold text-gray-800 text-base">
                Detalle de <span className="text-blue-600">{modalType}</span> ({currentMonth})
              </h3>
              <button 
                onClick={() => setModalType(null)} 
                className="text-gray-400 hover:text-gray-600 font-bold text-lg px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
              {getModalTransactions().length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">No hay registros detallados en esta categoría para {currentMonth}.</p>
              ) : (
                getModalTransactions().map(item => (
                  <div key={item.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">{item.category}</p>
                      <p className="text-sm font-medium text-gray-800">{item.desc}</p>
                    </div>
                    <span className={`text-sm font-bold ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {item.type === 'income' ? '+' : '-'}{formatCOP(item.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-600">Total en {modalType}:</span>
              <span className="text-base font-bold text-gray-800">
                {formatCOP(
                  modalType === 'Ingresos' ? totalIncome :
                  modalType === 'Gastos' ? totalGastosMes :
                  modalType === 'Ahorros' ? totalAhorrosMes : totalDeudasMes
                )}
              </span>
            </div>

            <button
              onClick={() => setModalType(null)}
              className="mt-4 w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium text-sm shadow-sm"
            >
              Cerrar Detalle
            </button>
          </div>
        </div>
      )}

    </div>
  );
}