import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Plus, Printer, Trash2, RefreshCw, ChevronDown, X } from 'lucide-react';
import { useDialog } from '../components/DialogProvider.jsx';

const formatIndianNumber = (val) => {
  if (val === undefined || val === null || val === '') return '';
  const numStr = String(val).replace(/,/g, '');
  const num = Number(numStr);
  if (isNaN(num)) return '';
  return num.toLocaleString('en-IN');
};

export default function SalesTab({ data, saveData, activeBranch }) {
  const { alert, confirm } = useDialog();

  const getInvoiceNo = (sale) => {
    if (!sale) return '';
    if (sale.invoiceNo) return sale.invoiceNo;
    const rawSales = data.sales || [];
    const idx = rawSales.findIndex(s => s.id === sale.id);
    if (idx !== -1) {
      return rawSales.length - idx;
    }
    return sale.id;
  };
  const location = useLocation();

  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (location.state?.openAddModal) {
      setShowAddModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

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
    cashAmount: '', onlineAmount: '', remarks: '' 
  });
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [invoiceNoInput, setInvoiceNoInput] = useState('');
  const [cashAmt, setCashAmt] = useState(0);
  const [onlineAmt, setOnlineAmt] = useState(0);

  const resetForm = () => {
    setSelectedItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setInvoiceNoInput('');
    setAddForm({ cashAmount: '', onlineAmount: '', remarks: '' });
    setTempForm({ stockId: '', qty: '', salePrice: '' });
    setStockSearch('');
    setIsDropdownOpen(false);
  };

  const getNextInvoiceNo = () => {
    return (data.sales || []).length + 1;
  };

  const refreshInvoiceNo = () => {
    setInvoiceNoInput(getNextInvoiceNo().toString());
  };

  useEffect(() => {
    if (showAddModal) {
      setInvoiceNoInput(getNextInvoiceNo().toString());
    }
  }, [showAddModal, data.sales]);

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

  const [selectedItems, setSelectedItems] = useState([]);
  const [tempForm, setTempForm] = useState({ stockId: '', qty: '', salePrice: '' });
  const [stockSearch, setStockSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [receiptSale, setReceiptSale] = useState(null);

  const grandTotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.salePrice, 0) + Number(tempForm.salePrice || 0);
  }, [selectedItems, tempForm.salePrice]);

  useEffect(() => {
    setAddForm(prev => ({
      ...prev,
      cashAmount: grandTotal || '',
      onlineAmount: ''
    }));
  }, [grandTotal]);

  const handleAddItemToSale = async () => {
    const stockItem = data.stock.find(s => s.id === tempForm.stockId);
    if (!stockItem) return await alert("Select a valid item");

    const qty = Number(tempForm.qty);
    if (qty <= 0) return await alert("Enter a valid quantity");

    const alreadyAddedQty = selectedItems
      .filter(si => si.stockId === stockItem.id)
      .reduce((sum, si) => sum + si.qty, 0);

    const available = stockItem.x_b + stockItem.in - (stockItem.sale || 0) - alreadyAddedQty;
    if (available < qty) {
      return await alert(`Not enough stock available! (Remaining available: ${available}, Requested: ${qty})`);
    }

    const unitNtd = stockItem.ntd || 0;
    const itemSalePrice = Number(tempForm.salePrice);
    if (itemSalePrice < 0) return await alert("Sale price cannot be negative");
    const profit = itemSalePrice - (unitNtd * qty);

    const existingIndex = selectedItems.findIndex(si => si.stockId === stockItem.id);
    const newItems = [...selectedItems];
    if (existingIndex >= 0) {
      newItems[existingIndex].qty += qty;
      newItems[existingIndex].salePrice += itemSalePrice;
      newItems[existingIndex].profit += profit;
    } else {
      newItems.push({
        stockId: stockItem.id,
        model: stockItem.model,
        category: stockItem.category || 'Other',
        qty: qty,
        ntd: unitNtd,
        salePrice: itemSalePrice,
        profit: profit
      });
    }

    setSelectedItems(newItems);

    setTempForm({ stockId: '', qty: '', salePrice: '' });
    setStockSearch('');
    setIsDropdownOpen(false);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    let itemsToSubmit = [...selectedItems];
    if (tempForm.stockId && tempForm.qty && tempForm.salePrice) {
      const stockItem = data.stock.find(s => s.id === tempForm.stockId);
      if (stockItem) {
        const qty = Number(tempForm.qty);
        const unitNtd = stockItem.ntd || 0;
        const itemSalePrice = Number(tempForm.salePrice);
        const profit = itemSalePrice - (unitNtd * qty);
        
        const existingIndex = itemsToSubmit.findIndex(si => si.stockId === stockItem.id);
        if (existingIndex >= 0) {
          itemsToSubmit[existingIndex].qty += qty;
          itemsToSubmit[existingIndex].salePrice += itemSalePrice;
          itemsToSubmit[existingIndex].profit += profit;
        } else {
          itemsToSubmit.push({
            stockId: stockItem.id,
            model: stockItem.model,
            category: stockItem.category || 'Other',
            qty: qty,
            ntd: unitNtd,
            salePrice: itemSalePrice,
            profit: profit
          });
        }
      }
    }

    if (itemsToSubmit.length === 0) {
      return await alert("Please select a product and enter quantity/price, or add items to the sale.");
    }

    const cashAmt = Number(addForm.cashAmount || 0);
    const onlineAmt = Number(addForm.onlineAmount || 0);
    const finalGrandTotal = itemsToSubmit.reduce((sum, item) => sum + item.salePrice, 0);

    if (Math.abs((cashAmt + onlineAmt) - finalGrandTotal) > 0.01) {
      return await alert(`The total paid amount (Cash + Online = Rs ${(cashAmt + onlineAmt).toLocaleString('en-IN')}) must equal the grand total sale price (Rs ${finalGrandTotal.toLocaleString('en-IN')}).`);
    }

    for (const item of itemsToSubmit) {
      const stockItem = data.stock.find(s => s.id === item.stockId);
      if (!stockItem) return await alert(`Item ${item.model} not found in inventory.`);
      const available = stockItem.x_b + stockItem.in - (stockItem.sale || 0);
      if (available < item.qty) {
        return await alert(`Not enough stock available for ${item.model}! (Available: ${available}, Requested: ${item.qty})`);
      }
    }

    const grandQty = itemsToSubmit.reduce((sum, item) => sum + item.qty, 0);
    const grandProfit = itemsToSubmit.reduce((sum, item) => sum + item.profit, 0);
    const joinedModels = itemsToSubmit.map(item => `${item.model} (x${item.qty})`).join(', ');

    const newSale = {
      id: Date.now().toString(),
      invoiceNo: invoiceNoInput.trim() ? parseInt(invoiceNoInput, 10) : (data.sales || []).length + 1,
      date: new Date().toISOString(),
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      items: itemsToSubmit,
      model: itemsToSubmit.length === 1 ? itemsToSubmit[0].model : joinedModels,
      qty: grandQty,
      salePrice: finalGrandTotal,
      profit: grandProfit,
      cashAmount: cashAmt,
      onlineAmount: onlineAmt,
      remarks: addForm.remarks
    };

    const updatedStock = data.stock.map(item => {
      const soldItem = itemsToSubmit.find(si => si.stockId === item.id);
      if (soldItem) {
        return { ...item, sale: (item.sale || 0) + soldItem.qty };
      }
      return item;
    });

    saveData({ 
      ...data, 
      sales: [newSale, ...data.sales],
      stock: updatedStock
    });
    
    setShowAddModal(false);
    resetForm();
  };

  const deleteSale = async (sale) => {
    if (await confirm("Delete this sale and restore stock?")) {
      const itemsToRestore = sale.items || [
        { stockId: sale.stockId, qty: sale.qty }
      ];
      
      const updatedStock = data.stock.map(item => {
        const restoreItem = itemsToRestore.find(ri => ri.stockId === item.id);
        if (restoreItem) {
          return { ...item, sale: Math.max(0, (item.sale || 0) - restoreItem.qty) };
        }
        return item;
      });

      saveData({
        ...data,
        sales: data.sales.filter(s => s.id !== sale.id),
        stock: updatedStock
      });
    }
  };

  // Filtering
  const filteredSales = useMemo(() => {
    let result = data.sales;

    if (filterType === 'Daily' && selectedDate) {
      const diffDays = getDaysAgo(selectedDate);
      result = result.filter(s => {
        const d = new Date(s.date);
        const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (diffDays > 0) {
          return ymd >= selectedDate && ymd <= todayYMD;
        }
        return ymd === selectedDate;
      });
    } else if (filterType === 'Monthly' && selectedMonth) {
      const [y, m] = selectedMonth.split('-').map(Number);
      result = result.filter(s => {
        const d = new Date(s.date);
        return d.getFullYear() === y && (d.getMonth() + 1) === m;
      });
    } else if (filterType === 'Annual' && selectedYear) {
      const y = Number(selectedYear);
      result = result.filter(s => {
        const d = new Date(s.date);
        return d.getFullYear() === y;
      });
    } else if (filterType === 'Custom' && startDate && endDate) {
      result = result.filter(s => {
        const d = new Date(s.date);
        const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return ymd >= startDate && ymd <= endDate;
      });
    }

    if (selectedCategory && selectedCategory !== 'All') {
      result = result.filter(s => {
        const stockItem = data.stock.find(item => item.id === s.stockId);
        const cat = s.category || (stockItem ? stockItem.category : 'Other');
        return cat === selectedCategory;
      });
    }

    if (searchQuery) {
      result = result.filter(s => s.model.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (sortBy === 'latest') {
      result.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortBy === 'profit-high') {
      result.sort((a, b) => b.profit - a.profit);
    } else if (sortBy === 'profit-low') {
      result.sort((a, b) => a.profit - b.profit);
    }

    return result;
  }, [data.sales, data.stock, filterType, selectedDate, selectedMonth, selectedYear, searchQuery, selectedCategory, startDate, endDate, sortBy, todayYMD]);

  // Totals
  const totals = filteredSales.reduce((acc, sale) => {
    acc.sale += sale.salePrice;
    acc.profit += sale.profit;
    acc.cash += (sale.cashAmount || 0);
    acc.online += (sale.onlineAmount || 0);
    return acc;
  }, { sale: 0, profit: 0, cash: 0, online: 0 });

  // Filter expenses based on same timeframe to get net balance
  const filteredExpenses = useMemo(() => {
    let result = data.expenses;

    if (filterType === 'Daily' && selectedDate) {
      const diffDays = getDaysAgo(selectedDate);
      result = result.filter(e => {
        const d = new Date(e.date);
        const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (diffDays > 0) {
          return ymd >= selectedDate && ymd <= todayYMD;
        }
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
    return result.reduce((sum, e) => sum + Number(e.amount), 0);
  }, [data.expenses, filterType, selectedDate, selectedMonth, selectedYear, startDate, endDate, todayYMD]);

  const netBalance = totals.sale - filteredExpenses;

  return (
    <>
    <div className="h-full flex flex-col p-6 print-content">
      <div className="flex justify-between items-center mb-6 print-hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Sales</h1>
          <p className="text-gray-500">Record sales and view profits</p>
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
              <>
                <input 
                  type="date" 
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                />
                <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm">
                  <span className="text-xs font-semibold text-gray-600 uppercase">Days Ago:</span>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="0"
                    value={daysAgoInput} 
                    onChange={handleDaysAgoChange}
                    className="w-12 text-sm font-medium text-gray-800 outline-none bg-transparent"
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
            {(filterType !== 'Daily' || selectedDate !== todayYMD) && (
              <button 
                onClick={() => {
                  setFilterType('Daily');
                  setSelectedDate(todayYMD);
                  setDaysAgoInput('');
                }}
                className="text-gray-400 hover:text-red-500 hover:bg-gray-100 p-0.5 rounded-full transition ml-1"
                title="Reset to today"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button onClick={() => setShowAddModal(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition">
            <Plus className="w-4 h-4" /> New Sale
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
            type="text" placeholder="Search model..." 
            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Category Filter */}
        <select 
          className="border border-gray-300 rounded-lg px-4 py-2 bg-white text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          <option value="All">All Categories</option>
          {(data.categories || []).map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select 
          className="border border-gray-300 rounded-lg px-4 py-2 bg-white text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
        >
          <option value="latest">Latest First</option>
          <option value="oldest">Oldest First</option>
          <option value="profit-high">Profit (High to Low)</option>
          <option value="profit-low">Profit (Low to High)</option>
        </select>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-gray-200 mb-6 print-hidden">
        <table className="w-full text-left border-collapse print-table">
          <thead className="bg-slate-900 text-white sticky top-0 print-header shadow-sm text-sm uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold text-center w-20">Inv No.</th>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold">Date</th>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold">Model</th>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold text-center">Qty</th>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold text-right">Cost (NTD)</th>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold text-right">Sale Price</th>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold text-right">Profit</th>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold text-center">Payment</th>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold">Remarks</th>
              <th className="py-2.5 px-2 print-hidden w-20 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map((sale, index) => (
              <tr key={sale.id} className="hover:bg-slate-50 border-b border-gray-200 group">
                <td className="py-0.5 px-1.5 border-r border-gray-200 text-center font-bold text-gray-500 text-xs">{getInvoiceNo(sale)}</td>
                <td className="py-0.5 px-1.5 border-r border-gray-200 text-sm text-gray-600 whitespace-nowrap">{new Date(sale.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td className="py-0.5 px-1.5 border-r border-gray-200 font-medium text-gray-900">
                  <div>{sale.model}</div>
                  {(sale.customerName || sale.customerPhone) && (
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5 font-sans">
                      Customer: {sale.customerName || '-'}{sale.customerPhone ? ` (${sale.customerPhone})` : ''}
                    </div>
                  )}
                </td>
                <td className="py-0.5 px-1.5 border-r border-gray-200 text-center font-semibold">{sale.qty}</td>
                <td className="py-0.5 px-1.5 border-r border-gray-200 text-right text-gray-500 font-medium">
                  {(sale.items ? sale.items.reduce((sum, item) => sum + (item.ntd * item.qty), 0) : (sale.ntd || 0) * sale.qty).toLocaleString('en-IN')}
                </td>
                <td className="py-0.5 px-1.5 border-r border-gray-200 text-right font-bold text-blue-600">{sale.salePrice.toLocaleString('en-IN')}</td>
                <td className={`py-0.5 px-1.5 border-r border-gray-200 text-right font-bold ${sale.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {sale.profit.toLocaleString('en-IN')}
                </td>
                <td className="py-0.5 px-1.5 border-r border-gray-200 text-center">
                  <div className="flex items-center justify-center gap-1 font-semibold text-xs">
                    {sale.cashAmount > 0 && <span className="text-green-600">{sale.cashAmount.toLocaleString('en-IN')}</span>}
                    {(sale.cashAmount > 0 && sale.onlineAmount > 0) && <span className="text-gray-400">|</span>}
                    {sale.onlineAmount > 0 && <span className="text-blue-500">{sale.onlineAmount.toLocaleString('en-IN')}</span>}
                  </div>
                </td>
                <td className="py-0.5 px-1.5 border-r border-gray-200 text-sm text-gray-500">{sale.remarks}</td>
                <td className="py-0.5 px-1.5 text-center print-hidden w-20">
                  <div className="flex justify-center gap-1.5">
                    <button 
                      onClick={() => { setReceiptSale(sale); setShowReceiptPreview(true); }} 
                      className="text-blue-500 p-1 hover:bg-blue-50 rounded transition" 
                      title="Print Receipt"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteSale(sale)} 
                      className="text-red-500 p-1 hover:bg-red-50 rounded transition" 
                      title="Delete Sale"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredSales.length === 0 && (
              <tr><td colSpan={10} className="py-0.5 px-1.5 text-center text-gray-500">No sales found for this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-5 gap-4 print-hidden">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase">Cash / Online</p>
          <p className="text-xl font-bold text-gray-900">Rs {totals.cash.toLocaleString('en-IN')} / {totals.online.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase">Total Sale</p>
          <p className="text-xl font-bold text-gray-900">Rs {totals.sale.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase">Total Profit</p>
          <p className={`text-xl font-bold ${totals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>Rs {totals.profit.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase">Expenses</p>
          <p className="text-xl font-bold text-red-600">Rs {filteredExpenses.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl shadow-md text-white">
          <p className="text-xs text-slate-400 font-semibold uppercase">Net Balance (-Exp)</p>
          <p className="text-xl font-bold text-green-400">Rs {netBalance.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print-hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h2 className="text-xl font-bold text-gray-800">Record New Sale</h2>
              <button 
                type="button" 
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition"
                title="Reset Fields"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
              {/* Customer Details & Invoice No */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">Customer Name (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="Enter customer name..." 
                    className="w-full border rounded p-2 text-gray-800 outline-none focus:ring-2 focus:ring-green-500 font-sans" 
                    value={customerName} 
                    onChange={e => setCustomerName(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">Customer Phone (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="Enter customer phone..." 
                    className="w-full border rounded p-2 text-gray-800 outline-none focus:ring-2 focus:ring-green-500 font-sans" 
                    value={customerPhone} 
                    onChange={e => setCustomerPhone(e.target.value.replace(/[^0-9]/g, ''))} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">Invoice #</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Invoice #" 
                      className="w-full border rounded p-2 text-gray-800 outline-none focus:ring-2 focus:ring-green-500 font-sans font-semibold" 
                      value={invoiceNoInput} 
                      onChange={e => setInvoiceNoInput(e.target.value.replace(/[^0-9]/g, ''))} 
                    />
                    <button
                      type="button"
                      onClick={refreshInvoiceNo}
                      className="p-2 bg-gray-100 hover:bg-gray-250 text-gray-600 rounded transition duration-200 border border-gray-300 flex items-center justify-center cursor-pointer"
                      title="Refresh Invoice No"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Add Item Sub-Form */}
              <div className="border border-gray-200 rounded-lg p-4 bg-slate-50/50">
                <h3 className="text-base font-bold text-gray-800 mb-3">Add Product Item</h3>
                
                <div className="flex flex-col gap-3">
                  <div className="relative" ref={dropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">Product Model</label>
                    <div 
                       className="w-full border border-gray-300 rounded p-2 bg-white cursor-pointer flex justify-between items-center"
                       onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <span className={tempForm.stockId ? 'text-black font-medium' : 'text-gray-500 text-sm'}>
                        {tempForm.stockId ? (() => {
                          const s = data.stock.find(item => item.id === tempForm.stockId);
                          const alreadyQty = selectedItems.filter(si => si.stockId === tempForm.stockId).reduce((sum, si) => sum + si.qty, 0);
                          const avail = s ? s.x_b + s.in - s.sale - alreadyQty : 0;
                          return s ? `${s.model} (Rs ${s.ntd?.toLocaleString('en-IN')}) - Avail: ${avail}` : 'Select Product Model...';
                        })() : 'Select Product Model...'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-500"/>
                    </div>
                    
                    {isDropdownOpen && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-56 overflow-y-auto">
                        <div className="p-2 sticky top-0 bg-white border-b">
                           <input
                             type="text"
                             className="w-full border rounded p-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                             placeholder="Search by model name..."
                             autoFocus
                             value={stockSearch}
                             onChange={e => setStockSearch(e.target.value)}
                             onClick={e => e.stopPropagation()}
                           />
                        </div>
                        {data.stock.filter(s => {
                          const alreadyQty = selectedItems.filter(si => si.stockId === s.id).reduce((sum, si) => sum + si.qty, 0);
                          const avail = s.x_b + s.in - s.sale - alreadyQty;
                          return avail > 0 && s.model.toLowerCase().includes(stockSearch.toLowerCase());
                        }).map(s => {
                          const alreadyQty = selectedItems.filter(si => si.stockId === s.id).reduce((sum, si) => sum + si.qty, 0);
                          const avail = s.x_b + s.in - s.sale - alreadyQty;
                          return (
                            <div
                              key={s.id}
                              className="p-2 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-b-0 flex justify-between items-center text-gray-900"
                              onClick={() => {
                                setTempForm({...tempForm, stockId: s.id});
                                setIsDropdownOpen(false);
                                setStockSearch('');
                              }}
                            >
                              <span className="font-semibold text-gray-900">{s.model} <span className="text-gray-500 font-normal">(Rs {s.ntd?.toLocaleString('en-IN')})</span></span> 
                              <span className="text-gray-500 text-xs font-medium">Avail: {avail}</span>
                            </div>
                          );
                        })}
                        {data.stock.filter(s => {
                          const alreadyQty = selectedItems.filter(si => si.stockId === s.id).reduce((sum, si) => sum + si.qty, 0);
                          const avail = s.x_b + s.in - s.sale - alreadyQty;
                          return avail > 0 && s.model.toLowerCase().includes(stockSearch.toLowerCase());
                        }).length === 0 && (
                          <div className="p-2 text-sm text-gray-500 text-center">No available items found</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <input 
                        type="number" 
                        min="1" 
                        max={tempForm.stockId ? (() => { 
                          const s = data.stock.find(i => i.id === tempForm.stockId); 
                          const alreadyQty = selectedItems.filter(si => si.stockId === tempForm.stockId).reduce((sum, si) => sum + si.qty, 0);
                          return s ? s.x_b + s.in - s.sale - alreadyQty : ''; 
                        })() : ''} 
                        className="w-full border rounded p-2 text-sm" 
                        placeholder="0" 
                        value={tempForm.qty} 
                        onChange={e => {
                          let val = e.target.value;
                          if (tempForm.stockId && val !== '') {
                            const s = data.stock.find(i => i.id === tempForm.stockId);
                            const alreadyQty = selectedItems.filter(si => si.stockId === tempForm.stockId).reduce((sum, si) => sum + si.qty, 0);
                            const maxQty = s ? s.x_b + s.in - s.sale - alreadyQty : Infinity;
                            if (Number(val) > maxQty) val = maxQty.toString();
                          }
                          setTempForm({...tempForm, qty: val});
                        }} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Sale Price</label>
                      <input 
                        type="text" 
                        className="w-full border rounded p-2 text-sm" 
                        placeholder="0" 
                        value={formatIndianNumber(tempForm.salePrice)} 
                        onChange={e => {
                          const rawVal = e.target.value.replace(/[^0-9]/g, '');
                          setTempForm({
                            ...tempForm,
                            salePrice: rawVal === '' ? '' : Number(rawVal)
                          });
                        }} 
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* Add Item Button */}
              <button 
                type="button" 
                onClick={handleAddItemToSale}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold transition shadow-sm mb-2"
              >
                Add Item
              </button>

              {/* Selected Items List */}
              {selectedItems.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-slate-50/30 p-3">
                  <h3 className="text-base font-bold text-gray-800 mb-2">Sale Items</h3>
                  <table className="w-full text-xs text-left border-collapse bg-white rounded shadow-sm">
                    <thead>
                      <tr className="bg-slate-100 text-gray-600 border-b border-gray-200">
                        <th className="py-2 px-2 font-semibold">Model</th>
                        <th className="py-2 px-2 font-semibold text-center w-12">Qty</th>
                        <th className="py-2 px-2 font-semibold text-right w-24">Sale Price</th>
                        <th className="py-2 px-2 font-semibold text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItems.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-150 last:border-b-0">
                          <td className="py-1.5 px-2 font-medium text-gray-800">{item.model}</td>
                          <td className="py-1.5 px-2 text-center font-bold text-gray-700">{item.qty}</td>
                          <td className="py-1.5 px-2 text-right font-bold text-blue-600">Rs {item.salePrice.toLocaleString('en-IN')}</td>
                          <td className="py-1.5 px-2 text-center">
                            <button 
                              type="button" 
                              onClick={() => {
                                const updated = selectedItems.filter((_, i) => i !== idx);
                                setSelectedItems(updated);
                              }}
                              className="text-red-500 hover:bg-red-50 p-1 rounded transition"
                              title="Remove Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50 font-bold border-t border-gray-200 text-gray-800">
                        <td className="py-1.5 px-2">Grand Total</td>
                        <td className="py-1.5 px-2 text-center">
                          {selectedItems.reduce((sum, item) => sum + item.qty, 0)}
                        </td>
                        <td className="py-1.5 px-2 text-right text-blue-700">
                          Rs {selectedItems.reduce((sum, item) => sum + item.salePrice, 0).toLocaleString('en-IN')}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cash Amount (Rs)</label>
                  <input 
                    type="text" 
                    className="w-full border rounded p-2 text-sm font-semibold" 
                    placeholder="0" 
                    value={formatIndianNumber(addForm.cashAmount)} 
                    onChange={e => {
                      const rawVal = e.target.value.replace(/[^0-9]/g, '');
                      const cashVal = rawVal === '' ? '' : Number(rawVal);
                      if (cashVal === '') {
                        setAddForm({...addForm, cashAmount: '', onlineAmount: ''});
                      } else {
                        const cappedCash = Math.min(grandTotal, cashVal);
                        const diff = grandTotal - cappedCash;
                        setAddForm({
                          ...addForm,
                          cashAmount: cappedCash,
                          onlineAmount: diff <= 0 ? 0 : diff
                        });
                      }
                    }} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Online Amount (Rs)</label>
                  <input 
                    type="text" 
                    className="w-full border rounded p-2 text-sm font-semibold" 
                    placeholder="0" 
                    value={formatIndianNumber(addForm.onlineAmount)} 
                    onChange={e => {
                      const rawVal = e.target.value.replace(/[^0-9]/g, '');
                      const onlineVal = rawVal === '' ? '' : Number(rawVal);
                      if (onlineVal === '') {
                        setAddForm({...addForm, onlineAmount: '', cashAmount: ''});
                      } else {
                        const cappedOnline = Math.min(grandTotal, onlineVal);
                        const diff = grandTotal - cappedOnline;
                        setAddForm({
                          ...addForm,
                          onlineAmount: cappedOnline,
                          cashAmount: diff <= 0 ? 0 : diff
                        });
                      }
                    }} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <input 
                  type="text" 
                  className="w-full border rounded p-2 text-sm" 
                  value={addForm.remarks} 
                  onChange={e => setAddForm({...addForm, remarks: e.target.value})} 
                />
              </div>

              <div className="flex gap-3 justify-end mt-4 pt-3 border-t">
                <button type="button" onClick={() => { resetForm(); setShowAddModal(false); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition">Complete Sale</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Print Preview Modal */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col items-center justify-center p-4 print:static print:block print:p-0 print:bg-white" onClick={() => setShowPrintPreview(false)}>
          <div className="bg-slate-900 text-white rounded-t-xl w-full max-w-4xl px-6 py-3 flex justify-between items-center shadow-lg print-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <Printer className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold">Print Preview - Sales Report ({filterLabel})</h2>
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
            <div className="bg-white text-black p-8 shadow-2xl border w-full max-w-[210mm] min-h-[297mm] font-sans printable-area flex flex-col justify-between">
              <div>
                <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-wide">DUBAI ELECTRONICS</h1>
                    <p className="text-xs font-bold text-gray-500 tracking-wide uppercase mt-0.5">{activeBranch} Branch</p>
                    <p className="text-sm font-semibold text-gray-600 mt-1">Sales Report ({filterLabel})</p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>Date: {new Date().toLocaleDateString()}</p>
                    <p>Total Sales Records: {filteredSales.length}</p>
                  </div>
                </div>

                <table className="w-full text-left text-xs border-collapse border border-gray-300 mb-6">
                  <thead>
                    <tr className="bg-slate-800 text-white border-b border-gray-300">
                      <th className="py-2.5 px-2 border-r border-slate-700 text-center w-8">#</th>
                      <th className="py-2.5 px-2 border-r border-slate-700">Date</th>
                      <th className="py-2.5 px-2 border-r border-slate-700">Model</th>
                      <th className="py-2.5 px-2 border-r border-slate-700 text-center">Qty</th>
                      <th className="py-2.5 px-2 border-r border-slate-700 text-right">Cost (NTD)</th>
                      <th className="py-2.5 px-2 border-r border-slate-700 text-right">Sale Price</th>
                      <th className="py-2.5 px-2 border-r border-slate-700 text-right">Profit</th>
                      <th className="py-2.5 px-2 text-center">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((sale, i) => (
                      <tr key={sale.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50 border-b border-gray-200'}>
                        <td className="py-0.5 px-1.5 border-r border-gray-200 text-center font-semibold text-gray-500">{i + 1}</td>
                        <td className="py-0.5 px-1.5 border-r border-gray-200 whitespace-nowrap">{new Date(sale.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td className="py-0.5 px-1.5 border-r border-gray-200 font-medium">{sale.model}</td>
                        <td className="py-0.5 px-1.5 border-r border-gray-200 text-center">{sale.qty}</td>
                        <td className="py-0.5 px-1.5 border-r border-gray-200 text-right">
                          {(sale.items ? sale.items.reduce((sum, item) => sum + (item.ntd * item.qty), 0) : (sale.ntd || 0) * sale.qty).toLocaleString('en-IN')}
                        </td>
                        <td className="py-0.5 px-1.5 border-r border-gray-200 text-right font-semibold text-blue-700">{sale.salePrice.toLocaleString('en-IN')}</td>
                        <td className={`py-0.5 px-1.5 border-r border-gray-200 text-right font-semibold ${sale.profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>{sale.profit.toLocaleString('en-IN')}</td>
                        <td className="py-0.5 px-1.5 text-center text-[10px]">
                          {sale.cashAmount > 0 ? `C: ${sale.cashAmount.toLocaleString('en-IN')}` : ''}
                          {sale.cashAmount > 0 && sale.onlineAmount > 0 ? ' | ' : ''}
                          {sale.onlineAmount > 0 ? `O: ${sale.onlineAmount.toLocaleString('en-IN')}` : ''}
                        </td>
                      </tr>
                    ))}
                    {filteredSales.length === 0 && (
                      <tr><td colSpan={8} className="py-0.5 px-1.5 text-center text-gray-500">No sales records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t-2 border-slate-900 pt-4 mt-6">
                <div className="grid grid-cols-5 gap-2 text-center text-xs font-semibold">
                  <div className="bg-gray-100 p-2 rounded border border-gray-300">
                    <span className="text-gray-500 block text-[10px] uppercase">Cash / Online</span>
                    <span className="text-sm font-bold text-gray-900">Rs {totals.cash.toLocaleString('en-IN')} / {totals.online.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-gray-100 p-2 rounded border border-gray-300">
                    <span className="text-gray-500 block text-[10px] uppercase">Total Sale</span>
                    <span className="text-sm font-bold text-gray-900">Rs {totals.sale.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-gray-100 p-2 rounded border border-gray-300">
                    <span className="text-gray-500 block text-[10px] uppercase">Total Profit</span>
                    <span className="text-sm font-bold text-green-700">Rs {totals.profit.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-gray-100 p-2 rounded border border-gray-300">
                    <span className="text-gray-500 block text-[10px] uppercase">Expenses</span>
                    <span className="text-sm font-bold text-red-600">Rs {filteredExpenses.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-slate-900 text-white p-2 rounded">
                    <span className="text-slate-400 block text-[10px] uppercase">Net Balance (-Exp)</span>
                    <span className="text-sm font-bold text-green-400">Rs {netBalance.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Invoice Print Preview Modal */}
    {showReceiptPreview && receiptSale && (
      <div className="fixed inset-0 bg-black/60 z-50 flex flex-col items-center justify-center p-4 print:static print:block print:p-0 print:bg-white" onClick={() => setShowReceiptPreview(false)}>
        <div className="bg-slate-900 text-white rounded-t-xl w-full max-w-4xl px-6 py-3 flex justify-between items-center shadow-lg print-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-3">
            <Printer className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold">Print Invoice</h2>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.print()} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg flex items-center gap-2 font-medium text-sm transition"
            >
              <Printer className="w-4 h-4" /> Print Now
            </button>
            <button 
              onClick={() => setShowReceiptPreview(false)} 
              className="text-slate-400 hover:bg-slate-800 p-1.5 rounded-full transition"
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
                  <h2 className="text-4xl font-extrabold text-blue-700 tracking-wider uppercase">INVOICE</h2>
                  <div className="text-right mt-3 text-xs text-gray-600 flex flex-col gap-0.5">
                    <p><span className="font-semibold text-gray-800">Invoice No:</span> {getInvoiceNo(receiptSale)}</p>
                    <p><span className="font-semibold text-gray-800">Date:</span> {new Date(receiptSale.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </div>
                </div>
              </div>

              {(receiptSale.customerName || receiptSale.customerPhone) && (
                <div className="bg-slate-50 border border-gray-200 rounded-lg p-3 mb-6">
                  <p className="text-sm font-sans text-gray-800">
                    <span className="font-bold text-gray-850">Customer: </span>
                    <span>{receiptSale.customerName || '-'}</span>
                    {receiptSale.customerPhone && <span> - {receiptSale.customerPhone}</span>}
                  </p>
                </div>
              )}

              <table className="w-full text-left text-xs border-collapse border border-gray-300 mb-6">
                <thead>
                  <tr className="bg-slate-800 text-white border-b border-gray-300">
                    <th className="py-2.5 px-3 border-r border-slate-700 text-center w-12 font-semibold">#</th>
                    <th className="py-2.5 px-3 border-r border-slate-700 font-semibold">Item Model</th>
                    <th className="py-2.5 px-3 border-r border-slate-700 text-center w-20 font-semibold">Qty</th>
                    <th className="py-2.5 px-3 border-r border-slate-700 text-right w-36 font-semibold">Unit Price</th>
                    <th className="py-2.5 px-3 text-right w-36 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(receiptSale.items || [
                    { stockId: receiptSale.stockId, model: receiptSale.model, qty: receiptSale.qty, salePrice: receiptSale.salePrice }
                  ]).map((item, idx) => {
                    const unitPrice = Math.round(item.salePrice / item.qty);
                    return (
                      <tr key={idx} className="border-b border-gray-200 last:border-b-0 hover:bg-slate-50/50">
                        <td className="py-2 px-3 border-r border-gray-200 text-center text-gray-500 font-medium">{idx + 1}</td>
                        <td className="py-2 px-3 border-r border-gray-200 font-medium text-gray-800">{item.model}</td>
                        <td className="py-2 px-3 border-r border-gray-200 text-center text-gray-750">{item.qty}</td>
                        <td className="py-2 px-3 border-r border-gray-200 text-right text-gray-750 font-poppins">Rs {unitPrice.toLocaleString('en-IN')}</td>
                        <td className="py-2 px-3 text-right font-semibold text-gray-950 font-poppins">Rs {item.salePrice.toLocaleString('en-IN')}</td>
                      </tr>
                    );
                  })}

                  {/* Summary Rows inside the Table */}
                  <tr className="border-t border-gray-300 font-bold bg-slate-50/55 text-base">
                    <td colSpan={4} className="py-3 px-3 border-r border-gray-200 text-right text-gray-800">Grand Total</td>
                    <td className="py-3 px-3 text-right text-blue-705 font-extrabold font-poppins">Rs {receiptSale.salePrice.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="border-t border-gray-250 text-gray-655 bg-slate-50/20">
                    <td colSpan={4} className="py-2 px-3 border-r border-gray-200 text-right">Cash Paid</td>
                    <td className="py-2 px-3 text-right font-semibold text-gray-805 font-poppins">Rs {(receiptSale.cashAmount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="border-t border-gray-250 text-gray-655 bg-slate-50/20">
                    <td colSpan={4} className="py-2 px-3 border-r border-gray-200 text-right">Online Paid</td>
                    <td className="py-2 px-3 text-right font-semibold text-gray-805 font-poppins">Rs {(receiptSale.onlineAmount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>

              {receiptSale.remarks && (
                <div className="bg-slate-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Remarks / Notes</h3>
                  <p className="text-sm text-gray-750 font-medium leading-relaxed">{receiptSale.remarks}</p>
                </div>
              )}
            </div>

            <div className="text-center border-t border-gray-200 pt-6 mt-12 text-xs text-gray-500">
              <p className="font-semibold text-gray-700 mb-1">Thank you for your business!</p>
              <p className="text-[10px] text-gray-400">Software Developed by PrimeSoft</p>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
