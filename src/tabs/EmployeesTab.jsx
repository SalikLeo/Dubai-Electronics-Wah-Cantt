import React, { useState, useMemo } from 'react';
import { Plus, Banknote, Trash2, History, X, Calendar, Edit2, Search, Printer } from 'lucide-react';
import { useDialog } from '../components/DialogProvider.jsx';

export default function EmployeesTab({ data, saveData, activeBranch }) {
  const { alert, confirm } = useDialog();
  const currentYM = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(currentYM);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommModal, setShowCommModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  
  const [empForm, setEmpForm] = useState({ name: '', baseSalary: '', status: 'active' });
  const [editForm, setEditForm] = useState({ id: '', name: '', baseSalary: '', status: 'active' });
  const [commForm, setCommForm] = useState({ amount: '', note: '' });
  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', note: '' });

  const getBaseSalaryForMonth = (emp, monthStr) => {
    if (!emp.salaryHistory || emp.salaryHistory.length === 0) {
      return emp.baseSalary || 0;
    }
    const sortedHistory = [...emp.salaryHistory].sort((a, b) => b.startMonth.localeCompare(a.startMonth));
    const matchedRecord = sortedHistory.find(r => r.startMonth <= monthStr);
    return matchedRecord ? matchedRecord.salary : (emp.baseSalary || 0);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const baseSal = Number(empForm.baseSalary);
    const newEmp = {
      id: Date.now().toString(),
      name: empForm.name,
      baseSalary: baseSal,
      accruedSalary: baseSal,
      status: empForm.status,
      inactivatedMonth: empForm.status === 'inactive' ? (selectedMonth || currentYM) : undefined,
      salaryHistory: [{ startMonth: selectedMonth || currentYM, salary: baseSal }],
      history: []
    };
    saveData({ ...data, employees: [...data.employees, newEmp] });
    setShowAddModal(false);
    setEmpForm({ name: '', baseSalary: '', status: 'active' });
  };

  const openEditModal = (emp) => {
    setEditForm({
      id: emp.id,
      name: emp.name,
      baseSalary: getBaseSalaryForMonth(emp, selectedMonth),
      status: emp.status || 'active'
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const updatedEmps = data.employees.map(emp => {
      if (emp.id === editForm.id) {
        const isNowInactive = editForm.status === 'inactive';
        const wasInactive = emp.status === 'inactive';
        let inactivatedMonth = emp.inactivatedMonth;
        if (isNowInactive && !wasInactive) {
          inactivatedMonth = selectedMonth || currentYM;
        } else if (!isNowInactive) {
          inactivatedMonth = undefined;
        }

        const newSal = Number(editForm.baseSalary);
        const oldSalForSelectedMonth = getBaseSalaryForMonth(emp, selectedMonth);
        const diff = newSal - oldSalForSelectedMonth;

        let historyCopy = emp.salaryHistory ? [...emp.salaryHistory] : [];
        if (historyCopy.length === 0 && emp.baseSalary) {
          historyCopy.push({ startMonth: '2020-01', salary: emp.baseSalary });
        }

        const exactMatchIndex = historyCopy.findIndex(h => h.startMonth === selectedMonth);
        if (exactMatchIndex >= 0) {
          historyCopy[exactMatchIndex].salary = newSal;
        } else {
          historyCopy.push({ startMonth: selectedMonth, salary: newSal });
        }
        historyCopy.sort((a, b) => a.startMonth.localeCompare(b.startMonth));

        return {
          ...emp,
          name: editForm.name,
          baseSalary: newSal,
          accruedSalary: Math.max(0, emp.accruedSalary + diff),
          status: editForm.status,
          inactivatedMonth: inactivatedMonth,
          salaryHistory: historyCopy
        };
      }
      return emp;
    });
    saveData({ ...data, employees: updatedEmps });
    setShowEditModal(false);
  };

  const handleCommSubmit = (e) => {
    e.preventDefault();
    const updatedEmps = data.employees.map(emp => {
      if (emp.id === selectedEmpId) {
        return {
          ...emp,
          accruedSalary: emp.accruedSalary + Number(commForm.amount),
          history: [{ date: new Date().toISOString(), type: 'Commission', amount: Number(commForm.amount), note: commForm.note }, ...(emp.history || [])]
        };
      }
      return emp;
    });
    saveData({ ...data, employees: updatedEmps });
    setShowCommModal(false);
    setCommForm({ amount: '', note: '' });
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    const emp = data.employees.find(e => e.id === selectedEmpId);
    if (!emp) return;

    const amountToPay = Number(payForm.amount);
    if (amountToPay <= 0) return await alert("Enter a valid payout amount");

    const confirmed = await confirm(`Pay Rs ${amountToPay.toLocaleString('en-IN')} to ${emp.name}? This will record an expense and deduct it from their accrued salary.`);
    if (!confirmed) return;

    // 1. Record Expense
    const newExpense = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      description: `Salary Payout: ${emp.name}`,
      amount: amountToPay,
      remarks: payForm.note || 'Monthly Payout'
    };

    // 2. Update Employee
    const updatedEmps = data.employees.map(e => {
      if (e.id === emp.id) {
        const newAccrued = e.accruedSalary - amountToPay;
        const finalAccrued = newAccrued <= 0 ? getBaseSalaryForMonth(e, selectedMonth) : newAccrued;
        return {
          ...e,
          accruedSalary: finalAccrued,
          history: [{ date: new Date().toISOString(), type: 'Paid Salary', amount: amountToPay, note: payForm.note || 'Monthly Payout' }, ...(e.history || [])]
        };
      }
      return e;
    });

    saveData({ 
      ...data, 
      expenses: [newExpense, ...data.expenses],
      employees: updatedEmps
    });
    setShowPayModal(false);
    setPayForm({ amount: '', note: '' });
    await alert('Salary Paid Successfully!');
  };

  const deleteEmp = async (id) => {
    if (await confirm('Delete this employee?')) {
      saveData({ ...data, employees: data.employees.filter(e => e.id !== id) });
    }
  };

  const deleteTransaction = async (empId, txIndexInFullHistory) => {
    if (await confirm('Delete this transaction entry?')) {
      const updatedEmps = data.employees.map(emp => {
        if (emp.id === empId) {
          const targetTx = emp.history[txIndexInFullHistory];
          let newAccrued = emp.accruedSalary;
          if (targetTx && targetTx.type === 'Commission') {
            newAccrued = Math.max(0, newAccrued - Number(targetTx.amount));
          }
          const newHistory = emp.history.filter((_, idx) => idx !== txIndexInFullHistory);
          return {
            ...emp,
            accruedSalary: newAccrued,
            history: newHistory
          };
        }
        return emp;
      });
      saveData({ ...data, employees: updatedEmps });
    }
  };

  const getEmpTransactions = (emp, monthStr) => {
    if (!emp.history) return [];
    if (!monthStr) return emp.history;
    const [y, m] = monthStr.split('-').map(Number);
    return emp.history.filter(h => {
      const d = new Date(h.date);
      return d.getFullYear() === y && (d.getMonth() + 1) === m;
    });
  };

  // Filter employees: If inactive, do not show in future months after deactivation
  const visibleEmployees = useMemo(() => {
    let filtered = data.employees.filter(emp => {
      if (searchQuery && !emp.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (emp.status === 'inactive') {
        const inactivated = emp.inactivatedMonth || currentYM;
        if (selectedMonth && selectedMonth > inactivated) {
          return false;
        }
      }
      return true;
    });

    if (sortBy === 'latest') {
      filtered.sort((a, b) => Number(b.id) - Number(a.id));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => Number(a.id) - Number(b.id));
    } else if (sortBy === 'name-asc') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'salary-high') {
      filtered.sort((a, b) => b.baseSalary - a.baseSalary);
    } else if (sortBy === 'salary-low') {
      filtered.sort((a, b) => a.baseSalary - b.baseSalary);
    }

    return filtered;
  }, [data.employees, selectedMonth, currentYM, searchQuery, sortBy]);

  const selectedEmp = data.employees.find(e => e.id === selectedEmpId);
  const selectedEmpTxs = selectedEmp ? getEmpTransactions(selectedEmp, selectedMonth) : [];

  return (
    <>
    <div className={`h-full flex flex-col p-6 print-content ${showPrintPreview ? 'print-hidden' : ''}`}>
      <div className="flex justify-between items-center mb-6 print-hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Employees</h1>
          <p className="text-gray-500">Manage staff, commissions, and salary payouts</p>
        </div>
        <div className="flex gap-3 items-center">

          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-semibold text-gray-600 uppercase">Month:</span>
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(e.target.value)}
              className="text-sm font-medium text-gray-800 outline-none bg-transparent cursor-pointer"
            />
            {selectedMonth !== currentYM && (
              <button 
                onClick={() => setSelectedMonth(currentYM)}
                className="text-gray-400 hover:text-red-500 hover:bg-gray-100 p-0.5 rounded-full transition ml-1"
                title="Reset to current month"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition">
            <Plus className="w-4 h-4" /> Add Employee
          </button>
          <button onClick={() => setShowPrintPreview(true)} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {/* Search and Sort Row */}
      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search employees..." 
            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className="border border-gray-300 rounded-lg px-4 py-2 bg-white text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
        >
          <option value="latest">Latest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="salary-high">Salary (High to Low)</option>
          <option value="salary-low">Salary (Low to High)</option>
        </select>
      </div>

      {/* Employees Table */}
      <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-900 text-white sticky top-0 text-sm uppercase tracking-wider shadow-sm">
            <tr>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold text-center w-12">#</th>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold">Employee</th>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold text-right">Base Salary</th>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold text-right">Commissions</th>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold text-right">Total Salary</th>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold text-right">Paid</th>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold text-center w-24">Status</th>
              <th className="py-2.5 px-2 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleEmployees.map((emp, index) => {
              const txs = getEmpTransactions(emp, selectedMonth);
              const commInMonth = txs.filter(t => t.type === 'Commission').reduce((sum, t) => sum + Number(t.amount || 0), 0);
              const paidInMonth = txs.filter(t => t.type === 'Paid Salary').reduce((sum, t) => sum + Number(t.amount || 0), 0);
              const isInactive = emp.status === 'inactive';
              const baseSalaryInMonth = getBaseSalaryForMonth(emp, selectedMonth);
              const totalSalary = baseSalaryInMonth + commInMonth;

              return (
                <tr key={emp.id} className={`border-b border-gray-100 hover:bg-slate-50/80 transition ${isInactive ? 'bg-gray-50/70 text-gray-500' : ''}`}>
                  <td className="py-0.5 px-1.5 border-r border-gray-200 text-center font-bold text-gray-500 text-xs">{index + 1}</td>
                  <td className="py-0.5 px-1.5 border-r border-gray-200 font-bold text-gray-900 text-base">{emp.name}</td>
                  <td className="py-0.5 px-1.5 border-r border-gray-200 text-right font-medium text-gray-700">Rs {baseSalaryInMonth.toLocaleString('en-IN')}</td>
                  <td className="py-0.5 px-1.5 border-r border-gray-200 text-right font-semibold text-blue-700">Rs {commInMonth.toLocaleString('en-IN')}</td>
                  <td className="py-0.5 px-1.5 border-r border-gray-200 text-right font-bold text-blue-600 text-base">Rs {totalSalary.toLocaleString('en-IN')}</td>
                  <td className="py-0.5 px-1.5 border-r border-gray-200 text-right font-semibold text-green-700">Rs {paidInMonth.toLocaleString('en-IN')}</td>
                  <td className="py-0.5 px-1.5 border-r border-gray-200 text-center font-bold">
                    {paidInMonth >= totalSalary ? (
                      <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-xs border border-green-200">Paid</span>
                    ) : (
                      <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-full text-xs border border-red-200">Unpaid</span>
                    )}
                  </td>
                  <td className="p-2">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => { setSelectedEmpId(emp.id); setShowCommModal(true); }}
                        className="bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded-md text-xs font-semibold transition"
                        title="Add Commission"
                      >
                        + Comm
                      </button>
                      <button 
                        onClick={() => { 
                          setSelectedEmpId(emp.id); 
                          const unpaidForMonth = Math.max(0, totalSalary - paidInMonth);
                          setPayForm({ amount: unpaidForMonth.toString(), note: 'Monthly Payout' }); 
                          setShowPayModal(true); 
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition shadow-sm"
                        title="Pay Accrued Salary"
                      >
                        <Banknote className="w-3.5 h-3.5" /> Pay
                      </button>
                      <button 
                        onClick={() => { setSelectedEmpId(emp.id); setShowTxModal(true); }} 
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition"
                        title="View Transactions"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openEditModal(emp)} 
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition"
                        title="Edit Employee"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteEmp(emp.id)} 
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition"
                        title="Delete Employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {visibleEmployees.length === 0 && (
              <tr>
                <td colSpan={6} className="py-0.5 px-1.5 text-center text-gray-400">
                  No employees found for {selectedMonth}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Add Employee</h2>
            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Name</label>
                <input type="text" className="w-full border rounded-lg p-2" value={empForm.name} onChange={e => setEmpForm({...empForm, name: e.target.value})} required/>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Base Salary (Per Month)</label>
                <input type="number" placeholder="0" className="w-full border rounded-lg p-2" value={empForm.baseSalary} onChange={e => setEmpForm({...empForm, baseSalary: e.target.value})} required/>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Status</label>
                <select 
                  className="w-full border rounded-lg p-2 bg-white text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                  value={empForm.status} 
                  onChange={e => setEmpForm({...empForm, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end mt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 font-medium hover:bg-gray-200 transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Edit Employee</h2>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Name</label>
                <input type="text" className="w-full border rounded-lg p-2" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required/>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Base Salary (Per Month)</label>
                <input type="number" placeholder="0" className="w-full border rounded-lg p-2" value={editForm.baseSalary} onChange={e => setEditForm({...editForm, baseSalary: e.target.value})} required/>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Status</label>
                <select 
                  className="w-full border rounded-lg p-2 bg-white text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                  value={editForm.status} 
                  onChange={e => setEditForm({...editForm, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">If marked inactive, this employee will not appear in future months.</p>
              </div>
              <div className="flex gap-3 justify-end mt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 font-medium hover:bg-gray-200 transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">Update Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Commission Modal */}
      {showCommModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Add Commission</h2>
            <form onSubmit={handleCommSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Amount</label>
                <input type="number" placeholder="0" className="w-full border rounded-lg p-2" value={commForm.amount} onChange={e => setCommForm({...commForm, amount: e.target.value})} required/>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Note (Optional)</label>
                <input type="text" className="w-full border rounded-lg p-2" value={commForm.note} onChange={e => setCommForm({...commForm, note: e.target.value})}/>
              </div>
              <div className="flex gap-3 justify-end mt-4">
                <button type="button" onClick={() => setShowCommModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 font-medium hover:bg-gray-200 transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">Add Commission</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Salary Modal */}
      {showPayModal && selectedEmp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-1 text-gray-800">Pay Salary</h2>
            <p className="text-xs text-gray-500 mb-4">Payout for <span className="font-semibold text-blue-600">{selectedEmp.name}</span></p>
            <form onSubmit={handlePaySubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Amount (Rs)</label>
                <input 
                  type="number" 
                  placeholder="0" 
                  className="w-full border rounded-lg p-2 font-semibold text-gray-800 focus:ring-2 focus:ring-green-500 outline-none" 
                  value={payForm.amount} 
                  onChange={e => setPayForm({...payForm, amount: e.target.value})} 
                  required
                />
                <span className="text-[10px] text-gray-500 mt-1 block">
                  Default: Unpaid balance for {selectedMonth} (Rs {
                    (() => {
                      const emp = selectedEmp;
                      const baseSalaryInMonth = getBaseSalaryForMonth(emp, selectedMonth);
                      const txs = getEmpTransactions(emp, selectedMonth);
                      const commInMonth = txs.filter(t => t.type === 'Commission').reduce((sum, t) => sum + Number(t.amount || 0), 0);
                      const paidInMonth = txs.filter(t => t.type === 'Paid Salary').reduce((sum, t) => sum + Number(t.amount || 0), 0);
                      return Math.max(0, (baseSalaryInMonth + commInMonth) - paidInMonth).toLocaleString('en-IN');
                    })()
                  })
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Note (Optional)</label>
                <input 
                  type="text" 
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none" 
                  value={payForm.note} 
                  onChange={e => setPayForm({...payForm, note: e.target.value})}
                />
              </div>
              <div className="flex gap-3 justify-end mt-4">
                <button type="button" onClick={() => setShowPayModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 font-medium hover:bg-gray-200 transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition">Confirm Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transactions List Modal */}
      {showTxModal && selectedEmp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowTxModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedEmp.name} - Transactions</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Filtered for: <span className="font-semibold text-blue-600">{selectedMonth || 'All Time'}</span> ({selectedEmpTxs.length} records)
                </p>
              </div>
              <button onClick={() => setShowTxModal(false)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 border border-gray-200 rounded-lg">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-900 text-white sticky top-0 text-sm uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-2 border-r border-slate-700 font-semibold text-center w-10">#</th>
                    <th className="py-2.5 px-2 border-r border-slate-700 font-semibold">Date</th>
                    <th className="py-2.5 px-2 border-r border-slate-700 font-semibold">Time</th>
                    <th className="py-2.5 px-2 border-r border-slate-700 font-semibold">Type / Desc</th>
                    <th className="py-2.5 px-2 border-r border-slate-700 font-semibold text-right">Amount</th>
                    <th className="py-2.5 px-2 font-semibold text-center w-12">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEmpTxs.map((tx, idx) => {
                    const fullIdx = selectedEmp.history.findIndex(h => h === tx);
                    const dateObj = new Date(tx.date);
                    return (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-0.5 px-1.5 border-r border-gray-200 text-center font-bold text-gray-500 text-xs">{idx + 1}</td>
                        <td className="py-0.5 px-1.5 border-r border-gray-200 text-gray-700 font-medium">{dateObj.toLocaleDateString()}</td>
                        <td className="py-0.5 px-1.5 border-r border-gray-200 text-gray-500 text-xs">{dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="py-0.5 px-1.5 border-r border-gray-200">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold mr-2 ${tx.type === 'Commission' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {tx.type}
                          </span>
                          <span className="text-gray-600 text-xs">{tx.note || '-'}</span>
                        </td>
                        <td className="py-0.5 px-1.5 border-r border-gray-200 text-right font-bold text-gray-900">Rs {Number(tx.amount).toLocaleString('en-IN')}</td>
                        <td className="py-0.5 px-1.5 text-center">
                          <button 
                            onClick={() => deleteTransaction(selectedEmp.id, fullIdx)} 
                            className="text-gray-400 hover:text-red-600 p-0.5 rounded hover:bg-red-50 transition"
                            title="Delete Entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {selectedEmpTxs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-0.5 px-1.5 text-center text-gray-400">
                        No transactions found for {selectedMonth}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-gray-200 flex justify-between items-center bg-gray-50 p-3 rounded-lg text-xs font-semibold">
              <div className="flex gap-4">
                <span>Total Commission: <span className="text-blue-600 font-bold">Rs {selectedEmpTxs.filter(t => t.type === 'Commission').reduce((sum, t) => sum + Number(t.amount || 0), 0).toLocaleString('en-IN')}</span></span>
                <span>Total Paid: <span className="text-green-600 font-bold">Rs {selectedEmpTxs.filter(t => t.type === 'Paid Salary').reduce((sum, t) => sum + Number(t.amount || 0), 0).toLocaleString('en-IN')}</span></span>
              </div>
              <button onClick={() => setShowTxModal(false)} className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Print Preview Modal */}
    {showPrintPreview && (
      <div className="fixed inset-0 bg-black/60 z-50 flex flex-col items-center justify-center p-4 print:static print:block print:p-0 print:bg-white" onClick={() => setShowPrintPreview(false)}>
        <div className="bg-slate-900 text-white rounded-t-xl w-full max-w-4xl px-6 py-3 flex justify-between items-center shadow-lg print-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-3">
            <Printer className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold">Print Preview - Employees Payroll Report</h2>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.print()} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg flex items-center gap-2 font-medium text-sm transition"
            >
              <Printer className="w-4 h-4" /> Print Now
            </button>
            <button 
              onClick={() => setShowPrintPreview(false)} 
              className="text-slate-400 hover:bg-slate-800 p-1.5 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="bg-slate-800 w-full max-w-4xl flex-1 overflow-auto p-6 rounded-b-xl flex justify-center items-start print:static print:block print:w-full print:max-w-none print:overflow-visible print:p-0 print:bg-white print:border-none print:shadow-none" onClick={e => e.stopPropagation()}>
          <div className="bg-white text-black p-8 shadow-2xl border w-full max-w-[210mm] min-h-[297mm] font-sans printable-area">
            <div>
              <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-wide">DUBAI ELECTRONICS</h1>
                  <p className="text-xs font-bold text-gray-500 tracking-wide uppercase mt-0.5">{activeBranch} Branch</p>
                  <p className="text-sm font-semibold text-gray-600 mt-1">Employees Payroll Report ({selectedMonth})</p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>Report Date: {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                  <p>Total Employees: {visibleEmployees.length}</p>
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse border border-gray-300 mb-6">
                <thead>
                  <tr className="bg-slate-800 text-white border-b border-gray-300">
                    <th className="py-2.5 px-2 border-r border-slate-700 text-center w-8">#</th>
                    <th className="py-2.5 px-2 border-r border-slate-700">Employee</th>
                    <th className="py-2.5 px-2 border-r border-slate-700 text-right">Base Salary</th>
                    <th className="py-2.5 px-2 border-r border-slate-700 text-right">Commissions</th>
                    <th className="py-2.5 px-2 border-r border-slate-700 text-right">Total Salary</th>
                    <th className="py-2.5 px-2 border-r border-slate-700 text-right">Paid</th>
                    <th className="py-2.5 px-2 text-center w-16">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleEmployees.map((emp, index) => {
                    const txs = getEmpTransactions(emp, selectedMonth);
                    const commInMonth = txs.filter(t => t.type === 'Commission').reduce((sum, t) => sum + Number(t.amount || 0), 0);
                    const paidInMonth = txs.filter(t => t.type === 'Paid Salary').reduce((sum, t) => sum + Number(t.amount || 0), 0);
                    const baseSalaryInMonth = getBaseSalaryForMonth(emp, selectedMonth);
                    const totalSalary = baseSalaryInMonth + commInMonth;

                    return (
                      <tr key={emp.id} className="border-b border-gray-200">
                        <td className="py-1 px-2 border-r border-gray-200 text-center text-gray-500 font-semibold">{index + 1}</td>
                        <td className="py-1 px-2 border-r border-gray-200 font-medium text-gray-800">{emp.name}</td>
                        <td className="py-1 px-2 border-r border-gray-200 text-right text-gray-700">Rs {baseSalaryInMonth.toLocaleString('en-IN')}</td>
                        <td className="py-1 px-2 border-r border-gray-200 text-right text-blue-700 font-medium">Rs {commInMonth.toLocaleString('en-IN')}</td>
                        <td className="py-1 px-2 border-r border-gray-200 text-right text-blue-800 font-bold">Rs {totalSalary.toLocaleString('en-IN')}</td>
                        <td className="py-1 px-2 border-r border-gray-200 text-right text-green-700 font-semibold">Rs {paidInMonth.toLocaleString('en-IN')}</td>
                        <td className="py-1 px-2 text-center font-semibold text-xs">
                          {paidInMonth >= totalSalary ? (
                            <span className="text-green-700 font-bold">Paid</span>
                          ) : (
                            <span className="text-red-600 font-bold">Unpaid</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  
                  <tr className="bg-gray-100 font-bold border-b border-gray-300">
                    <td colSpan={2} className="py-1.5 px-2 border-r border-gray-200 text-slate-800">Total Payroll</td>
                    <td className="py-1.5 px-2 border-r border-gray-200 text-right text-slate-800 font-bold">
                      Rs {visibleEmployees.reduce((sum, e) => sum + getBaseSalaryForMonth(e, selectedMonth), 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-1.5 px-2 border-r border-gray-200 text-right text-blue-800 font-bold">
                      Rs {visibleEmployees.reduce((sum, e) => {
                        const txs = getEmpTransactions(e, selectedMonth);
                        return sum + txs.filter(t => t.type === 'Commission').reduce((s, t) => s + Number(t.amount || 0), 0);
                      }, 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-1.5 px-2 border-r border-gray-200 text-right text-blue-900 font-bold">
                      Rs {visibleEmployees.reduce((sum, e) => {
                        const txs = getEmpTransactions(e, selectedMonth);
                        const comm = txs.filter(t => t.type === 'Commission').reduce((s, t) => s + Number(t.amount || 0), 0);
                        return sum + (getBaseSalaryForMonth(e, selectedMonth) + comm);
                      }, 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-1.5 px-2 border-r border-gray-200 text-right text-green-800 font-bold">
                      Rs {visibleEmployees.reduce((sum, e) => {
                        const txs = getEmpTransactions(e, selectedMonth);
                        return sum + txs.filter(t => t.type === 'Paid Salary').reduce((s, t) => s + Number(t.amount || 0), 0);
                      }, 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-1.5 px-2 text-center text-slate-500 font-normal">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
