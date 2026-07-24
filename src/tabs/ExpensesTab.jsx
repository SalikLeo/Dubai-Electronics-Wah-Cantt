import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Printer, Trash2, X, Search } from 'lucide-react';
import { useDialog } from '../components/DialogProvider.jsx';

export default function ExpensesTab({ data, saveData, activeBranch }) {
  const { alert, confirm } = useDialog();
  const location = useLocation();

  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (location.state?.openAddModal) {
      setShowAddModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const [filterType, setFilterType] = useState('Monthly');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');

  const todayYMD = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const currentYM = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState(todayYMD);
  const [selectedMonth, setSelectedMonth] = useState(currentYM);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState(todayYMD);
  const [endDate, setEndDate] = useState(todayYMD);

  const filterLabel = useMemo(() => {
    if (filterType === 'Daily') return `Daily (${selectedDate})`;
    if (filterType === 'Monthly') return `Monthly (${selectedMonth})`;
    if (filterType === 'Annual') return `Annual (${selectedYear})`;
    if (filterType === 'Custom') return `Custom (${startDate} to ${endDate})`;
    return 'All Time';
  }, [filterType, selectedDate, selectedMonth, selectedYear, startDate, endDate]);
  
  const [addForm, setAddForm] = useState({ 
    description: '', amount: '', remarks: '' 
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const newExpense = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      description: addForm.description,
      amount: Number(addForm.amount),
      remarks: addForm.remarks
    };

    saveData({ 
      ...data, 
      expenses: [newExpense, ...data.expenses]
    });
    
    setShowAddModal(false);
    setAddForm({ description: '', amount: '', remarks: '' });
  };

  const deleteExpense = async (id) => {
    if (await confirm("Delete this expense?")) {
      saveData({
        ...data,
        expenses: data.expenses.filter(e => e.id !== id)
      });
    }
  };

  const filteredExpenses = useMemo(() => {
    let result = [...data.expenses];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => (e.description && e.description.toLowerCase().includes(q)) || (e.remarks && e.remarks.toLowerCase().includes(q)));
    }

    if (filterType === 'Daily' && selectedDate) {
      result = result.filter(e => {
        const d = new Date(e.date);
        const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return ymd === selectedDate;
      });
    } else if (filterType === 'Monthly' && selectedMonth) {
      const [y, m] = selectedMonth.split('-').map(Number);
      result = result.filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === y && (d.getMonth() + 1) === m;
      });
    } else if (filterType === 'Annual' && selectedYear) {
      const y = Number(selectedYear);
      result = result.filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === y;
      });
    } else if (filterType === 'Custom' && startDate && endDate) {
      result = result.filter(e => {
        const d = new Date(e.date);
        const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return ymd >= startDate && ymd <= endDate;
      });
    }
    
    if (sortBy === 'latest') {
      result.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortBy === 'amount-high') {
      result.sort((a, b) => b.amount - a.amount);
    } else if (sortBy === 'amount-low') {
      result.sort((a, b) => a.amount - b.amount);
    }

    return result;
  }, [data.expenses, filterType, selectedDate, selectedMonth, selectedYear, startDate, endDate, searchQuery, sortBy]);

  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="h-full flex flex-col p-6 print-content">
      <div className="flex justify-between items-center mb-6 print-hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Expenses</h1>
          <p className="text-gray-500">Track shop expenses and salaries</p>
        </div>
        <div className="flex gap-3">

          <div className="flex gap-2 items-center">
            <select 
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white font-medium text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
              value={filterType} onChange={e => setFilterType(e.target.value)}
            >
              <option value="Monthly">Monthly</option>
              <option value="Daily">Daily</option>
              <option value="Annual">Annual</option>
              <option value="Custom">Custom Range</option>
              <option value="All Time">All Time</option>
            </select>

            {filterType === 'Daily' && (
              <input 
                type="date" 
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              />
            )}

            {filterType === 'Monthly' && (
              <input 
                type="month" 
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
              />
            )}

            {filterType === 'Annual' && (
              <input 
                type="number" 
                min="2000"
                max="2099"
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm font-medium text-gray-700 w-24 outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                placeholder="Year"
              />
            )}

            {filterType === 'Custom' && (
              <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg px-2 py-1 shadow-sm">
                <input 
                  type="date" 
                  className="bg-transparent text-xs font-medium text-gray-700 outline-none cursor-pointer"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
                <span className="text-xs text-gray-400 font-semibold">to</span>
                <input 
                  type="date" 
                  className="bg-transparent text-xs font-medium text-gray-700 outline-none cursor-pointer"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            )}
            {(filterType !== 'Monthly' || selectedMonth !== currentYM) && (
              <button 
                onClick={() => {
                  setFilterType('Monthly');
                  setSelectedMonth(currentYM);
                }}
                className="text-gray-400 hover:text-red-500 hover:bg-gray-100 p-0.5 rounded-full transition ml-1"
                title="Reset to current month"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button onClick={() => setShowAddModal(true)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition">
            <Plus className="w-4 h-4" /> Add Expense
          </button>
          <button onClick={() => setShowPrintPreview(true)} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-4 print-hidden">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search expenses..." 
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
          <option value="amount-high">Amount (High to Low)</option>
          <option value="amount-low">Amount (Low to High)</option>
        </select>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="w-full text-left border-collapse print-table">
          <thead className="bg-slate-900 text-white sticky top-0 print-header text-sm uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold text-center w-12">#</th>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold">Date</th>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold">Description</th>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold text-right">Amount</th>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold">Remarks</th>
              <th className="py-2.5 px-2 print-hidden w-12 text-center"></th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map((expense, index) => (
              <tr key={expense.id} className="hover:bg-slate-50 border-b border-gray-200 group">
                <td className="py-0.5 px-1.5 border-r border-gray-200 text-center font-bold text-gray-500 text-xs">{index + 1}</td>
                <td className="py-0.5 px-1.5 border-r border-gray-200 text-sm text-gray-600">{new Date(expense.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td className="py-0.5 px-1.5 border-r border-gray-200 font-medium text-gray-900">{expense.description}</td>
                <td className="py-0.5 px-1.5 border-r border-gray-200 text-right font-bold text-red-600">Rs {expense.amount.toLocaleString('en-IN')}</td>
                <td className="py-0.5 px-1.5 border-r border-gray-200 text-sm text-gray-500">{expense.remarks}</td>
                <td className="py-0.5 px-1.5 text-center print-hidden">
                  <button onClick={() => deleteExpense(expense.id)} className="text-red-500 p-1 hover:bg-red-50 rounded transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredExpenses.length === 0 && (
              <tr><td colSpan={6} className="py-0.5 px-1.5 text-center text-gray-500">No expenses found for this period.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-red-50 border border-red-100 p-6 rounded-xl flex justify-between items-center print-hidden">
        <div>
          <h3 className="text-red-800 text-sm font-semibold tracking-wider uppercase mb-1">Total Expenses</h3>
          <p className="text-xs text-red-600">For selected period</p>
        </div>
        <div className="text-3xl font-bold text-red-600">
          Rs {totalExpense.toLocaleString('en-IN')}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print-hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Add Expense</h2>
            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" className="w-full border rounded p-2" value={addForm.description} onChange={e => setAddForm({...addForm, description: e.target.value})} required placeholder="e.g. Electricity Bill" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input type="number" placeholder="0" className="w-full border rounded p-2" value={addForm.amount} onChange={e => setAddForm({...addForm, amount: e.target.value})} required/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (Optional)</label>
                <input type="text" className="w-full border rounded p-2" value={addForm.remarks} onChange={e => setAddForm({...addForm, remarks: e.target.value})} />
              </div>
              <div className="flex gap-3 justify-end mt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Print Preview Modal */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col items-center justify-center p-4 print-hidden" onClick={() => setShowPrintPreview(false)}>
          <div className="bg-slate-900 text-white rounded-t-xl w-full max-w-4xl px-6 py-3 flex justify-between items-center shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <Printer className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold">Print Preview - Expenses Report ({filterLabel})</h2>
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

          <div className="bg-slate-800 w-full max-w-4xl flex-1 overflow-auto p-6 rounded-b-xl flex justify-center" onClick={e => e.stopPropagation()}>
            <div className="bg-white text-black p-8 shadow-2xl border w-full max-w-[210mm] min-h-[297mm] font-sans printable-area flex flex-col justify-between">
              <div>
                <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-wide">DUBAI ELECTRONICS</h1>
                    <p className="text-xs font-bold text-gray-500 tracking-wide uppercase mt-0.5">{activeBranch} Branch</p>
                    <p className="text-sm font-semibold text-gray-600 mt-1">Expenses Report ({filterLabel})</p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>Date: {new Date().toLocaleDateString()}</p>
                    <p>Total Records: {filteredExpenses.length}</p>
                  </div>
                </div>

                <table className="w-full text-left text-xs border-collapse border border-gray-300 mb-6">
                  <thead>
                    <tr className="bg-slate-800 text-white border-b border-gray-300">
                      <th className="py-2.5 px-2 border-r border-slate-700 text-center w-8">#</th>
                      <th className="py-2.5 px-2 border-r border-slate-700">Date</th>
                      <th className="py-2.5 px-2 border-r border-slate-700">Description</th>
                      <th className="py-2.5 px-2 border-r border-slate-700 text-right">Amount</th>
                      <th className="py-2.5 px-2">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((expense, i) => (
                      <tr key={expense.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50 border-b border-gray-200'}>
                        <td className="py-0.5 px-1.5 border-r border-gray-200 text-center font-semibold text-gray-500">{i + 1}</td>
                        <td className="py-0.5 px-1.5 border-r border-gray-200">{new Date(expense.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td className="py-0.5 px-1.5 border-r border-gray-200 font-medium">{expense.description}</td>
                        <td className="py-0.5 px-1.5 border-r border-gray-200 text-right font-bold text-red-600">Rs {expense.amount.toLocaleString('en-IN')}</td>
                        <td className="py-0.5 px-1.5 text-gray-600">{expense.remarks}</td>
                      </tr>
                    ))}
                    {filteredExpenses.length === 0 && (
                      <tr><td colSpan={5} className="py-0.5 px-1.5 text-center text-gray-500">No expenses found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t-2 border-slate-900 pt-4 mt-6">
                <div className="flex justify-between items-center bg-red-50 border border-red-200 p-4 rounded text-red-800">
                  <div>
                    <h3 className="text-xs uppercase font-bold">Total Expenses</h3>
                    <p className="text-[10px] text-red-600">For {filterLabel}</p>
                  </div>
                  <div className="text-xl font-bold text-red-600">
                    Rs {totalExpense.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
