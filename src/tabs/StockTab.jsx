import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Calendar, Plus, Edit2, Trash2, Printer, ChevronDown, ChevronRight, Check, X, RefreshCw, History, ClipboardList, ShoppingCart, PlusCircle, TrendingUp } from 'lucide-react';
import { useDialog } from '../components/DialogProvider.jsx';

export default function StockTab({ data, saveData, activeBranch }) {
  const { alert, confirm } = useDialog();
  const location = useLocation();

  const [expandedCats, setExpandedCats] = useState({});
  const [isEditing, setIsEditing] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (location.state?.openAddModal) {
      setShowAddModal(true);
      window.history.replaceState({}, document.title);
    } else if (location.state?.openAddStockModal) {
      setShowAddStockModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);
  
  const [tableSearch, setTableSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const todayYMD = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState(todayYMD);
  const [daysAgoInput, setDaysAgoInput] = useState('');

  const getDaysAgo = useCallback((dateStr) => {
    if (!dateStr) return 0;
    const todayParts = todayYMD.split('-').map(Number);
    const dateParts = dateStr.split('-').map(Number);
    const todayDate = new Date(todayParts[0], todayParts[1] - 1, todayParts[2]);
    const selDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const diffTime = todayDate - selDate;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  }, [todayYMD]);

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

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ model: '', category: data.categories[0] || '', x_b: '', in: '', sale: '', ntd: '' });
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [addStockForm, setAddStockForm] = useState({ stockId: '', in: '', ntd: '', desc: '' });
  const [historyItem, setHistoryItem] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('All');
  const [showGlobalHistory, setShowGlobalHistory] = useState(false);
  const [globalHistoryFilter, setGlobalHistoryFilter] = useState('All');
  const [purchaseHistoryItem, setPurchaseHistoryItem] = useState(null);
  
  const [stockSearch, setStockSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const toggleCategory = (cat) => {
    setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleAddSubmit = async (e, keepOpen = false) => {
    if (e) e.preventDefault();
    if (!addForm.model.trim()) {
      await alert("Please enter a Model Name.");
      return;
    }
    const newItem = {
      id: Date.now().toString(),
      model: addForm.model.trim(),
      category: addForm.category,
      x_b: Number(addForm.x_b || 0),
      in: Number(addForm.in || 0),
      sale: Number(addForm.sale || 0),
      ntd: Number(addForm.ntd || 0),
    };
    const newTx = {
      id: Date.now().toString() + '1',
      date: new Date().toISOString(),
      stockId: newItem.id,
      type: 'Initial Stock',
      qty: newItem.x_b + newItem.in,
      details: `Cost: Rs ${newItem.ntd.toLocaleString('en-IN')} (NTD)`,
      prevNtd: 0,
      newNtd: newItem.ntd
    };
    saveData({ ...data, stock: [...data.stock, newItem], history: [...(data.history || []), newTx] });
    if (keepOpen) {
      setAddForm({ model: '', category: addForm.category, x_b: '', in: '', sale: '', ntd: '' });
    } else {
      setShowAddModal(false);
      setAddForm({ model: '', category: data.categories[0] || '', x_b: '', in: '', sale: '', ntd: '' });
    }
  };

  const handleAddStockSubmit = async (e, keepOpen = false) => {
    if (e) e.preventDefault();
    const stockItem = data.stock.find(s => s.id === addStockForm.stockId);
    if (!stockItem) return await alert("Select a valid item");

    const addedQty = Number(addStockForm.in);
    if (addedQty <= 0) return await alert("Please enter a valid quantity to add.");
    const addedNtd = Number(addStockForm.ntd || 0);
    
    const currentNtd = stockItem.ntd || 0;

    let newNtd = currentNtd === 0 ? addedNtd : (currentNtd + addedNtd) / 2;

    const updatedStock = data.stock.map(item => 
      item.id === stockItem.id ? { 
        ...item, 
        in: (item.in || 0) + addedQty,
        ntd: newNtd
      } : item
    );

    const newTx = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      stockId: stockItem.id,
      type: 'Stock In',
      qty: addedQty,
      details: `Cost: Rs ${addedNtd.toLocaleString('en-IN')} (NTD)${addStockForm.desc ? ` - ${addStockForm.desc}` : ''}`,
      prevNtd: currentNtd,
      newNtd: newNtd
    };
    saveData({ ...data, stock: updatedStock, history: [...(data.history || []), newTx] });
    if (keepOpen) {
      setAddStockForm({ stockId: '', in: '', ntd: '', desc: '' });
      setStockSearch('');
    } else {
      setShowAddStockModal(false);
      setAddStockForm({ stockId: '', in: '', ntd: '', desc: '' });
      setStockSearch('');
    }
  };

  const startEdit = (item) => {
    setIsEditing(item.id);
    setEditForm({ ...item });
  };

  const saveEdit = async () => {
    const stockItem = data.stock.find(s => s.id === isEditing);
    if (!stockItem) return;

    const prevNtd = stockItem.ntd || 0;
    const newNtd = Number(editForm.ntd);

    let updatedHistory = [...(data.history || [])];

    if (newNtd !== prevNtd) {
      const confirmed = await confirm(`Are you sure you want to update the price of this item from Rs ${prevNtd.toLocaleString('en-IN')} to Rs ${newNtd.toLocaleString('en-IN')}?`);
      if (!confirmed) return;

      // Add Price Update transaction
      const newTx = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        stockId: stockItem.id,
        type: 'Price Update',
        qty: 0,
        details: `Cost: Rs ${newNtd.toLocaleString('en-IN')} (NTD) - Price Updated`,
        prevNtd: prevNtd,
        newNtd: newNtd
      };
      updatedHistory.push(newTx);
    }

    const updatedStock = data.stock.map(item => 
      item.id === isEditing ? { 
        ...editForm, 
        x_b: Number(editForm.x_b), 
        in: Number(editForm.in), 
        sale: Number(editForm.sale), 
        ntd: newNtd 
      } : item
    );

    saveData({ ...data, stock: updatedStock, history: updatedHistory });
    setIsEditing(null);
  };

  const deleteItem = async (id) => {
    if (await confirm("Are you sure you want to delete this item?")) {
      saveData({ ...data, stock: data.stock.filter(item => item.id !== id) });
    }
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
        
        // Recalculate 'in' (Stock In Qty)
        const remainingStockIn = updatedHistory.filter(h => h.stockId === tx.stockId && h.type === 'Stock In');
        updatedItem.in = remainingStockIn.reduce((sum, h) => sum + Number(h.qty || 0), 0);
        
        // Recalculate 'ntd' (Cost price)
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
              runningBlnc = event.qty - (updatedItem.sale || 0);
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
              }
              runningNtd = addedNtd;
            }
          } else if (event.eventType === 'sale') {
            runningBlnc -= event.qty;
          }
        });
        
        updatedItem.ntd = runningNtd;

        const updatedStock = data.stock.map(s => s.id === tx.stockId ? updatedItem : s);
        
        saveData({
          ...data,
          stock: updatedStock,
          history: updatedHistory
        });
        
        if (purchaseHistoryItem && purchaseHistoryItem.id === tx.stockId) {
          setPurchaseHistoryItem(updatedItem);
        }
      } else {
        saveData({
          ...data,
          history: updatedHistory
        });
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Pre-process history and sales grouped by stockId and with pre-formatted date YMDs
  const processedStockData = useMemo(() => {
    const getYMD = (dateString) => {
      if (!dateString) return '';
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '';
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const stockInMap = {};
    (data.history || []).forEach(h => {
      if (h.type === 'Stock In') {
        const id = h.stockId;
        if (!stockInMap[id]) stockInMap[id] = [];
        stockInMap[id].push({
          qty: Number(h.qty || 0),
          ymd: getYMD(h.date)
        });
      }
    });

    const salesMap = {};
    (data.sales || []).forEach(s => {
      const id = s.stockId;
      if (!salesMap[id]) salesMap[id] = [];
      salesMap[id].push({
        qty: Number(s.qty || 0),
        ymd: getYMD(s.date)
      });
    });

    return { stockInMap, salesMap };
  }, [data.history, data.sales]);

  // Pre-calculate stock levels for the selectedDate to avoid repeating loops for each render call
  const itemsStockForSelectedDate = useMemo(() => {
    const { stockInMap, salesMap } = processedStockData;
    const diffDays = getDaysAgo(selectedDate);
    const stockMap = {};

    (data?.stock || []).forEach(item => {
      const stockInHistory = stockInMap[item.id] || [];
      const salesHistory = salesMap[item.id] || [];

      let inBefore = 0;
      let inOnRange = 0;
      for (let i = 0; i < stockInHistory.length; i++) {
        const h = stockInHistory[i];
        if (h.ymd < selectedDate) {
          inBefore += h.qty;
        } else if (diffDays > 0 ? (h.ymd >= selectedDate && h.ymd <= todayYMD) : h.ymd === selectedDate) {
          inOnRange += h.qty;
        }
      }

      let saleBefore = 0;
      let saleOnRange = 0;
      for (let i = 0; i < salesHistory.length; i++) {
        const s = salesHistory[i];
        if (s.ymd < selectedDate) {
          saleBefore += s.qty;
        } else if (diffDays > 0 ? (s.ymd >= selectedDate && s.ymd <= todayYMD) : s.ymd === selectedDate) {
          saleOnRange += s.qty;
        }
      }

      const baseXB = Number(item.x_b || 0);
      const x_b = Math.max(0, baseXB + inBefore - saleBefore);
      const inQty = inOnRange;
      const tb = x_b + inQty;
      const saleQty = saleOnRange;
      const blnc = tb - saleQty;

      stockMap[item.id] = { x_b, in: inQty, tb, sale: saleQty, blnc };
    });

    return stockMap;
  }, [data?.stock, processedStockData, getDaysAgo, selectedDate, todayYMD]);

  // Helper to calculate Stock for any date (X-B for selectedDate equals previous date's BLNC)
  // Keeps same signature, but uses the cached itemsStockForSelectedDate for the active date.
  const getItemStockForDate = useCallback((item, dateYMD) => {
    if (!item) return { x_b: 0, in: 0, tb: 0, sale: 0, blnc: 0 };
    if (dateYMD === selectedDate) {
      return itemsStockForSelectedDate[item.id] || { x_b: 0, in: 0, tb: 0, sale: 0, blnc: 0 };
    }

    const { stockInMap, salesMap } = processedStockData;
    const diffDays = getDaysAgo(dateYMD);
    const stockInHistory = stockInMap[item.id] || [];
    const salesHistory = salesMap[item.id] || [];

    let inBefore = 0;
    let inOnRange = 0;
    for (let i = 0; i < stockInHistory.length; i++) {
      const h = stockInHistory[i];
      if (h.ymd < dateYMD) {
        inBefore += h.qty;
      } else if (diffDays > 0 ? (h.ymd >= dateYMD && h.ymd <= todayYMD) : h.ymd === dateYMD) {
        inOnRange += h.qty;
      }
    }

    let saleBefore = 0;
    let saleOnRange = 0;
    for (let i = 0; i < salesHistory.length; i++) {
      const s = salesHistory[i];
      if (s.ymd < dateYMD) {
        saleBefore += s.qty;
      } else if (diffDays > 0 ? (s.ymd >= dateYMD && s.ymd <= todayYMD) : s.ymd === dateYMD) {
        saleOnRange += s.qty;
      }
    }

    const baseXB = Number(item.x_b || 0);
    const x_b = Math.max(0, baseXB + inBefore - saleBefore);
    const inQty = inOnRange;
    const tb = x_b + inQty;
    const saleQty = saleOnRange;
    const blnc = tb - saleQty;

    return { x_b, in: inQty, tb, sale: saleQty, blnc };
  }, [itemsStockForSelectedDate, selectedDate, processedStockData, getDaysAgo, todayYMD]);

  // Pre-filter stock list by search term
  const filteredStock = useMemo(() => {
    const searchLower = tableSearch.toLowerCase().trim();
    if (!searchLower) return data.stock || [];
    return (data.stock || []).filter(item => item.model.toLowerCase().includes(searchLower));
  }, [data.stock, tableSearch]);

  // Group filtered stock by category
  const stockByCategory = useMemo(() => {
    const map = {};
    filteredStock.forEach(item => {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    });
    return map;
  }, [filteredStock]);

  // Group all stock by category (for print preview and fallback uses)
  const allStockByCategory = useMemo(() => {
    const map = {};
    (data.stock || []).forEach(item => {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    });
    return map;
  }, [data.stock]);

  // Chronologically calculate running cost prices for the selected purchase history item
  const chronologicalPrices = useMemo(() => {
    if (!purchaseHistoryItem) return {};
    
    const item = purchaseHistoryItem;
    const itemHistory = (data.history || []).filter(h => h.stockId === item.id);
    const itemSales = (data.sales || []).filter(s => s.stockId === item.id);

    // Combine and sort by date ascending
    const allEvents = [
      ...itemHistory.map(h => ({ ...h, eventType: 'history' })),
      ...itemSales.map(s => ({ ...s, eventType: 'sale' }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    let balance = 0;
    let ntd = 0;
    const pricesMap = {}; // tx.id -> { prevNtd, newNtd }

    allEvents.forEach(event => {
      if (event.eventType === 'history') {
        if (event.type === 'Initial Stock') {
          const prevNtd = 0;
          let addedNtd = 0;
          const match = event.details.match(/Cost: Rs ([\d,.]+) \(NTD\)/);
          if (match) {
            addedNtd = parseFloat(match[1].replace(/,/g, ''));
          } else {
            addedNtd = item.ntd || 0;
          }
          const newNtd = addedNtd;
          ntd = newNtd;
          balance = event.qty - (item.sale || 0);
          pricesMap[event.id] = { prevNtd, newNtd };
        } else if (event.type === 'Stock In') {
          const prevNtd = ntd;
          let addedNtd = 0;
          const match = event.details.match(/Cost: Rs ([\d,.]+) \(NTD\)/);
          if (match) {
            addedNtd = parseFloat(match[1].replace(/,/g, ''));
          }
          let newNtd = prevNtd === 0 ? addedNtd : (prevNtd + addedNtd) / 2;
          ntd = newNtd;
          balance += event.qty;
          pricesMap[event.id] = { prevNtd, newNtd };
        } else if (event.type === 'Price Update') {
          const prevNtd = ntd;
          let addedNtd = 0;
          const match = event.details.match(/Cost: Rs ([\d,.]+) \(NTD\)/);
          if (match) {
            addedNtd = parseFloat(match[1].replace(/,/g, ''));
          }
          const newNtd = addedNtd;
          ntd = newNtd;
          pricesMap[event.id] = { prevNtd, newNtd };
        }
      } else if (event.eventType === 'sale') {
        balance -= event.qty;
      }
    });

    return pricesMap;
  }, [purchaseHistoryItem, data.history, data.sales]);

  // Calculations based on selectedDate
  const globalTotalValue = useMemo(() => {
    return (data?.stock || []).reduce((acc, item) => {
      const { blnc } = itemsStockForSelectedDate[item.id] || { blnc: 0 };
      return acc + (blnc * (item.ntd || 0));
    }, 0);
  }, [data?.stock, itemsStockForSelectedDate]);

  return (
    <>
      <div className={`h-full flex flex-col p-6 print-content ${showPrintPreview ? 'print-hidden' : ''}`}>
      <div className="flex justify-between items-center mb-6 print-hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Stock Management</h1>
          <p className="text-gray-500">Manage your inventory and categories</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-semibold text-gray-600 uppercase">Date:</span>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)}
              className="text-sm font-medium text-gray-800 outline-none bg-transparent cursor-pointer"
            />
          </div>
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
            {selectedDate !== todayYMD && (
              <button 
                onClick={() => { setSelectedDate(todayYMD); setDaysAgoInput('0'); }}
                className="text-gray-400 hover:text-red-500 hover:bg-gray-100 p-0.5 rounded-full transition ml-1"
                title="Reset to today"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {getDaysAgo(selectedDate) > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-3 py-2 shadow-sm text-sm font-semibold">
              <span>Range: {formatReportDate(selectedDate)}</span>
            </div>
          )}
          <button onClick={() => { setShowGlobalHistory(true); setPurchaseHistoryItem(null); setGlobalHistoryFilter('All'); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition">
            <TrendingUp className="w-4 h-4" /> Sales History
          </button>
          <button onClick={() => setShowAddStockModal(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition">
            <Plus className="w-4 h-4" /> Add Stock
          </button>
          <button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition">
            <Plus className="w-4 h-4" /> Add Item
          </button>
          <button onClick={() => setShowPrintPreview(true)} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      <div className="mb-4 print-hidden flex gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by model name..." 
            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={tableSearch}
            onChange={e => setTableSearch(e.target.value)}
          />
        </div>
        <div className="w-64 shrink-0">
          <select
            value={selectedCategoryFilter}
            onChange={e => setSelectedCategoryFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-gray-700 cursor-pointer"
          >
            <option value="All">All Categories</option>
            {data.categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="w-full text-left border-collapse print-table">
          <thead className="bg-slate-900 text-white sticky top-0 print-header shadow-sm text-sm uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold text-center w-12">#</th>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold">Model</th>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold text-center">X-B</th>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold text-center">In</th>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold text-center">T-B</th>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold text-center">Sale</th>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold text-center">Blnc</th>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold text-right print-hidden">NTD (Cost)</th>
              <th className="py-2.5 px-2 font-semibold text-center print-hidden w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.categories
              .filter(category => selectedCategoryFilter === 'All' || category === selectedCategoryFilter)
              .map(category => {
                const catItems = stockByCategory[category] || [];
                if (catItems.length === 0) return null;
              
              const isExpanded = expandedCats[category] !== false; // default true
              const catTotals = catItems.reduce((totals, item) => {
                const { x_b, in: inQty, tb, sale: saleQty, blnc } = itemsStockForSelectedDate[item.id] || { x_b: 0, in: 0, tb: 0, sale: 0, blnc: 0 };
                totals.x_b += x_b;
                totals.in += inQty;
                totals.tb += tb;
                totals.sale += saleQty;
                totals.blnc += blnc;
                totals.value += blnc * (item.ntd || 0);
                return totals;
              }, { x_b: 0, in: 0, tb: 0, sale: 0, blnc: 0, value: 0 });

              return (
                <React.Fragment key={category}>
                  {/* Category Header */}
                  <tr className="bg-blue-50/50 hover:bg-blue-50 cursor-pointer print-header" onClick={() => toggleCategory(category)}>
                    <td colSpan={9} className="py-0.5 px-1.5 border-b text-blue-800 font-bold">
                      <div className="flex items-center gap-2">
                        <span className="print-hidden">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </span>
                        {category.toUpperCase()} ({catItems.length} items)
                      </div>
                    </td>
                  </tr>

                  {/* Category Items */}
                  {isExpanded && catItems.map((item, index) => {
                    const { x_b, in: inQty, tb, sale: saleQty, blnc } = itemsStockForSelectedDate[item.id] || { x_b: 0, in: 0, tb: 0, sale: 0, blnc: 0 };
                    const editing = isEditing === item.id;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 border-b border-gray-200 group">
                        <td className="py-0.5 px-1.5 border-r border-gray-200 text-center font-bold text-gray-500 text-xs">{index + 1}</td>
                        <td className="py-0.5 px-1.5 border-r border-gray-200 font-medium text-gray-900">
                          {editing ? <input className="border p-1 w-full rounded" value={editForm.model} onChange={e=>setEditForm({...editForm, model: e.target.value})} /> : item.model}
                        </td>
                        <td className="py-0.5 px-1.5 border-r border-gray-200 text-center font-medium">
                          {editing ? <input type="number" className="border p-1 w-16 text-center rounded" value={editForm.x_b} onChange={e=>setEditForm({...editForm, x_b: e.target.value})} /> : x_b}
                        </td>
                        <td className="py-0.5 px-1.5 border-r border-gray-200 text-center font-medium">
                          {editing ? <input type="number" className="border p-1 w-16 text-center rounded" value={editForm.in} onChange={e=>setEditForm({...editForm, in: e.target.value})} /> : inQty}
                        </td>
                        <td className="py-0.5 px-1.5 border-r border-gray-200 text-center font-semibold bg-gray-50/50">{tb}</td>
                        <td className="py-0.5 px-1.5 border-r border-gray-200 text-center font-medium">
                          {editing ? <input type="number" className="border p-1 w-16 text-center rounded" value={editForm.sale} onChange={e=>setEditForm({...editForm, sale: e.target.value})} /> : saleQty}
                        </td>
                        <td className={`py-0.5 px-1.5 border-r border-gray-200 text-center font-bold ${blnc > 0 ? 'text-green-600' : 'text-red-500'}`}>{blnc}</td>
                        <td className="py-0.5 px-1.5 border-r border-gray-200 text-right text-gray-500 print-hidden font-medium">
                          {editing ? <input type="number" className="border p-1 w-20 text-right rounded" value={editForm.ntd} onChange={e=>setEditForm({...editForm, ntd: e.target.value})} /> : `Rs ${item.ntd?.toLocaleString('en-IN') || 0}`}
                        </td>
                        <td className="py-0.5 px-1.5 print-hidden">
                          <div className="flex items-center justify-center gap-2">
                            {editing ? (
                              <>
                                <button onClick={saveEdit} className="text-green-600 hover:bg-green-50 p-0.5 rounded"><Check className="w-4 h-4" /></button>
                                <button onClick={() => setIsEditing(null)} className="text-gray-400 hover:bg-gray-100 p-0.5 rounded"><X className="w-4 h-4" /></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => { setAddStockForm({ stockId: item.id, in: '', ntd: '', desc: '' }); setShowAddStockModal(true); }} className="text-green-600 hover:bg-green-50 p-0.5 rounded transition" title="Add Stock"><PlusCircle className="w-4 h-4" /></button>
                                <button onClick={() => { setHistoryItem(item); setHistoryFilter('All'); }} className="text-indigo-600 hover:bg-indigo-50 p-0.5 rounded transition" title="Sales History"><TrendingUp className="w-4 h-4" /></button>
                                <button onClick={() => { setShowGlobalHistory(true); setPurchaseHistoryItem(item); setGlobalHistoryFilter('All'); }} className="text-emerald-600 hover:bg-emerald-50 p-0.5 rounded transition" title="Purchase History"><ShoppingCart className="w-4 h-4" /></button>
                                <button onClick={() => startEdit(item)} className="text-blue-600 hover:bg-blue-50 p-0.5 rounded transition" title="Edit Item"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => deleteItem(item.id)} className="text-red-500 hover:bg-red-50 p-0.5 rounded transition" title="Delete Item"><Trash2 className="w-4 h-4" /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {isExpanded && (
                    <tr className="bg-slate-50/80 font-bold border-b-2 border-slate-300 font-sans">
                      <td className="py-1.5 px-2 border-r border-gray-200 text-center text-gray-500 font-semibold font-sans">-</td>
                      <td className="py-1.5 px-2 border-r border-gray-200 text-slate-850 uppercase font-bold font-sans">Total {category}</td>
                      <td className="py-1.5 px-2 border-r border-gray-200 text-center text-slate-800 font-bold font-sans">{catTotals.x_b}</td>
                      <td className="py-1.5 px-2 border-r border-gray-200 text-center text-slate-800 font-bold font-sans">{catTotals.in}</td>
                      <td className="py-1.5 px-2 border-r border-gray-200 text-center text-slate-800 font-bold font-sans">{catTotals.tb}</td>
                      <td className="py-1.5 px-2 border-r border-gray-200 text-center text-slate-800 font-bold font-sans">{catTotals.sale}</td>
                      <td className={`py-1.5 px-2 border-r border-gray-200 text-center font-bold font-sans ${catTotals.blnc > 0 ? 'text-green-700' : 'text-red-600'}`}>{catTotals.blnc}</td>
                      <td className="py-1.5 px-2 border-r border-gray-200 text-right text-slate-700 print-hidden font-bold font-sans">Rs {catTotals.value.toLocaleString('en-IN')}</td>
                      <td className="py-1.5 px-2 print-hidden text-center text-gray-400 font-semibold font-sans">-</td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-slate-900 text-white p-6 rounded-xl shadow-lg flex justify-between items-center print-hidden">
        <div>
          <h3 className="text-white text-sm font-semibold tracking-wider uppercase mb-1">Total Stock Value</h3>
          <p className="text-xs text-slate-400">Based on Cost Price (NTD) × Available Balance</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-green-400">
            Rs {globalTotalValue.toLocaleString('en-IN')}
          </div>
          <div className="text-sm font-semibold text-amber-300 mt-1">
            Zakat (2.5%): Rs {(globalTotalValue * 0.025).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print-hidden" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Add New Stock Item</h2>
              <button 
                type="button" 
                onClick={() => setAddForm({ model: '', category: data.categories[0] || '', x_b: '', in: '', sale: '', ntd: '' })}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition"
                title="Reset Fields"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select 
                    className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={addForm.category}
                    onChange={e => setAddForm({...addForm, category: e.target.value})}
                    required
                  >
                    {data.categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={addForm.model}
                  onChange={e => setAddForm({...addForm, model: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">X-B (Prev Stock)</label>
                  <input type="number" className="w-full border rounded p-2" placeholder="0" value={addForm.x_b} onChange={e => setAddForm({...addForm, x_b: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">In (New Stock)</label>
                  <input type="number" className="w-full border rounded p-2" placeholder="0" value={addForm.in} onChange={e => setAddForm({...addForm, in: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (NTD)</label>
                <input type="number" className="w-full border rounded p-2" placeholder="0" value={addForm.ntd} onChange={e => setAddForm({...addForm, ntd: e.target.value})} />
              </div>
              
              <div className="flex gap-3 justify-end mt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium transition cursor-pointer">Cancel</button>
                <button type="button" onClick={(e) => handleAddSubmit(e, true)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition cursor-pointer">Save Next Item</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition cursor-pointer">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddStockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print-hidden" onClick={() => setShowAddStockModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Add Stock to Existing Item</h2>
              <button 
                type="button" 
                onClick={() => { setAddStockForm({ stockId: '', in: '', ntd: '', desc: '' }); setStockSearch(''); setIsDropdownOpen(false); }}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition"
                title="Reset Fields"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddStockSubmit} className="flex flex-col gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Item</label>
                <div 
                   className="w-full border border-gray-300 rounded p-2 bg-white cursor-pointer flex justify-between items-center"
                   onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className={addStockForm.stockId ? 'text-black font-medium' : 'text-gray-500'}>
                    {addStockForm.stockId ? (() => {
                      const s = data.stock.find(item => item.id === addStockForm.stockId);
                      return s ? `${s.model} (Rs ${s.ntd?.toLocaleString('en-IN')})` : 'Search & Select Item...';
                    })() : 'Search & Select Item...'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500"/>
                </div>
                
                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-56 overflow-y-auto">
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
                    {data.stock.filter(s => s.model.toLowerCase().includes(stockSearch.toLowerCase())).map(s => (
                       <div
                         key={s.id}
                         className="p-2 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-b-0 flex justify-between items-center text-gray-900"
                         onClick={() => {
                           setAddStockForm({...addStockForm, stockId: s.id});
                           setIsDropdownOpen(false);
                           setStockSearch('');
                         }}
                       >
                         <span className="font-semibold text-gray-900">{s.model} <span className="text-gray-500 font-normal">(Rs {s.ntd?.toLocaleString('en-IN')})</span></span> 
                         <span className="text-gray-500 text-xs font-medium">Blnc: {(s.x_b || 0) + (s.in || 0) - (s.sale || 0)}</span>
                       </div>
                    ))}
                    {data.stock.filter(s => s.model.toLowerCase().includes(stockSearch.toLowerCase())).length === 0 && (
                      <div className="p-2 text-sm text-gray-500 text-center">No items found</div>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qty to Add (In)</label>
                  <input type="number" min="1" className="w-full border rounded p-2" placeholder="0" value={addStockForm.in} onChange={e => setAddStockForm({...addStockForm, in: e.target.value})} required/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Cost Price (NTD)</label>
                  <input type="number" className="w-full border rounded p-2" placeholder="0" value={addStockForm.ntd} onChange={e => setAddStockForm({...addStockForm, ntd: e.target.value})} required/>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <input type="text" className="w-full border rounded p-2 text-sm" placeholder="e.g. Bought from wholesale market..." value={addStockForm.desc} onChange={e => setAddStockForm({...addStockForm, desc: e.target.value})} />
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button type="button" onClick={() => setShowAddStockModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium transition cursor-pointer">Cancel</button>
                <button type="button" onClick={(e) => handleAddStockSubmit(e, true)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition cursor-pointer">Add Next Stock</button>
                <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition cursor-pointer">Add Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print-hidden" onClick={() => setHistoryItem(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Sales History: {historyItem.model}</h2>
              <button onClick={() => setHistoryItem(null)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex gap-2 mb-4">
              {['All', 'Today', '7 Days', '30 Days'].map(f => (
                <button key={f} onClick={() => setHistoryFilter(f)} className={`px-3 py-1 rounded-full text-xs font-semibold transition ${historyFilter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {f}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-auto border rounded bg-gray-50 p-0">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white sticky top-0 shadow-sm uppercase tracking-wider">
                  <tr>
                    <th className="py-2 px-2 font-semibold border-r border-slate-700 text-center w-8">#</th>
                    <th className="py-2 px-2 font-semibold border-r border-slate-700">Date & Time</th>
                    <th className="py-2 px-2 font-semibold border-r border-slate-700 text-center">Qty</th>
                    <th className="py-2 px-2 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(() => {
                    let allTx = [
                      ...(data.sales || []).filter(s => s.stockId === historyItem.id).map(s => ({
                        date: s.date,
                        type: 'Sale',
                        qty: s.qty,
                        details: `Sale: Rs ${s.salePrice.toLocaleString('en-IN')}` + (s.cashAmount > 0 || s.onlineAmount > 0 ? ` (${[s.cashAmount > 0 ? `C: ${s.cashAmount.toLocaleString('en-IN')}` : null, s.onlineAmount > 0 ? `O: ${s.onlineAmount.toLocaleString('en-IN')}` : null].filter(Boolean).join(' + ')})` : '')
                      }))
                    ];
                    
                    allTx.sort((a, b) => new Date(b.date) - new Date(a.date));
                    
                    const now = new Date();
                    if (historyFilter === 'Today') {
                      allTx = allTx.filter(t => new Date(t.date).toDateString() === now.toDateString());
                    } else if (historyFilter === '7 Days') {
                      const past = new Date(now.setDate(now.getDate() - 7));
                      allTx = allTx.filter(t => new Date(t.date) >= past);
                    } else if (historyFilter === '30 Days') {
                      const past = new Date(now.setDate(now.getDate() - 30));
                      allTx = allTx.filter(t => new Date(t.date) >= past);
                    }

                    if (allTx.length === 0) {
                      return <tr><td colSpan={5} className="py-2 text-center text-gray-500">No history found.</td></tr>;
                    }
                    
                    return allTx.map((tx, i) => (
                      <tr key={i} className="hover:bg-gray-100 transition-colors">
                        <td className="py-1 px-2 border-r border-gray-200 text-center font-semibold text-gray-500">{i + 1}</td>
                        <td className="py-1 px-2 border-r border-gray-200 whitespace-nowrap text-gray-600">{new Date(tx.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td className="py-1 px-2 border-r border-gray-200 text-center font-bold text-gray-700">{tx.qty}</td>
                        <td className="py-1 px-2 text-gray-500 truncate max-w-[200px]" title={tx.details}>{tx.details}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showGlobalHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print-hidden" onClick={() => setShowGlobalHistory(false)}>
          <div className={`bg-white rounded-xl shadow-2xl w-full ${purchaseHistoryItem ? 'max-w-4xl' : 'max-w-3xl'} p-6 flex flex-col max-h-[90vh]`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {purchaseHistoryItem ? `Purchase History: ${purchaseHistoryItem.model}` : "Global Sales History"}
              </h2>
              <button onClick={() => setShowGlobalHistory(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex gap-2 mb-4">
              {['All', 'Today', '7 Days', '30 Days'].map(f => (
                <button key={f} onClick={() => setGlobalHistoryFilter(f)} className={`px-3 py-1 rounded-full text-xs font-semibold transition ${globalHistoryFilter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {f}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-auto border rounded bg-gray-50 p-0">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white sticky top-0 shadow-sm uppercase tracking-wider">
                  <tr>
                    <th className="py-2 px-2 font-semibold border-r border-slate-700 text-center w-8">#</th>
                    <th className="py-2 px-2 font-semibold border-r border-slate-700">Date & Time</th>
                    {!purchaseHistoryItem && <th className="py-2 px-2 font-semibold border-r border-slate-700">Item</th>}
                    <th className="py-2 px-2 font-semibold border-r border-slate-700 text-center">Qty Added</th>
                    {purchaseHistoryItem && <th className="py-2 px-2 font-semibold border-r border-slate-700 text-right">Prev Price</th>}
                    {purchaseHistoryItem && <th className="py-2 px-2 font-semibold border-r border-slate-700 text-right">New Price</th>}
                    <th className="py-2 px-2 font-semibold border-r border-slate-700 text-right">Total Amount</th>
                    <th className={`py-2 px-2 font-semibold ${purchaseHistoryItem ? 'border-r border-slate-700' : ''}`}>Details</th>
                    {purchaseHistoryItem && <th className="py-2 px-2 font-semibold text-center w-16">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(() => {
                    let allTx = purchaseHistoryItem
                      ? (data.history || []).filter(h => (h.type === 'Stock In' || h.type === 'Initial Stock' || h.type === 'Price Update') && h.stockId === purchaseHistoryItem.id)
                      : (data.sales || []).map(s => ({
                          date: s.date,
                          stockId: s.stockId,
                          type: 'Sale',
                          qty: s.qty,
                          total: s.salePrice,
                          details: `Sale: Rs ${s.salePrice.toLocaleString('en-IN')}` + (s.cashAmount > 0 || s.onlineAmount > 0 ? ` (${[s.cashAmount > 0 ? `C: ${s.cashAmount.toLocaleString('en-IN')}` : null, s.onlineAmount > 0 ? `O: ${s.onlineAmount.toLocaleString('en-IN')}` : null].filter(Boolean).join(' + ')})` : '')
                        }));
                    
                    allTx.sort((a, b) => new Date(b.date) - new Date(a.date));
                    
                    const now = new Date();
                    if (globalHistoryFilter === 'Today') {
                      allTx = allTx.filter(t => new Date(t.date).toDateString() === now.toDateString());
                    } else if (globalHistoryFilter === '7 Days') {
                      const past = new Date(now.setDate(now.getDate() - 7));
                      allTx = allTx.filter(t => new Date(t.date) >= past);
                    } else if (globalHistoryFilter === '30 Days') {
                      const past = new Date(now.setDate(now.getDate() - 30));
                      allTx = allTx.filter(t => new Date(t.date) >= past);
                    }

                    if (allTx.length === 0) {
                      return <tr><td colSpan={purchaseHistoryItem ? 8 : 6} className="py-4 text-center text-gray-500">No transactions found.</td></tr>;
                    }
                    
                    return allTx.map((tx, i) => {
                      const stockItem = data.stock.find(s => s.id === tx.stockId);
                      const itemName = stockItem ? stockItem.model : 'Unknown Item';

                      let totalAmt = 0;
                      if (tx.total !== undefined) {
                        totalAmt = tx.total;
                      } else if (tx.details && tx.details.includes('Cost: Rs ')) {
                        const match = tx.details.match(/Cost: Rs ([\d,.]+) \(NTD\)/);
                        if (match) {
                          const unitCost = parseFloat(match[1].replace(/,/g, ''));
                          totalAmt = unitCost * tx.qty;
                        }
                      }

                      const prevNtd = tx.prevNtd !== undefined ? tx.prevNtd : (chronologicalPrices[tx.id]?.prevNtd ?? 0);
                      const newNtd = tx.newNtd !== undefined ? tx.newNtd : (chronologicalPrices[tx.id]?.newNtd ?? 0);

                      return (
                        <tr key={i} className="hover:bg-gray-100 transition-colors">
                          <td className="py-1 px-2 border-r border-gray-200 text-center font-semibold text-gray-500">{i + 1}</td>
                          <td className="py-1 px-2 border-r border-gray-200 whitespace-nowrap text-gray-600">{new Date(tx.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                          {!purchaseHistoryItem && <td className="py-1 px-2 border-r border-gray-200 font-bold text-gray-800">{itemName}</td>}
                          <td className="py-1 px-2 border-r border-gray-200 text-center font-bold text-gray-700">{tx.qty}</td>
                          {purchaseHistoryItem && (
                            <td className="py-1 px-2 border-r border-gray-200 text-right font-semibold text-gray-600">
                              {prevNtd > 0 ? `Rs ${prevNtd.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : '-'}
                            </td>
                          )}
                          {purchaseHistoryItem && (
                            <td className="py-1 px-2 border-r border-gray-200 text-right font-bold text-indigo-600">
                              Rs {newNtd.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                            </td>
                          )}
                          <td className="py-1 px-2 border-r border-gray-200 text-right font-bold text-gray-800">Rs {totalAmt.toLocaleString('en-IN')}</td>
                          <td className={`py-1 px-2 text-gray-500 truncate max-w-[200px] ${purchaseHistoryItem ? 'border-r border-gray-200' : ''}`} title={tx.details}>{tx.details}</td>
                          {purchaseHistoryItem && (
                            <td className="py-1 px-2 text-center">
                              <button onClick={() => deletePurchaseTransaction(tx)} className="text-red-600 hover:bg-red-50 p-1 rounded transition" title="Delete Transaction">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* Print Preview Modal */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col items-center justify-center p-4 print:static print:block print:p-0 print:bg-white" onClick={() => setShowPrintPreview(false)}>
          <div className="bg-slate-900 text-white rounded-t-xl w-full max-w-4xl px-6 py-3 flex justify-between items-center shadow-lg print-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <Printer className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold">Print Preview - Stock Inventory Report</h2>
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
                    <p className="text-sm font-semibold text-gray-600 mt-1">Stock Inventory Report</p>
                    {data.settings?.branchAddress && <p className="text-[10px] text-gray-500 mt-0.5">{data.settings.branchAddress}</p>}
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>Report Date: {formatReportDate(selectedDate)}</p>
                    <p>Total Stock Items: {data.stock.length}</p>
                  </div>
                </div>

                <table className="w-full text-left text-xs border-collapse border border-gray-300 mb-6">
                  <thead>
                    <tr className="bg-slate-800 text-white border-b border-gray-300">
                      <th className="py-2.5 px-2 border-r border-slate-700 text-center w-8">#</th>
                      <th className="py-2.5 px-2 border-r border-slate-700">Model</th>
                      <th className="py-2.5 px-2 border-r border-slate-700 text-center">X-B</th>
                      <th className="py-2.5 px-2 border-r border-slate-700 text-center">In</th>
                      <th className="py-2.5 px-2 border-r border-slate-700 text-center">T-B</th>
                      <th className="py-2.5 px-2 border-r border-slate-700 text-center">Sale</th>
                      <th className="py-2.5 px-2 border-r border-slate-700 text-center">Blnc</th>
                      <th className="py-2.5 px-2 text-right">NTD (Cost)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.categories.map(category => {
                      const catItems = allStockByCategory[category] || [];
                      if (catItems.length === 0) return null;

                      const catTotals = catItems.reduce((totals, item) => {
                        const { x_b, in: inQty, tb, sale: saleQty, blnc } = itemsStockForSelectedDate[item.id] || { x_b: 0, in: 0, tb: 0, sale: 0, blnc: 0 };
                        totals.x_b += x_b;
                        totals.in += inQty;
                        totals.tb += tb;
                        totals.sale += saleQty;
                        totals.blnc += blnc;
                        totals.value += blnc * (item.ntd || 0);
                        return totals;
                      }, { x_b: 0, in: 0, tb: 0, sale: 0, blnc: 0, value: 0 });

                      return (
                        <React.Fragment key={category}>
                          <tr className="bg-gray-200 font-bold border-b border-gray-300">
                            <td colSpan={8} className="py-0.5 px-1.5 text-slate-900 uppercase">
                              {category} ({catItems.length} items)
                            </td>
                          </tr>
                          {catItems.map((item, index) => {
                            const { x_b, in: inQty, tb, sale: saleQty, blnc } = itemsStockForSelectedDate[item.id] || { x_b: 0, in: 0, tb: 0, sale: 0, blnc: 0 };
                            return (
                              <tr key={item.id} className="border-b border-gray-200">
                                <td className="py-0.5 px-1.5 border-r border-gray-200 text-gray-500">{index + 1}</td>
                                <td className="py-0.5 px-1.5 border-r border-gray-200 font-medium">{item.model}</td>
                                <td className="py-0.5 px-1.5 border-r border-gray-200 text-center">{x_b}</td>
                                <td className="py-0.5 px-1.5 border-r border-gray-200 text-center">{inQty}</td>
                                <td className="py-0.5 px-1.5 border-r border-gray-200 text-center font-semibold">{tb}</td>
                                <td className="py-0.5 px-1.5 border-r border-gray-200 text-center">{saleQty}</td>
                                <td className={`py-0.5 px-1.5 border-r border-gray-200 text-center font-bold ${blnc > 0 ? 'text-green-700' : 'text-red-600'}`}>{blnc}</td>
                                 <td className="py-0.5 px-1.5 text-right text-black">Rs {item.ntd?.toLocaleString('en-IN') || 0}</td>
                              </tr>
                            );
                          })}
                          <tr className="bg-gray-100 font-bold border-b border-gray-300 font-sans">
                            <td className="py-0.5 px-1.5 border-r border-gray-200 text-center text-gray-500 font-semibold font-sans">-</td>
                            <td className="py-0.5 px-1.5 border-r border-gray-200 uppercase text-slate-800 font-bold font-sans">Total {category}</td>
                            <td className="py-0.5 px-1.5 border-r border-gray-200 text-center font-bold font-sans text-slate-800">{catTotals.x_b}</td>
                            <td className="py-0.5 px-1.5 border-r border-gray-200 text-center font-bold font-sans text-slate-800">{catTotals.in}</td>
                            <td className="py-0.5 px-1.5 border-r border-gray-200 text-center font-bold font-sans text-slate-800">{catTotals.tb}</td>
                            <td className="py-0.5 px-1.5 border-r border-gray-200 text-center font-bold font-sans text-slate-800">{catTotals.sale}</td>
                            <td className={`py-0.5 px-1.5 border-r border-gray-200 text-center font-bold font-sans ${catTotals.blnc > 0 ? 'text-green-700' : 'text-red-600'}`}>{catTotals.blnc}</td>
                            <td className="py-0.5 px-1.5 text-right font-bold font-sans text-black">Rs {catTotals.value.toLocaleString('en-IN')}</td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="border-t-2 border-slate-900 pt-4 mt-6">
                <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded">
                  <div>
                    <h3 className="text-xs uppercase font-bold text-slate-400">Total Stock Value</h3>
                    <p className="text-[10px] text-slate-400">Cost Price (NTD) × Available Balance</p>
                  </div>
                  <div className="text-xl font-bold text-green-400">
                    Rs {globalTotalValue.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
