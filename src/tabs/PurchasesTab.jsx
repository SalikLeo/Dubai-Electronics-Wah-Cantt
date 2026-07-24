import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Plus, Printer, Trash2, ChevronDown, X } from 'lucide-react';
import { useDialog } from '../components/DialogProvider.jsx';

const formatIndianNumber = (val) => {
  if (val === undefined || val === null || val === '') return '';
  const numStr = String(val).replace(/,/g, '');
  const num = Number(numStr);
  if (isNaN(num)) return '';
  return num.toLocaleString('en-IN');
};

export default function PurchasesTab({ data, saveData, activeBranch }) {
  const { alert, confirm } = useDialog();
  const location = useLocation();

  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState('Daily'); // Monthly, Daily, Annual, Custom, All Time
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const todayYMD = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const currentYM = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState(todayYMD);
  const [daysAgoInput, setDaysAgoInput] = useState('');

  const getDaysAgo = (dateStr) => {
    if (!dateStr) return 0;
    const todayParts = todayYMD.split('-').map(Number);
    const dateParts = dateStr.split('-').map(Number);
    const todayDate = new Date(todayParts[0], todayParts[1] - 1, todayParts[2]);
    const selDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const diffTime = todayDate - selDate;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  };

  useEffect(() => {
    const targetDays = getDaysAgo(selectedDate);
    const expectedValue = targetDays === 0 ? '' : String(targetDays);
    if (daysAgoInput !== expectedValue) {
      setDaysAgoInput(expectedValue);
    }
  }, [selectedDate, todayYMD]);

  const handleDaysAgoChange = (e) => {
    const val = e.target.value;
    setDaysAgoInput(val);
    if (val === '' || parseInt(val, 10) === 0) {
      setSelectedDate(todayYMD);
      return;
    }
    const days = parseInt(val, 10);
    if (!isNaN(days) && days >= 0) {
      const d = new Date();
      d.setDate(d.getDate() - days);
      const targetYMD = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      setSelectedDate(targetYMD);
    }
  };

  const formatDateDMY = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-').map(Number);
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const formatReportDate = (dateYMD) => {
    if (!dateYMD) return '';
    const diffDays = getDaysAgo(dateYMD);
    if (diffDays > 0) {
      return `${formatDateDMY(dateYMD)} to ${formatDateDMY(todayYMD)}`;
    }
    return formatDateDMY(dateYMD);
  };

  const [selectedMonth, setSelectedMonth] = useState(currentYM);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState(todayYMD);
  const [endDate, setEndDate] = useState(todayYMD);

  const filterLabel = useMemo(() => {
    if (filterType === 'Daily') return `Daily (${formatReportDate(selectedDate)})`;
    if (filterType === 'Monthly') return `Monthly (${selectedMonth})`;
    if (filterType === 'Annual') return `Annual (${selectedYear})`;
    if (filterType === 'Custom') return `Custom (${startDate} to ${endDate})`;
    return 'All Time';
  }, [filterType, selectedDate, selectedMonth, selectedYear, startDate, endDate]);

  const [addForm, setAddForm] = useState({
    stockId: '',
    qty: '',
    unitCost: '',
    desc: ''
  });
  const [stockSearch, setStockSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [receiptTx, setReceiptTx] = useState(null);

  const resetForm = () => {
    setAddForm({ stockId: '', qty: '', unitCost: '', desc: '' });
    setStockSearch('');
    setIsDropdownOpen(false);
  };

  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const stockItem = data.stock.find(s => s.id === addForm.stockId);
    if (!stockItem) return await alert("Select a valid item");

    const qty = Number(addForm.qty);
    if (qty <= 0) return await alert("Enter a valid quantity");

    const addedNtd = Number(addForm.unitCost || 0);
    if (addedNtd < 0) return await alert("Cost price cannot be negative");

    const currentNtd = stockItem.ntd || 0;
    const newNtd = currentNtd === 0 ? addedNtd : (currentNtd + addedNtd) / 2;

    const updatedStock = data.stock.map(item =>
      item.id === stockItem.id ? {
        ...item,
        in: (item.in || 0) + qty,
        ntd: newNtd
      } : item
    );

    const newTx = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      stockId: stockItem.id,
      type: 'Stock In',
      qty: qty,
      details: `Cost: Rs ${addedNtd.toLocaleString('en-IN')} (NTD)${addForm.desc ? ` - ${addForm.desc}` : ''}`,
      prevNtd: currentNtd,
      newNtd: newNtd
    };

    saveData({
      ...data,
      stock: updatedStock,
      history: [...(data.history || []), newTx]
    });

    setShowAddModal(false);
    resetForm();
  };

  const deletePurchaseTransaction = async (tx) => {
    if (await confirm("Are you sure you want to delete this purchase transaction?")) {
      const updatedHistory = (data.history || []).filter(h => h.id !== tx.id);
      const stockItem = data.stock.find(s => s.id === tx.stockId);

      if (stockItem) {
        let updatedItem = { ...stockItem };

        if (tx.type === 'Initial Stock') {
          updatedItem.x_b = 0;
        }

        const remainingStockIn = updatedHistory.filter(h => h.stockId === tx.stockId && h.type === 'Stock In');
        updatedItem.in = remainingStockIn.reduce((sum, h) => sum + Number(h.qty || 0), 0);

        const remainingItemHistory = updatedHistory.filter(h => h.stockId === tx.stockId);
        const itemSales = (data.sales || []).filter(s => s.stockId === tx.stockId);

        const allEvents = [
          ...remainingItemHistory.map(h => ({ ...h, eventType: 'history' })),
          ...itemSales.map(s => ({ ...s, eventType: 'sale' }))
        ].sort((a, b) => new Date(a.date) - new Date(b.date));

        let runningNtd = 0;
        let runningBlnc = 0;

        allEvents.forEach(event => {
          if (event.eventType === 'history') {
            if (event.type === 'Initial Stock') {
              let addedNtd = 0;
              const match = event.details.match(/Cost: Rs ([\d,.]+) \(NTD\)/);
              if (match) {
                addedNtd = parseFloat(match[1].replace(/,/g, ''));
              } else {
                addedNtd = updatedItem.ntd || 0;
              }
              runningNtd = addedNtd;
              runningBlnc = event.qty;
            } else if (event.type === 'Stock In') {
              let addedNtd = 0;
              const match = event.details.match(/Cost: Rs ([\d,.]+) \(NTD\)/);
              if (match) {
                addedNtd = parseFloat(match[1].replace(/,/g, ''));
              }
              runningNtd = runningNtd === 0 ? addedNtd : (runningNtd + addedNtd) / 2;
              runningBlnc += event.qty;
            } else if (event.type === 'Price Update') {
              let addedNtd = 0;
              const match = event.details.match(/Cost: Rs ([\d,.]+) \(NTD\)/);
              if (match) {
                addedNtd = parseFloat(match[1].replace(/,/g, ''));
                runningNtd = addedNtd;
              }
            }
          } else if (event.eventType === 'sale') {
            runningBlnc -= event.qty;
          }
        });

        updatedItem.ntd = runningNtd;

        const updatedStock = data.stock.map(item =>
          item.id === stockItem.id ? updatedItem : item
        );

        saveData({
          ...data,
          stock: updatedStock,
          history: updatedHistory
        });
      } else {
        saveData({
          ...data,
          history: updatedHistory
        });
      }
    }
  };

  const getUnitCost = (tx) => {
    if (tx.details && tx.details.includes('Cost: Rs ')) {
      const match = tx.details.match(/Cost: Rs ([\d,.]+) \(NTD\)/);
      if (match) {
        return parseFloat(match[1].replace(/,/g, ''));
      }
    }
    if (tx.newNtd !== undefined) return tx.newNtd;
    const stockItem = data.stock?.find(s => s.id === tx.stockId);
    return stockItem ? (stockItem.ntd || 0) : 0;
  };

  const getRemarks = (tx) => {
    if (!tx.details) return '';
    const idx = tx.details.indexOf('(NTD)');
    if (idx !== -1) {
      const part = tx.details.substring(idx + 5).trim();
      if (part.startsWith('-')) {
        return part.substring(1).trim();
      }
      return part;
    }
    return tx.details;
  };

  const categories = useMemo(() => {
    const set = new Set();
    (data.stock || []).forEach(item => {
      if (item.category) set.add(item.category);
    });
    return ['All', ...Array.from(set)];
  }, [data.stock]);

  const filteredPurchases = useMemo(() => {
    let result = (data.history || []).filter(h => h.type === 'Stock In' || h.type === 'Initial Stock');

    // Date Filter
    if (filterType === 'Daily' && selectedDate) {
      const diffDays = getDaysAgo(selectedDate);
      result = result.filter(h => {
        const d = new Date(h.date);
        const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (diffDays > 0) {
          return ymd >= selectedDate && ymd <= todayYMD;
        }
        return ymd === selectedDate;
      });
    } else if (filterType === 'Monthly' && selectedMonth) {
      const [y, m] = selectedMonth.split('-').map(Number);
      result = result.filter(h => {
        const d = new Date(h.date);
        return d.getFullYear() === y && (d.getMonth() + 1) === m;
      });
    } else if (filterType === 'Annual' && selectedYear) {
      const y = Number(selectedYear);
      result = result.filter(h => {
        const d = new Date(h.date);
        return d.getFullYear() === y;
      });
    } else if (filterType === 'Custom' && startDate && endDate) {
      result = result.filter(h => {
        const d = new Date(h.date);
        const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return ymd >= startDate && ymd <= endDate;
      });
    }

    // Map fields
    result = result.map(tx => {
      const stockItem = data.stock.find(s => s.id === tx.stockId);
      const unitCost = getUnitCost(tx);
      return {
        ...tx,
        model: stockItem ? stockItem.model : 'Unknown Item',
        category: stockItem ? (stockItem.category || 'Other') : 'Other',
        unitCost: unitCost,
        totalCost: unitCost * tx.qty,
        remarks: getRemarks(tx)
      };
    });

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(tx => tx.model.toLowerCase().includes(q) || tx.remarks.toLowerCase().includes(q));
    }

    // Category Filter
    if (selectedCategory !== 'All') {
      result = result.filter(tx => tx.category === selectedCategory);
    }

    // Sorting
    if (sortBy === 'latest') {
      result.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortBy === 'qtyDesc') {
      result.sort((a, b) => b.qty - a.qty);
    } else if (sortBy === 'qtyAsc') {
      result.sort((a, b) => a.qty - b.qty);
    } else if (sortBy === 'costDesc') {
      result.sort((a, b) => b.totalCost - a.totalCost);
    } else if (sortBy === 'costAsc') {
      result.sort((a, b) => a.totalCost - b.totalCost);
    }

    return result;
  }, [data.history, data.stock, filterType, selectedDate, selectedMonth, selectedYear, searchQuery, selectedCategory, startDate, endDate, sortBy, todayYMD]);

  // Totals
  const totals = useMemo(() => {
    return filteredPurchases.reduce((acc, tx) => {
      acc.cost += tx.totalCost;
      acc.qty += tx.qty;
      return acc;
    }, { cost: 0, qty: 0 });
  }, [filteredPurchases]);

  return (
    <>
    <div className={`h-full flex flex-col p-6 print-content ${(showPrintPreview || showReceiptPreview) ? 'print-hidden' : ''}`}>
      <div className="flex justify-between items-center mb-6 print-hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 font-sans">Purchases</h1>
          <p className="text-gray-500 font-sans">Record purchases and view history</p>
        </div>
        <div className="flex gap-3">
          <div className="flex gap-2 items-center">
            <select 
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white font-medium text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
              value={filterType} onChange={e => setFilterType(e.target.value)}
            >
              <option value="Daily">Daily</option>
              <option value="Monthly">Monthly</option>
              <option value="Annual">Annual</option>
              <option value="Custom">Custom Range</option>
              <option value="All Time">All Time</option>
            </select>

            {filterType === 'Daily' && (
              <>
                <input 
                  type="date" 
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                />
                <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm">
                  <span className="text-xs font-semibold text-gray-655 uppercase">Days Ago:</span>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="0"
                    value={daysAgoInput} 
                    onChange={handleDaysAgoChange}
                    className="w-12 text-sm font-medium text-gray-855 outline-none bg-transparent"
                  />
                </div>
                {getDaysAgo(selectedDate) > 0 && (
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-3 py-2 shadow-sm text-sm font-semibold">
                    <span>Range: {formatReportDate(selectedDate)}</span>
                  </div>
                )}
              </>
            )}

            {filterType === 'Monthly' && (
              <input 
                type="month" 
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
              />
            )}

            {filterType === 'Annual' && (
              <select 
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const y = (new Date().getFullYear() - 2 + i).toString();
                  return <option key={y} value={y}>{y}</option>;
                })}
              </select>
            )}

            {filterType === 'Custom' && (
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
                <span className="text-gray-400 font-semibold">to</span>
                <input 
                  type="date" 
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            )}
            {(filterType !== 'Daily' || selectedDate !== todayYMD) && (
              <button 
                onClick={() => {
                  setFilterType('Daily');
                  setSelectedDate(todayYMD);
                  setDaysAgoInput('');
                }}
                className="text-gray-400 hover:text-red-500 hover:bg-gray-100 p-0.5 rounded-full transition ml-1 cursor-pointer"
                title="Reset to today"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button 
            onClick={() => setShowAddModal(true)} 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold shadow-sm transition cursor-pointer text-sm font-sans"
          >
            <Plus className="w-4 h-4" /> New Purchase
          </button>
          
          <button 
            onClick={() => setShowPrintPreview(true)} 
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 font-semibold shadow-sm transition cursor-pointer text-sm font-sans"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-4 print-hidden">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search model or description..." 
            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-gray-800 placeholder-gray-400"
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Category Filter */}
        <select 
          className="border border-gray-300 rounded-lg px-4 py-2 bg-white text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
          ))}
        </select>

        {/* Sort By Filter */}
        <select 
          className="border border-gray-300 rounded-lg px-4 py-2 bg-white text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
        >
          <option value="latest">Latest First</option>
          <option value="oldest">Oldest First</option>
          <option value="qtyDesc">Quantity: High to Low</option>
          <option value="qtyAsc">Quantity: Low to High</option>
          <option value="costDesc">Cost: High to Low</option>
          <option value="costAsc">Cost: Low to High</option>
        </select>
      </div>

      {/* Purchases Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-auto print-hidden min-h-[400px]">
        {filteredPurchases.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
            <Search className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-sm font-medium">No purchases matched the current search criteria.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse border border-gray-200">
            <thead className="bg-slate-900 text-white sticky top-0 print-header shadow-sm text-sm uppercase tracking-wider whitespace-nowrap">
              <tr>
                <th className="py-2.5 px-2 border-r border-slate-700 text-center w-12 font-semibold">#</th>
                <th className="py-2.5 px-2 border-r border-slate-700 w-40 font-semibold">Date & Time</th>
                <th className="py-2.5 px-2 border-r border-slate-700 font-semibold">Model</th>
                <th className="py-2.5 px-2 border-r border-slate-700 w-32 font-semibold">Category</th>
                <th className="py-2.5 px-2 border-r border-slate-700 text-center w-20 font-semibold">Qty</th>
                <th className="py-2.5 px-2 border-r border-slate-700 text-right w-36 font-semibold">Unit Cost (NTD)</th>
                <th className="py-2.5 px-2 border-r border-slate-700 text-right w-40 font-semibold">Total Cost</th>
                <th className="py-2.5 px-2 border-r border-slate-700 font-semibold">Description</th>
                <th className="py-2.5 px-2 text-center w-24 print-hidden font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {filteredPurchases.map((tx, idx) => (
                <tr key={tx.id} className="hover:bg-slate-50 border-b border-gray-200 group">
                  <td className="py-0.5 px-1.5 border-r border-gray-200 text-center font-bold text-gray-500 text-xs">{idx + 1}</td>
                  <td className="py-0.5 px-1.5 border-r border-gray-200 text-sm text-gray-600 whitespace-nowrap">
                    {new Date(tx.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-0.5 px-1.5 border-r border-gray-200 font-bold text-gray-850">{tx.model}</td>
                  <td className="py-0.5 px-1.5 border-r border-gray-200 text-gray-600">{tx.category}</td>
                  <td className="py-0.5 px-1.5 border-r border-gray-200 text-center font-bold text-gray-700">{tx.qty}</td>
                  <td className="py-0.5 px-1.5 border-r border-gray-200 text-right font-semibold text-gray-800">
                    Rs {tx.unitCost.toLocaleString('en-IN')}
                  </td>
                  <td className="py-0.5 px-1.5 border-r border-gray-200 text-right font-bold text-blue-700">
                    Rs {tx.totalCost.toLocaleString('en-IN')}
                  </td>
                  <td className="py-0.5 px-1.5 border-r border-gray-200 text-gray-500 text-xs font-sans max-w-xs truncate" title={tx.remarks}>
                    {tx.remarks || '-'}
                  </td>
                  <td className="py-0.5 px-1.5 text-center print-hidden">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => { setReceiptTx(tx); setShowReceiptPreview(true); }} 
                        className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded transition" 
                        title="Print Transaction Details"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deletePurchaseTransaction(tx)} 
                        className="text-red-500 hover:bg-red-50 p-1.5 rounded transition" 
                        title="Delete Purchase Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 print-hidden">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <span className="text-xs uppercase font-bold text-gray-450 tracking-wider">Total Purchases Amount</span>
          <span className="text-2xl font-extrabold text-blue-700 mt-1 font-sans">
            Rs {totals.cost.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <span className="text-xs uppercase font-bold text-gray-450 tracking-wider">Total Items Purchased</span>
          <span className="text-2xl font-extrabold text-gray-800 mt-1 font-sans">
            {totals.qty.toLocaleString('en-IN')} Units
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <span className="text-xs uppercase font-bold text-gray-455 tracking-wider">Total Transactions</span>
          <span className="text-2xl font-extrabold text-gray-800 mt-1 font-sans">
            {filteredPurchases.length} Records
          </span>
        </div>
      </div>
    </div>

    {/* Add Purchase Modal */}
    {showAddModal && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 flex flex-col relative" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Add Purchase Transaction</h2>
            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Select Item</label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Search item model name..."
                  value={stockSearch}
                  onChange={e => {
                    setStockSearch(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                {addForm.stockId && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setAddForm(prev => ({ ...prev, stockId: '', unitCost: '' }));
                      setStockSearch('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-auto bg-white border border-gray-200 rounded-lg shadow-xl z-20 divide-y divide-gray-100">
                  {(() => {
                    const q = stockSearch.toLowerCase().trim();
                    const filtered = (data.stock || []).filter(item => item.model.toLowerCase().includes(q));

                    if (filtered.length === 0) {
                      return <div className="p-3 text-center text-sm text-gray-400">No items found</div>;
                    }

                    return filtered.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setAddForm(prev => ({ ...prev, stockId: item.id, unitCost: item.ntd || '' }));
                          setStockSearch(item.model);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm font-medium text-gray-800 flex justify-between items-center transition-colors"
                      >
                        <span>{item.model}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-mono">
                          NTD: Rs {(item.ntd || 0).toLocaleString('en-IN')}
                        </span>
                      </button>
                    ));
                  })()}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Purchase Qty</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  placeholder="e.g. 5"
                  value={addForm.qty}
                  onChange={e => setAddForm(prev => ({ ...prev, qty: e.target.value }))}
                  className="w-full px-4.5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Unit Cost (NTD)</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  placeholder="e.g. 14500"
                  value={addForm.unitCost}
                  onChange={e => setAddForm(prev => ({ ...prev, unitCost: e.target.value }))}
                  className="w-full px-4.5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description / Remarks</label>
              <textarea 
                placeholder="e.g. Purchased from wholesale branch"
                value={addForm.desc}
                onChange={e => setAddForm(prev => ({ ...prev, desc: e.target.value }))}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-850 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans resize-none"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 mt-2 border-t pt-4">
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)} 
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-semibold text-gray-750 transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold text-white transition cursor-pointer"
              >
                Save Purchase
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Filtered Purchases List Print Preview */}
    {showPrintPreview && (
      <div className="fixed inset-0 bg-black/60 z-50 flex flex-col items-center justify-center p-4 print:static print:block print:p-0 print:bg-white" onClick={() => setShowPrintPreview(false)}>
        <div className="bg-slate-900 text-white rounded-t-xl w-full max-w-4xl px-6 py-3 flex justify-between items-center shadow-lg print-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-3">
            <Printer className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold">Print Preview - Purchases Report</h2>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.print()} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg flex items-center gap-2 font-medium text-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Now
            </button>
            <button 
              onClick={() => setShowPrintPreview(false)} 
              className="text-slate-400 hover:bg-slate-800 p-1.5 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="bg-slate-805 w-full max-w-4xl flex-1 overflow-auto p-6 rounded-b-xl flex justify-center items-start print:static print:block print:w-full print:max-w-none print:overflow-visible print:p-0 print:bg-white print:border-none print:shadow-none" onClick={e => e.stopPropagation()}>
          <div className="bg-white text-black p-8 shadow-2xl border w-full max-w-[210mm] min-h-[297mm] font-sans printable-area">
            <div>
              <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-wide">DUBAI ELECTRONICS</h1>
                  <p className="text-xs font-bold text-gray-500 tracking-wide uppercase mt-0.5">{activeBranch} Branch</p>
                  <p className="text-sm font-semibold text-gray-600 mt-1">Purchases Summary Report</p>
                  {data.settings?.branchAddress && <p className="text-[10px] text-gray-500 mt-0.5">{data.settings.branchAddress}</p>}
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>Filter Timeframe: {filterLabel}</p>
                  {searchQuery.trim() && <p>Search Query: "{searchQuery}"</p>}
                  <p>Printed: {new Date().toLocaleString()}</p>
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse border border-gray-300 mb-6 font-sans">
                <thead>
                  <tr className="bg-slate-800 text-white border-b border-gray-300">
                    <th className="py-2 px-2 border-r border-slate-700 text-center w-8 font-semibold">#</th>
                    <th className="py-2 px-2 border-r border-slate-700 font-semibold">Date & Time</th>
                    <th className="py-2 px-2 border-r border-slate-700 font-semibold">Model Name</th>
                    <th className="py-2 px-2 border-r border-slate-700 font-semibold">Category</th>
                    <th className="py-2 px-2 border-r border-slate-700 text-center font-semibold">Qty</th>
                    <th className="py-2 px-2 border-r border-slate-700 text-right font-semibold">Unit Cost (NTD)</th>
                    <th className="py-2 px-2 border-r border-slate-700 text-right font-semibold">Total Cost</th>
                    <th className="py-2 px-2 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300 border-b border-gray-300">
                  {filteredPurchases.map((tx, i) => (
                    <tr key={tx.id}>
                      <td className="py-1 px-2 border-r border-gray-300 text-center text-gray-500 font-semibold">{i + 1}</td>
                      <td className="py-1 px-2 border-r border-gray-300 text-gray-600 whitespace-nowrap">{new Date(tx.date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                      <td className="py-1 px-2 border-r border-gray-300 font-bold text-gray-800">{tx.model}</td>
                      <td className="py-1 px-2 border-r border-gray-300 text-gray-650">{tx.category}</td>
                      <td className="py-1 px-2 border-r border-gray-300 text-center font-bold text-gray-700">{tx.qty}</td>
                      <td className="py-1 px-2 border-r border-gray-300 text-right font-semibold text-gray-700">Rs {tx.unitCost.toLocaleString('en-IN')}</td>
                      <td className="py-1 px-2 border-r border-gray-300 text-right font-bold text-blue-700">Rs {tx.totalCost.toLocaleString('en-IN')}</td>
                      <td className="py-1 px-2 text-gray-600 text-[10px] leading-snug">{tx.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t-2 border-slate-900 pt-4 mt-6">
                <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded">
                  <div>
                    <h3 className="text-xs uppercase font-bold text-slate-400">Total Purchase Value</h3>
                    <p className="text-[10px] text-slate-400">Sum of (Unit Cost NTD * Quantity) for all filtered items</p>
                  </div>
                  <div className="text-xl font-bold text-white">
                    Rs {totals.cost.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Single Transaction Receipt / Purchase Invoice Print Preview */}
    {showReceiptPreview && receiptTx && (
      <div className="fixed inset-0 bg-black/60 z-50 flex flex-col items-center justify-center p-4 print:static print:block print:p-0 print:bg-white" onClick={() => setShowReceiptPreview(false)}>
        <div className="bg-slate-900 text-white rounded-t-xl w-full max-w-4xl px-6 py-3 flex justify-between items-center shadow-lg print-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-3">
            <Printer className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold">Print Preview - Purchase Invoice</h2>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.print()} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg flex items-center gap-2 font-medium text-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Now
            </button>
            <button 
              onClick={() => setShowReceiptPreview(false)} 
              className="text-slate-400 hover:bg-slate-800 p-1.5 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="bg-slate-850 w-full max-w-4xl flex-1 overflow-auto p-6 rounded-b-xl flex justify-center items-start print:static print:block print:w-full print:max-w-none print:overflow-visible print:p-0 print:bg-white print:border-none print:shadow-none" onClick={e => e.stopPropagation()}>
          <div className="bg-white text-black p-10 shadow-2xl border w-full max-w-[210mm] min-h-[297mm] font-sans printable-area flex flex-col justify-between">
            <div>
              <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-wider">DUBAI ELECTRONICS</h1>
                  <p className="text-sm font-semibold text-gray-500">{data.settings?.branchAddress || `${activeBranch} Branch`}</p>
                  {data.settings?.branchPhone ? (
                    <p className="text-sm text-gray-500">Phone: {data.settings.branchPhone}</p>
                  ) : (
                    activeBranch === 'Wah Cantt' ? (
                      <p className="text-sm text-gray-500">Phone: 051-4916830</p>
                    ) : null
                  )}
                </div>
                <div className="text-right">
                  <h2 className="text-4xl font-extrabold text-blue-700 tracking-wider uppercase">PURCHASE INVOICE</h2>
                  <div className="text-right mt-3 text-xs text-gray-600 flex flex-col gap-0.5">
                    <p><span className="font-semibold text-gray-800">Transaction ID:</span> {receiptTx.id}</p>
                    <p><span className="font-semibold text-gray-800">Date:</span> {new Date(receiptTx.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </div>
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse border border-gray-300 mb-6">
                <thead>
                  <tr className="bg-slate-800 text-white border-b border-gray-300">
                    <th className="py-2.5 px-3 border-r border-slate-700 text-center w-12 font-semibold">#</th>
                    <th className="py-2.5 px-3 border-r border-slate-700 font-semibold">Item Model</th>
                    <th className="py-2.5 px-3 border-r border-slate-700 text-center w-20 font-semibold">Qty</th>
                    <th className="py-2.5 px-3 border-r border-slate-700 text-right w-36 font-semibold">Unit Cost (NTD)</th>
                    <th className="py-2.5 px-3 text-right w-36 font-semibold">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 border-r border-gray-200 text-center text-gray-500 font-medium">1</td>
                    <td className="py-2.5 px-3 border-r border-gray-200 font-bold text-gray-800">{receiptTx.model}</td>
                    <td className="py-2.5 px-3 border-r border-gray-200 text-center text-gray-700">{receiptTx.qty}</td>
                    <td className="py-2.5 px-3 border-r border-gray-200 text-right text-gray-700 font-semibold">Rs {receiptTx.unitCost.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-gray-950">Rs {receiptTx.totalCost.toLocaleString('en-IN')}</td>
                  </tr>

                  {/* Summary Rows inside the Table */}
                  <tr className="border-t border-gray-300 font-bold bg-slate-50/55 text-base">
                    <td colSpan={4} className="py-3 px-3 border-r border-gray-200 text-right text-gray-800">Grand Total</td>
                    <td className="py-3 px-3 text-right text-blue-705 font-extrabold font-poppins">Rs {receiptTx.totalCost.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>

              {receiptTx.remarks && (
                <div className="bg-slate-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Remarks / Notes</h3>
                  <p className="text-sm text-gray-750 font-medium leading-relaxed">{receiptTx.remarks}</p>
                </div>
              )}
            </div>

            <div className="text-center border-t border-gray-200 pt-6 mt-12 text-xs text-gray-500">
              <p className="font-semibold text-gray-700 mb-1">Dubai Electronics - Wholesale Inventory Record</p>
              <p className="text-[10px] text-gray-400">Software Developed by PrimeSoft</p>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
