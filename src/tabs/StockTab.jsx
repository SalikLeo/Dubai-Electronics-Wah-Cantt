import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Calendar, Plus, Edit2, Trash2, Printer, ChevronDown, ChevronRight, Check, X, RefreshCw, History, ClipboardList, ShoppingCart, PlusCircle, TrendingUp } from 'lucide-react';
import { useDialog } from '../components/DialogProvider.jsx';
import { formatDateClean } from '../utils/date';

const formatIndianNumber = (val) => {
  if (val === undefined || val === null || val === '') return '';
  const numStr = String(val).replace(/,/g, '');
  const num = Number(numStr);
  if (isNaN(num)) return '';
  return num.toLocaleString('en-IN');
};

const formatMonthName = (ym) => {
  if (!ym) return '';
  const parts = ym.split('-');
  const year = parts[0];
  const monthNum = parseInt(parts[1], 10);
  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  return `${months[monthNum - 1]} ${year}`;
};

export default function StockTab({ data, saveData, activeBranch }) {
  const { alert, confirm } = useDialog();
  const location = useLocation();

  const [expandedCats, setExpandedCats] = useState({});
  const [isEditing, setIsEditing] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [tableSearch, setTableSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('latest');
  const todayYMD = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const currentYM = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [filterType, setFilterType] = useState('Daily');
  const [selectedDate, setSelectedDate] = useState(todayYMD);
  const [selectedMonth, setSelectedMonth] = useState(currentYM);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState(todayYMD);
  const [endDate, setEndDate] = useState(todayYMD);

  const getTransactionDate = () => {
    const now = new Date();
    let targetYMD = todayYMD;

    if (filterType === 'Daily') {
      targetYMD = selectedDate;
    } else if (filterType === 'Monthly') {
      if (selectedMonth === currentYM) {
        targetYMD = todayYMD;
      } else {
        const [y, m] = selectedMonth.split('-').map(Number);
        const lastDay = new Date(y, m, 0).getDate();
        targetYMD = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      }
    } else if (filterType === 'Custom') {
      targetYMD = endDate;
    } else if (filterType === 'Annual') {
      const y = Number(selectedYear);
      const currY = now.getFullYear();
      if (y === currY) {
        targetYMD = todayYMD;
      } else {
        targetYMD = `${y}-12-31`;
      }
    }

    const [y, m, d] = targetYMD.split('-').map(Number);
    return new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds()).toISOString();
  };

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

  const filterLabel = useMemo(() => {
    if (filterType === 'Daily') return `Daily (${formatReportDate(selectedDate)})`;
    if (filterType === 'Monthly') return `Monthly (${formatMonthName(selectedMonth)})`;
    if (filterType === 'Annual') return `Annual (${selectedYear})`;
    if (filterType === 'Custom') return `Custom (${startDate} to ${endDate})`;
    return 'All Time';
  }, [filterType, selectedDate, selectedMonth, selectedYear, startDate, endDate]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ model: '', category: data.categories[0] || '', x_b: '', in: '', sale: '', ntd: '' });
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [addStockForm, setAddStockForm] = useState({ stockId: '', in: '', ntd: '', desc: '' });
  const [historyItem, setHistoryItem] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('All');
  const [showGlobalHistory, setShowGlobalHistory] = useState(false);
  const [globalHistoryFilter, setGlobalHistoryFilter] = useState('Today');
  const [purchaseHistoryItem, setPurchaseHistoryItem] = useState(null);
  const [globalHistoryType, setGlobalHistoryType] = useState('sales');
  const [globalHistorySort, setGlobalHistorySort] = useState('latest');
  const [globalHistorySearch, setGlobalHistorySearch] = useState('');
  const [stockSearch, setStockSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showPrintHistoryPreview, setShowPrintHistoryPreview] = useState(false);

  useEffect(() => {
    if (location.state?.openAddModal) {
      setShowAddModal(true);
      window.history.replaceState({}, document.title);
    } else if (location.state?.openAddStockModal) {
      setShowAddStockModal(true);
      if (location.state?.stockId) {
        const s = data.stock.find(item => item.id === location.state.stockId);
        setAddStockForm(prev => ({ 
          ...prev, 
          stockId: location.state.stockId,
          ntd: s ? String(s.ntd || 0) : ''
        }));
      }
      window.history.replaceState({}, document.title);
    }
  }, [location, data.stock, setAddStockForm]);

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
    const txDateIso = getTransactionDate();

    const newHistory = [...(data.history || [])];

    const initialTx = {
      id: Date.now().toString() + '1',
      date: txDateIso,
      stockId: newItem.id,
      type: 'Initial Stock',
      qty: newItem.x_b,
      details: `Cost: Rs ${newItem.ntd.toLocaleString('en-IN')} (NTD)`,
      prevNtd: 0,
      newNtd: newItem.ntd
    };
    newHistory.push(initialTx);

    if (newItem.in > 0) {
      const inTx = {
        id: Date.now().toString() + '2',
        date: txDateIso,
        stockId: newItem.id,
        type: 'Stock In',
        qty: newItem.in,
        details: `Cost: Rs ${newItem.ntd.toLocaleString('en-IN')} (NTD)`,
        prevNtd: newItem.ntd,
        newNtd: newItem.ntd
      };
      newHistory.push(inTx);
    }

    saveData({ ...data, stock: [...data.stock, newItem], history: newHistory });
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
    const currentBalance = Math.max(0, (stockItem.x_b || 0) + (stockItem.in || 0) - (stockItem.sale || 0));
    let newNtd = currentNtd === 0 || currentBalance <= 0
      ? addedNtd
      : ((currentBalance * currentNtd) + (addedQty * addedNtd)) / (currentBalance + addedQty);

    const updatedStock = data.stock.map(item => 
      item.id === stockItem.id ? { 
        ...item, 
        in: (item.in || 0) + addedQty,
        ntd: newNtd
      } : item
    );

    const txDateIso = getTransactionDate();

    const newTx = {
      id: Date.now().toString(),
      date: txDateIso,
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

      const txDateIso = getTransactionDate();

      // Add Price Update transaction
      const newTx = {
        id: Date.now().toString(),
        date: txDateIso,
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
        const itemSales = (data.sales || []).filter(s => {
          if (s.items && s.items.length > 0) {
            return s.items.some(si => si.stockId === tx.stockId);
          }
          return s.stockId === tx.stockId;
        });

        const mappedSales = [];
        itemSales.forEach(s => {
          const items = s.items || [{ stockId: s.stockId, qty: s.qty }];
          const matchedItem = items.find(si => si.stockId === tx.stockId);
          if (matchedItem) {
            mappedSales.push({
              ...s,
              qty: Number(matchedItem.qty || 0),
              eventType: 'sale'
            });
          }
        });

        const allEvents = [
          ...remainingItemHistory.map(h => ({ ...h, eventType: 'history' })),
          ...mappedSales
        ].sort((a, b) => {
          const aType = a.type || a.eventType;
          const bType = b.type || b.eventType;
          const aIsInitial = aType === 'Initial Stock';
          const bIsInitial = bType === 'Initial Stock';
          if (aIsInitial && !bIsInitial) return -1;
          if (!aIsInitial && bIsInitial) return 1;
          return new Date(a.date) - new Date(b.date);
        });

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
              runningNtd = (runningNtd === 0 || runningBlnc <= 0)
                ? addedNtd
                : ((runningBlnc * runningNtd) + (event.qty * addedNtd)) / (runningBlnc + event.qty);
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
      const items = s.items || [{ stockId: s.stockId, qty: s.qty }];
      items.forEach(item => {
        const id = item.stockId;
        if (!id) return;
        if (!salesMap[id]) salesMap[id] = [];
        salesMap[id].push({
          qty: Number(item.qty || 0),
          ymd: getYMD(s.date)
        });
      });
    });

    return { stockInMap, salesMap };
  }, [data.history, data.sales]);

  // Group and sort all stock history and sales events chronologically by stock item
  const chronologicalEventsByItem = useMemo(() => {
    const getYMD = (dateString) => {
      if (!dateString) return '';
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '';
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const map = {};

    (data.history || []).forEach(h => {
      const id = h.stockId;
      if (!id) return;
      if (!map[id]) map[id] = [];
      map[id].push({
        type: h.type,
        date: h.date,
        ymd: getYMD(h.date),
        qty: Number(h.qty || 0),
        details: h.details,
        eventType: 'history'
      });
    });

    (data.sales || []).forEach(s => {
      const items = s.items || [{ stockId: s.stockId, qty: s.qty }];
      items.forEach(item => {
        const id = item.stockId;
        if (!id) return;
        if (!map[id]) map[id] = [];
        map[id].push({
          date: s.date,
          ymd: getYMD(s.date),
          qty: Number(item.qty || 0),
          eventType: 'sale'
        });
      });
    });

    Object.keys(map).forEach(id => {
      map[id].sort((a, b) => {
        const aType = a.type || a.eventType;
        const bType = b.type || b.eventType;
        const aIsInitial = aType === 'Initial Stock';
        const bIsInitial = bType === 'Initial Stock';
        if (aIsInitial && !bIsInitial) return -1;
        if (!aIsInitial && bIsInitial) return 1;
        return new Date(a.date) - new Date(b.date);
      });
    });

    return map;
  }, [data.history, data.sales]);

  // Helper to calculate the historical running NTD for a given item up to targetYMD
  const getItemNtdForDate = useCallback((item, targetYMD) => {
    if (!item) return 0;

    const events = chronologicalEventsByItem[item.id] || [];
    let runningNtd = item.ntd || 0;
    let runningBlnc = 0;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (targetYMD && event.ymd > targetYMD) {
        continue;
      }

      if (event.eventType === 'history') {
        if (event.type === 'Initial Stock') {
          let addedNtd = 0;
          const match = event.details ? event.details.match(/Cost: Rs ([\d,.]+) \(NTD\)/) : null;
          if (match) {
            addedNtd = parseFloat(match[1].replace(/,/g, ''));
          } else {
            addedNtd = item.ntd || 0;
          }
          runningNtd = addedNtd;
          runningBlnc = event.qty;
        } else if (event.type === 'Stock In') {
          let addedNtd = 0;
          const match = event.details ? event.details.match(/Cost: Rs ([\d,.]+) \(NTD\)/) : null;
          if (match) {
            addedNtd = parseFloat(match[1].replace(/,/g, ''));
          }
          runningNtd = (runningNtd === 0 || runningBlnc <= 0)
            ? addedNtd
            : ((runningBlnc * runningNtd) + (event.qty * addedNtd)) / (runningBlnc + event.qty);
          runningBlnc += event.qty;
        } else if (event.type === 'Price Update') {
          let addedNtd = 0;
          const match = event.details ? event.details.match(/Cost: Rs ([\d,.]+) \(NTD\)/) : null;
          if (match) {
            addedNtd = parseFloat(match[1].replace(/,/g, ''));
          }
          runningNtd = addedNtd;
        }
      } else if (event.eventType === 'sale') {
        runningBlnc -= event.qty;
      }
    }

    return runningNtd;
  }, [chronologicalEventsByItem]);

  // Pre-calculate stock levels for the selectedDate to avoid repeating loops for each render call
  const itemsStockForSelectedDate = useMemo(() => {
    const { stockInMap, salesMap } = processedStockData;
    let rangeStart = null;
    let rangeEnd = null;

    if (filterType === 'Daily') {
      const diffDays = getDaysAgo(selectedDate);
      if (diffDays > 0) {
        rangeStart = selectedDate;
        rangeEnd = todayYMD;
      } else {
        rangeStart = selectedDate;
        rangeEnd = selectedDate;
      }
    } else if (filterType === 'Monthly') {
      const [y, m] = selectedMonth.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      rangeStart = `${y}-${String(m).padStart(2, '0')}-01`;
      rangeEnd = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    } else if (filterType === 'Annual') {
      const y = selectedYear;
      rangeStart = `${y}-01-01`;
      rangeEnd = `${y}-12-31`;
    } else if (filterType === 'Custom') {
      rangeStart = startDate;
      rangeEnd = endDate;
    }

    const stockMap = {};

    (data?.stock || []).forEach(item => {
      const stockInHistory = stockInMap[item.id] || [];
      const salesHistory = salesMap[item.id] || [];

      let inBefore = 0;
      let inOnRange = 0;
      for (let i = 0; i < stockInHistory.length; i++) {
        const h = stockInHistory[i];
        if (filterType === 'All Time') {
          inOnRange += h.qty;
        } else {
          if (h.ymd < rangeStart) {
            inBefore += h.qty;
          } else if (h.ymd >= rangeStart && h.ymd <= rangeEnd) {
            inOnRange += h.qty;
          }
        }
      }

      let saleBefore = 0;
      let saleOnRange = 0;
      for (let i = 0; i < salesHistory.length; i++) {
        const s = salesHistory[i];
        if (filterType === 'All Time') {
          saleOnRange += s.qty;
        } else {
          if (s.ymd < rangeStart) {
            saleBefore += s.qty;
          } else if (s.ymd >= rangeStart && s.ymd <= rangeEnd) {
            saleOnRange += s.qty;
          }
        }
      }

      const baseXB = Number(item.x_b || 0);
      const x_b = Math.max(0, baseXB + inBefore - saleBefore);
      const inQty = inOnRange;
      const tb = x_b + inQty;
      const saleQty = saleOnRange;
      const blnc = tb - saleQty;
      const ntd = getItemNtdForDate(item, rangeEnd);

      stockMap[item.id] = { x_b, in: inQty, tb, sale: saleQty, blnc, ntd };
    });

    return stockMap;
  }, [data?.stock, processedStockData, getDaysAgo, selectedDate, selectedMonth, selectedYear, startDate, endDate, filterType, todayYMD, getItemNtdForDate]);

  // Helper to calculate Stock for any date (X-B for selectedDate equals previous date's BLNC)
  // Keeps same signature, but uses the cached itemsStockForSelectedDate for the active date.
  const getItemStockForDate = useCallback((item, dateYMD) => {
    if (!item) return { x_b: 0, in: 0, tb: 0, sale: 0, blnc: 0, ntd: 0 };
    if (dateYMD === selectedDate) {
      return itemsStockForSelectedDate[item.id] || { x_b: 0, in: 0, tb: 0, sale: 0, blnc: 0, ntd: item.ntd || 0 };
    }

    const { stockInMap, salesMap } = processedStockData;
    const stockInHistory = stockInMap[item.id] || [];
    const salesHistory = salesMap[item.id] || [];

    let inQty = 0;
    for (let i = 0; i < stockInHistory.length; i++) {
      const h = stockInHistory[i];
      if (h.ymd <= dateYMD) {
        inQty += h.qty;
      }
    }

    let saleQty = 0;
    for (let i = 0; i < salesHistory.length; i++) {
      const s = salesHistory[i];
      if (s.ymd <= dateYMD) {
        saleQty += s.qty;
      }
    }

    const baseXB = Number(item.x_b || 0);
    const blnc = Math.max(0, baseXB + inQty - saleQty);
    const ntd = getItemNtdForDate(item, dateYMD);

    return { x_b: baseXB, in: inQty, tb: baseXB + inQty, sale: saleQty, blnc, ntd };
  }, [itemsStockForSelectedDate, selectedDate, processedStockData, getItemNtdForDate]);

  // Pre-filter stock list by search term
  const filteredStock = useMemo(() => {
    const searchLower = tableSearch.toLowerCase().trim();
    if (!searchLower) return data.stock || [];
    return (data.stock || []).filter(item => item.model.toLowerCase().includes(searchLower));
  }, [data.stock, tableSearch]);

  // Group filtered stock by category and sort items
  const stockByCategory = useMemo(() => {
    const map = {};
    filteredStock.forEach(item => {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    });

    // Sort items within each category
    Object.keys(map).forEach(cat => {
      map[cat].sort((a, b) => {
        const aStock = itemsStockForSelectedDate[a.id] || { blnc: 0 };
        const bStock = itemsStockForSelectedDate[b.id] || { blnc: 0 };

        if (sortBy === 'latest') {
          return b.id.localeCompare(a.id);
        } else if (sortBy === 'oldest') {
          return a.id.localeCompare(b.id);
        } else if (sortBy === 'model-asc') {
          return a.model.localeCompare(b.model);
        } else if (sortBy === 'model-desc') {
          return b.model.localeCompare(a.model);
        } else if (sortBy === 'blnc-desc') {
          return bStock.blnc - aStock.blnc;
        } else if (sortBy === 'blnc-asc') {
          return aStock.blnc - bStock.blnc;
        } else if (sortBy === 'ntd-desc') {
          return (b.ntd || 0) - (a.ntd || 0);
        } else if (sortBy === 'ntd-asc') {
          return (a.ntd || 0) - (b.ntd || 0);
        } else if (sortBy === 'value-desc') {
          const aValue = aStock.blnc * (a.ntd || 0);
          const bValue = bStock.blnc * (b.ntd || 0);
          return bValue - aValue;
        } else if (sortBy === 'value-asc') {
          const aValue = aStock.blnc * (a.ntd || 0);
          const bValue = bStock.blnc * (b.ntd || 0);
          return aValue - bValue;
        }
        return 0; // default order
      });
    });

    return map;
  }, [filteredStock, sortBy, itemsStockForSelectedDate]);

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
    const itemSales = (data.sales || []).filter(s => {
      if (s.items && s.items.length > 0) {
        return s.items.some(si => si.stockId === item.id);
      }
      return s.stockId === item.id;
    });

    const mappedSales = [];
    itemSales.forEach(s => {
      const items = s.items || [{ stockId: s.stockId, qty: s.qty }];
      const matchedItem = items.find(si => si.stockId === item.id);
      if (matchedItem) {
        mappedSales.push({
          ...s,
          qty: Number(matchedItem.qty || 0),
          eventType: 'sale'
        });
      }
    });

    // Combine and sort by date ascending
    const allEvents = [
      ...itemHistory.map(h => ({ ...h, eventType: 'history' })),
      ...mappedSales
    ].sort((a, b) => {
      const aType = a.type || a.eventType;
      const bType = b.type || b.eventType;
      const aIsInitial = aType === 'Initial Stock';
      const bIsInitial = bType === 'Initial Stock';
      if (aIsInitial && !bIsInitial) return -1;
      if (!aIsInitial && bIsInitial) return 1;
      return new Date(a.date) - new Date(b.date);
    });

    let balance = 0;
    let ntd = 0;
    const pricesMap = {}; // tx.id -> { prevNtd, newNtd }

    allEvents.forEach(event => {
      let prevNtd = 0;
      let addedNtd = 0;
      let newNtd = 0;

      if (event.eventType === 'history') {
        if (event.type === 'Initial Stock') {
          prevNtd = 0;
          addedNtd = 0;
          const match = event.details.match(/Cost: Rs ([\d,.]+) \(NTD\)/);
          if (match) {
            addedNtd = parseFloat(match[1].replace(/,/g, ''));
          } else {
            addedNtd = item.ntd || 0;
          }
          newNtd = addedNtd;
          ntd = newNtd;
          balance = event.qty;
          pricesMap[event.id] = { prevNtd, newNtd };
        } else if (event.type === 'Stock In') {
          prevNtd = ntd;
          addedNtd = 0;
          const match = event.details.match(/Cost: Rs ([\d,.]+) \(NTD\)/);
          if (match) {
            addedNtd = parseFloat(match[1].replace(/,/g, ''));
          }
          newNtd = (prevNtd === 0 || balance <= 0)
            ? addedNtd
            : ((balance * prevNtd) + (event.qty * addedNtd)) / (balance + event.qty);
          ntd = newNtd;
          balance += event.qty;
          pricesMap[event.id] = { prevNtd, newNtd };
        } else if (event.type === 'Price Update') {
          prevNtd = ntd;
          addedNtd = 0;
          const match = event.details.match(/Cost: Rs ([\d,.]+) \(NTD\)/);
          if (match) {
            addedNtd = parseFloat(match[1].replace(/,/g, ''));
          }
          newNtd = addedNtd;
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
      const { blnc, ntd } = itemsStockForSelectedDate[item.id] || { blnc: 0, ntd: item.ntd || 0 };
      return acc + (blnc * ntd);
    }, 0);
  }, [data?.stock, itemsStockForSelectedDate]);

  const filteredGlobalTransactions = useMemo(() => {
    if (!showGlobalHistory) return [];

    let allTx = purchaseHistoryItem
      ? (data.history || []).filter(h => (h.type === 'Stock In' || h.type === 'Initial Stock' || h.type === 'Price Update') && h.stockId === purchaseHistoryItem.id)
      : (globalHistoryType === 'purchases'
          ? (data.history || []).filter(h => h.type === 'Stock In' || h.type === 'Initial Stock' || h.type === 'Price Update')
          : (data.sales || []).flatMap(s => {
              const items = s.items || [{ stockId: s.stockId, qty: s.qty, salePrice: s.salePrice }];
              return items.map(item => ({
                date: s.date,
                stockId: item.stockId,
                type: 'Sale',
                qty: item.qty,
                total: item.salePrice,
                details: `Sale: Rs ${item.salePrice.toLocaleString('en-IN')}` + (s.customerName ? ` - ${s.customerName}` : '') + (s.invoiceNo ? ` (Inv: #${s.invoiceNo})` : '')
              }));
            })
        );

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

    if (globalHistorySearch.trim()) {
      const q = globalHistorySearch.toLowerCase().trim();
      allTx = allTx.filter(t => {
        const stockItem = data.stock.find(s => s.id === t.stockId);
        const itemName = stockItem ? stockItem.model.toLowerCase() : 'unknown item';
        const details = (t.details || '').toLowerCase();
        return itemName.includes(q) || details.includes(q);
      });
    }

    allTx.forEach(tx => {
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
      tx.calculatedTotal = totalAmt;
    });

    if (globalHistorySort === 'latest') {
      allTx.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (globalHistorySort === 'oldest') {
      allTx.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (globalHistorySort === 'qtyDesc') {
      allTx.sort((a, b) => b.qty - a.qty);
    } else if (globalHistorySort === 'qtyAsc') {
      allTx.sort((a, b) => a.qty - b.qty);
    } else if (globalHistorySort === 'amountDesc') {
      allTx.sort((a, b) => b.calculatedTotal - a.calculatedTotal);
    } else if (globalHistorySort === 'amountAsc') {
      allTx.sort((a, b) => a.calculatedTotal - b.calculatedTotal);
    }

    return allTx;
  }, [
    showGlobalHistory,
    purchaseHistoryItem,
    data.history,
    data.sales,
    globalHistoryType,
    globalHistoryFilter,
    globalHistorySearch,
    globalHistorySort,
    data.stock
  ]);

  return (
    <>
      <div className={`h-full flex flex-col p-6 print-content ${(showPrintPreview || showPrintHistoryPreview) ? 'print-hidden' : ''}`}>
      <div className="flex justify-between items-center mb-6 print-hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Stock</h1>
          <p className="text-gray-500 text-sm">Manage Stock Items</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2">
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
                </div>
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
              <input 
                type="number" 
                min="2000"
                max="2099"
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm font-medium text-gray-700 w-24 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
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

            {(filterType !== 'Daily' || selectedDate !== todayYMD) && filterType !== 'All Time' && (
              <button 
                onClick={() => {
                  setFilterType('Daily');
                  setSelectedDate(todayYMD);
                  setDaysAgoInput('0');
                }}
                className="text-gray-400 hover:text-red-500 hover:bg-gray-100 p-0.5 rounded-full transition ml-1"
                title="Reset to today"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {filterType === 'Daily' && getDaysAgo(selectedDate) > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-3 py-2 shadow-sm text-sm font-semibold">
              <span>Range: {formatReportDate(selectedDate)}</span>
            </div>
          )}
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
        <div className="w-48 shrink-0">
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
        <div className="w-48 shrink-0">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-gray-700 cursor-pointer"
          >
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
            <option value="model-asc">Model Name (A-Z)</option>
            <option value="model-desc">Model Name (Z-A)</option>
            <option value="blnc-desc">Balance (High to Low)</option>
            <option value="blnc-asc">Balance (Low to High)</option>
            <option value="ntd-desc">Unit Cost (High to Low)</option>
            <option value="ntd-asc">Unit Cost (Low to High)</option>
            <option value="value-desc">Total Value (High to Low)</option>
            <option value="value-asc">Total Value (Low to High)</option>
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
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold text-right print-hidden">NTD</th>
              <th className="py-2.5 px-2 border-r border-slate-700 font-semibold text-right print-hidden">Total NTD</th>
              <th className="py-2.5 px-2 font-semibold text-center print-hidden w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {data.categories
              .filter(category => selectedCategoryFilter === 'All' || category === selectedCategoryFilter)
              .map(category => {
                const catItems = stockByCategory[category] || [];
                if (catItems.length === 0) return null;
              
              const isExpanded = expandedCats[category] !== false; // default true
              const catTotals = catItems.reduce((totals, item) => {
                const { x_b, in: inQty, tb, sale: saleQty, blnc, ntd } = itemsStockForSelectedDate[item.id] || { x_b: 0, in: 0, tb: 0, sale: 0, blnc: 0, ntd: item.ntd || 0 };
                totals.x_b += x_b;
                totals.in += inQty;
                totals.tb += tb;
                totals.sale += saleQty;
                totals.blnc += blnc;
                totals.value += blnc * ntd;
                return totals;
              }, { x_b: 0, in: 0, tb: 0, sale: 0, blnc: 0, value: 0 });

              return (
                <React.Fragment key={category}>
                  {/* Category Header */}
                  <tr className="bg-blue-50/50 hover:bg-blue-50 cursor-pointer print-header" onClick={() => toggleCategory(category)}>
                    <td colSpan={10} className="py-0.5 px-1.5 border-b text-blue-800 font-bold">
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
                    const { x_b, in: inQty, tb, sale: saleQty, blnc, ntd } = itemsStockForSelectedDate[item.id] || { x_b: 0, in: 0, tb: 0, sale: 0, blnc: 0, ntd: item.ntd || 0 };
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
                          {editing ? <input type="number" className="border p-1 w-20 text-right rounded" value={editForm.ntd} onChange={e=>setEditForm({...editForm, ntd: e.target.value})} /> : `Rs ${ntd?.toLocaleString('en-IN') || 0}`}
                        </td>
                        <td className="py-0.5 px-1.5 border-r border-gray-200 text-right text-gray-500 print-hidden font-bold">
                          Rs {(blnc * ntd).toLocaleString('en-IN')}
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
                                <button onClick={() => { setAddStockForm({ stockId: item.id, in: '', ntd: String(item.ntd || 0), desc: '' }); setShowAddStockModal(true); }} className="text-green-600 hover:bg-green-50 p-0.5 rounded transition" title="Add Stock"><PlusCircle className="w-4 h-4" /></button>
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
                      <td className="py-1.5 px-2 border-r border-gray-200 text-slate-850 uppercase font-bold font-sans">Total</td>
                      <td className="py-1.5 px-2 border-r border-gray-200 text-center text-slate-800 font-bold font-sans">{catTotals.x_b}</td>
                      <td className="py-1.5 px-2 border-r border-gray-200 text-center text-slate-800 font-bold font-sans">{catTotals.in}</td>
                      <td className="py-1.5 px-2 border-r border-gray-200 text-center text-slate-800 font-bold font-sans">{catTotals.tb}</td>
                      <td className="py-1.5 px-2 border-r border-gray-200 text-center text-slate-800 font-bold font-sans">{catTotals.sale}</td>
                      <td className={`py-1.5 px-2 border-r border-gray-200 text-center font-bold font-sans ${catTotals.blnc > 0 ? 'text-green-700' : 'text-red-600'}`}>{catTotals.blnc}</td>
                      <td className="py-1.5 px-2 border-r border-gray-200 text-right text-slate-700 print-hidden font-bold font-sans">-</td>
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

      <div className="mt-4 bg-slate-900 text-white py-2 px-4 rounded-xl shadow-md flex justify-between items-center print-hidden">
        <div>
          <h3 className="text-white text-xs font-semibold tracking-wider uppercase">Total Stock Value</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Based on Cost Price (NTD) × Available Balance</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-green-400">
            Rs {globalTotalValue.toLocaleString('en-IN')}
          </div>
          <div className="text-xs font-semibold text-amber-300 mt-0.5">
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
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="0" 
                  value={formatIndianNumber(addForm.ntd)} 
                  onChange={e => {
                    const rawVal = e.target.value.replace(/[^0-9]/g, '');
                    setAddForm({...addForm, ntd: rawVal});
                  }} 
                />
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
                           setAddStockForm({
                             ...addStockForm,
                             stockId: s.id,
                             ntd: String(s.ntd || 0)
                           });
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
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="0" 
                    value={formatIndianNumber(addStockForm.ntd)} 
                    onChange={e => {
                      const rawVal = e.target.value.replace(/[^0-9]/g, '');
                      setAddStockForm({...addStockForm, ntd: rawVal});
                    }} 
                    required
                  />
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
                    let allTx = [];
                    (data.sales || []).forEach(s => {
                      const items = s.items || [{ stockId: s.stockId, qty: s.qty, salePrice: s.salePrice }];
                      const matchedItem = items.find(si => si.stockId === historyItem.id);
                      if (matchedItem) {
                        allTx.push({
                          date: s.date,
                          type: 'Sale',
                          qty: matchedItem.qty,
                          details: `Sale: Rs ${matchedItem.salePrice.toLocaleString('en-IN')}` + (s.customerName ? ` - ${s.customerName}` : '') + (s.invoiceNo ? ` (Inv: #${s.invoiceNo})` : '')
                        });
                      }
                    });
                    
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
                        <td className="py-1 px-2 border-r border-gray-200 whitespace-nowrap text-gray-600">{formatDateClean(tx.date, true)}</td>
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
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print-hidden ${showPrintHistoryPreview ? 'hidden' : ''}`} onClick={() => setShowGlobalHistory(false)}>
          <div className={`bg-white rounded-xl shadow-2xl w-full ${purchaseHistoryItem ? 'max-w-6xl' : 'max-w-5xl'} p-6 flex flex-col max-h-[90vh]`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {purchaseHistoryItem ? `Purchase History: ${purchaseHistoryItem.model}` : (globalHistoryType === 'purchases' ? "Global Purchase History" : "Global Sales History")}
              </h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowPrintHistoryPreview(true)} 
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold font-sans shadow-sm transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button onClick={() => setShowGlobalHistory(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-4 gap-4 bg-gray-50 border border-gray-200 rounded-xl p-3 shadow-sm">
              <div className="flex gap-2">
                {['All', 'Today', '7 Days', '30 Days'].map(f => (
                  <button key={f} onClick={() => setGlobalHistoryFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${globalHistoryFilter === f ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="flex-1 max-w-md relative">
                <input 
                  type="text" 
                  value={globalHistorySearch} 
                  onChange={e => setGlobalHistorySearch(e.target.value)} 
                  placeholder="Search by item model or details..." 
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-750 placeholder-gray-400 outline-none focus:border-indigo-500 shadow-sm transition"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 font-sans uppercase">Sort By:</span>
                <select 
                  value={globalHistorySort} 
                  onChange={e => setGlobalHistorySort(e.target.value)} 
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-650 outline-none cursor-pointer shadow-sm hover:border-gray-400 transition"
                >
                  <option value="latest">Latest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="qtyDesc">Quantity: High to Low</option>
                  <option value="qtyAsc">Quantity: Low to High</option>
                  <option value="amountDesc">Amount: High to Low</option>
                  <option value="amountAsc">Amount: Low to High</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-auto border rounded bg-gray-50 p-0">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white sticky top-0 shadow-sm uppercase tracking-wider">
                  <tr>
                    <th className="py-2 px-2 font-semibold border-r border-slate-700 text-center w-8">#</th>
                    <th className="py-2 px-2 font-semibold border-r border-slate-700">Date & Time</th>
                    {!purchaseHistoryItem && <th className="py-2 px-2 font-semibold border-r border-slate-700">Item</th>}
                    <th className="py-2 px-2 font-semibold border-r border-slate-700 text-center">
                      {purchaseHistoryItem || globalHistoryType === 'purchases' ? 'Qty Added' : 'Qty Sold'}
                    </th>
                    {purchaseHistoryItem && <th className="py-2 px-2 font-semibold border-r border-slate-700 text-right">Prev Price</th>}
                    {purchaseHistoryItem && <th className="py-2 px-2 font-semibold border-r border-slate-700 text-right">New Price</th>}
                    <th className="py-2 px-2 font-semibold border-r border-slate-700 text-right">Total Amount</th>
                    <th className={`py-2 px-2 font-semibold ${purchaseHistoryItem ? 'border-r border-slate-700' : ''}`}>Details</th>
                    {purchaseHistoryItem && <th className="py-2 px-2 font-semibold text-center w-16">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(() => {
                    const allTx = filteredGlobalTransactions;

                    if (allTx.length === 0) {
                      return <tr><td colSpan={purchaseHistoryItem ? 8 : 6} className="py-4 text-center text-gray-500">No transactions found.</td></tr>;
                    }
                    
                    return allTx.map((tx, i) => {
                      const stockItem = data.stock.find(s => s.id === tx.stockId);
                      const itemName = stockItem ? stockItem.model : 'Unknown Item';

                      const totalAmt = tx.calculatedTotal;

                      const prevNtd = tx.prevNtd !== undefined ? tx.prevNtd : (chronologicalPrices[tx.id]?.prevNtd ?? 0);
                      const newNtd = tx.newNtd !== undefined ? tx.newNtd : (chronologicalPrices[tx.id]?.newNtd ?? 0);

                      return (
                        <tr key={i} className="hover:bg-gray-100 transition-colors">
                          <td className="py-1 px-2 border-r border-gray-200 text-center font-semibold text-gray-500">{i + 1}</td>
                          <td className="py-1 px-2 border-r border-gray-200 whitespace-nowrap text-gray-600">{formatDateClean(tx.date, true)}</td>
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

          <div className="bg-slate-800 w-full max-w-4xl flex-1 overflow-auto p-6 rounded-b-xl flex flex-col items-center gap-6 print:static print:block print:w-full print:max-w-none print:overflow-visible print:p-0 print:bg-white print:border-none print:shadow-none" onClick={e => e.stopPropagation()}>
            {(() => {
              const allRows = [];
              let printTotalValue = 0;
              data.categories
                .filter(category => selectedCategoryFilter === 'All' || category === selectedCategoryFilter)
                .forEach(category => {
                const catItems = stockByCategory[category] || [];
                if (catItems.length === 0) return;

                const catTotals = catItems.reduce((totals, item) => {
                  const { x_b, in: inQty, tb, sale: saleQty, blnc, ntd } = itemsStockForSelectedDate[item.id] || { x_b: 0, in: 0, tb: 0, sale: 0, blnc: 0, ntd: item.ntd || 0 };
                  totals.x_b += x_b;
                  totals.in += inQty;
                  totals.tb += tb;
                  totals.sale += saleQty;
                  totals.blnc += blnc;
                  totals.value += blnc * ntd;
                  return totals;
                }, { x_b: 0, in: 0, tb: 0, sale: 0, blnc: 0, value: 0 });

                printTotalValue += catTotals.value;

                allRows.push({
                  type: 'header',
                  categoryName: category,
                  count: catItems.length
                });

                catItems.forEach((item, index) => {
                  const { x_b, in: inQty, tb, sale: saleQty, blnc, ntd } = itemsStockForSelectedDate[item.id] || { x_b: 0, in: 0, tb: 0, sale: 0, blnc: 0, ntd: item.ntd || 0 };
                  allRows.push({
                    type: 'item',
                    id: item.id,
                    index: index + 1,
                    model: item.model,
                    x_b,
                    inQty,
                    tb,
                    saleQty,
                    blnc,
                    ntd
                  });
                });

                allRows.push({
                  type: 'total',
                  categoryName: category,
                  catTotals
                });
              });

              // Calculate grand totals across all categories
              const grandTotals = allRows.filter(r => r.type === 'total').reduce((acc, r) => {
                acc.x_b += r.catTotals.x_b;
                acc.in += r.catTotals.in;
                acc.tb += r.catTotals.tb;
                acc.sale += r.catTotals.sale;
                acc.blnc += r.catTotals.blnc;
                return acc;
              }, { x_b: 0, in: 0, tb: 0, sale: 0, blnc: 0, value: printTotalValue });

              allRows.push({
                type: 'grand_total',
                totals: grandTotals
              });

              // Monthly Summary Calculations
              const activeMonth = filterType === 'Monthly' 
                ? selectedMonth 
                : (filterType === 'Daily' && selectedDate ? selectedDate.substring(0, 7) : todayYMD.substring(0, 7));
              
              const [year, month] = activeMonth.split('-').map(Number);
              const prevMonthEnd = new Date(year, month - 1, 0);
              const prevMonthEndDateStr = `${prevMonthEnd.getFullYear()}-${String(prevMonthEnd.getMonth() + 1).padStart(2, '0')}-${String(prevMonthEnd.getDate()).padStart(2, '0')}`;

              let opnBln = 0;
              (data.stock || []).forEach(item => {
                const stockInfo = getItemStockForDate(item, prevMonthEndDateStr);
                opnBln += stockInfo.blnc * stockInfo.ntd;
              });

              let addedStk = 0;
              (data.history || []).forEach(h => {
                if (h.type === 'Stock In' && h.date) {
                  const dateObj = new Date(h.date);
                  if (!isNaN(dateObj.getTime())) {
                    const y = dateObj.getFullYear();
                    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const ym = `${y}-${m}`;
                    if (ym === activeMonth) {
                      let addedNtd = 0;
                      const match = h.details ? h.details.match(/Cost: Rs ([\d,.]+) \(NTD\)/) : null;
                      if (match) {
                        addedNtd = parseFloat(match[1].replace(/,/g, ''));
                      } else {
                        addedNtd = h.newNtd || 0;
                      }
                      addedStk += h.qty * addedNtd;
                    }
                  }
                }
              });

              let totalSale = 0;
              (data.sales || []).forEach(s => {
                const dateObj = new Date(s.date);
                if (!isNaN(dateObj.getTime())) {
                  const y = dateObj.getFullYear();
                  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                  const ym = `${y}-${m}`;
                  if (ym === activeMonth) {
                    const items = s.items || [{ stockId: s.stockId, qty: s.qty }];
                    items.forEach(item => {
                      const stockItem = data.stock.find(st => st.id === item.stockId);
                      if (stockItem) {
                        const saleDateYMD = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
                        const costPrice = Number(item.ntd !== undefined ? item.ntd : getItemNtdForDate(stockItem, saleDateYMD));
                        totalSale += Number(item.qty || 0) * costPrice;
                      }
                    });
                  }
                }
              });

              const clsBln = opnBln + addedStk - totalSale;

              const summaryData = { activeMonth, opnBln, addedStk, totalSale, clsBln };

              // Pagination: Fill left column first, then right column
              const maxRowsPerColumn = 50;
              const maxRowsPerPage = maxRowsPerColumn * 2;
              const pages = [];
              let tempRows = [...allRows];

              while (tempRows.length > 0) {
                pages.push({
                  left: tempRows.slice(0, maxRowsPerColumn),
                  right: tempRows.slice(maxRowsPerColumn, maxRowsPerPage)
                });
                tempRows = tempRows.slice(maxRowsPerPage);
              }

              const renderPrintRow = (row, i) => {
                if (row.type === 'header') {
                  return (
                    <tr key={`h-${row.categoryName}-${i}`} className="bg-slate-400 font-bold border-b border-black" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                      <td colSpan={8} className="py-1 px-0.5 text-black uppercase text-[10px] truncate bg-slate-400 font-bold border-b border-black" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                        {row.categoryName} ({row.count} items)
                      </td>
                    </tr>
                  );
                } else if (row.type === 'item') {
                  return (
                    <tr key={`item-${row.id}-${i}`} className="border-b border-black leading-none font-medium" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                      <td className="py-1 px-0.5 border-r border-black font-semibold text-[9px]" title={row.model}>
                        <div className="truncate w-[96px] overflow-hidden">{row.model}</div>
                      </td>
                      <td className="py-1 px-0.5 border-r border-black text-center text-[9px]">{row.x_b}</td>
                      <td className={`py-1 px-0.5 border-r border-black text-center text-[9px] ${row.inQty > 0 ? 'bg-slate-400 text-black font-bold' : ''}`} style={row.inQty > 0 ? { WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } : {}}>{row.inQty}</td>
                      <td className="py-1 px-0.5 border-r border-black text-center font-semibold text-[9px]">{row.tb}</td>
                      <td className={`py-1 px-0.5 border-r border-black text-center text-[9px] ${row.saleQty > 0 ? 'bg-slate-400 text-black font-bold' : ''}`} style={row.saleQty > 0 ? { WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } : {}}>{row.saleQty}</td>
                      <td className={`py-1 px-0.5 border-r border-black text-center font-bold text-[9px] ${row.blnc > 0 ? 'text-green-700' : 'text-red-650'}`}>{row.blnc}</td>
                      <td className="py-1 px-0.5 border-r border-black text-right text-black text-[9px]">{row.ntd.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                      <td className="py-1 px-0.5 text-right text-black text-[9px]">{(row.blnc * row.ntd).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                    </tr>
                  );
                } else if (row.type === 'total') {
                  return (
                    <tr key={`t-${row.categoryName}-${i}`} className="bg-white font-bold border-b border-black font-sans leading-none">
                      <td className="py-1 px-0.5 border-r border-black uppercase text-slate-800 font-bold text-[9px]">Total</td>
                      <td className="py-1 px-0.5 border-r border-black text-center font-bold text-slate-800 text-[9px]">{row.catTotals.x_b}</td>
                      <td className={`py-1 px-0.5 border-r border-black text-center font-bold text-[9px] ${row.catTotals.in > 0 ? 'bg-slate-400 text-black' : 'text-slate-800'}`} style={row.catTotals.in > 0 ? { WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } : {}}>{row.catTotals.in}</td>
                      <td className="py-1 px-0.5 border-r border-black text-center font-bold text-slate-800 text-[9px]">{row.catTotals.tb}</td>
                      <td className={`py-1 px-0.5 border-r border-black text-center font-bold text-[9px] ${row.catTotals.sale > 0 ? 'bg-slate-400 text-black' : 'text-slate-800'}`} style={row.catTotals.sale > 0 ? { WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } : {}}>{row.catTotals.sale}</td>
                      <td className={`py-1 px-0.5 border-r border-black text-center font-bold ${row.catTotals.blnc > 0 ? 'text-green-700' : 'text-red-650'} text-[9px]`}>{row.catTotals.blnc}</td>
                      <td className="py-1 px-0.5 border-r border-black text-right font-bold text-slate-800 text-[9px]">-</td>
                      <td className="py-1 px-0.5 text-right font-bold text-black text-[9px]">{row.catTotals.value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                    </tr>
                  );
                } else if (row.type === 'grand_total') {
                  return (
                    <tr key={`gt-${i}`} className="bg-slate-900 text-white font-bold border-b border-black font-sans leading-none" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                      <td className="py-1.5 px-0.5 border-r border-slate-700 uppercase text-white font-bold text-[9px]">Grand Total</td>
                      <td className="py-1.5 px-0.5 border-r border-slate-700 text-center font-bold text-white text-[9px]">{row.totals.x_b}</td>
                      <td className={`py-1.5 px-0.5 border-r border-slate-700 text-center font-bold text-[9px] ${row.totals.in > 0 ? 'bg-slate-700 text-white' : 'text-white'}`}>{row.totals.in}</td>
                      <td className="py-1.5 px-0.5 border-r border-slate-700 text-center font-bold text-white text-[9px]">{row.totals.tb}</td>
                      <td className={`py-1.5 px-0.5 border-r border-slate-700 text-center font-bold text-[9px] ${row.totals.sale > 0 ? 'bg-slate-700 text-white' : 'text-white'}`}>{row.totals.sale}</td>
                      <td className={`py-1.5 px-0.5 border-r border-slate-700 text-center font-bold ${row.totals.blnc > 0 ? 'text-green-400' : 'text-red-400'} text-[9px]`}>{row.totals.blnc}</td>
                      <td className="py-1.5 px-0.5 border-r border-slate-700 text-right font-bold text-white text-[9px]">-</td>
                      <td className="py-1.5 px-0.5 text-right font-bold text-green-400 text-[9px]">{row.totals.value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                    </tr>
                  );
                }
                return null;
              };

              const renderTable = (rows) => {
                if (!rows || rows.length === 0) {
                  return (
                    <table className="w-full text-left text-xs border-collapse border border-black mb-3 print:mb-1" style={{ tableLayout: 'fixed', visibility: 'hidden' }}>
                      <thead>
                        <tr className="bg-white text-black border-b-2 border-black">
                           <th className="py-1.5 px-0.5 border-r border-black text-[6.5px] w-[111px] font-bold uppercase tracking-wider">Model</th>
                           <th className="py-1.5 px-0.5 border-r border-black text-center w-[18px] text-[5.5px] font-bold uppercase tracking-wider">XB</th>
                           <th className="py-1.5 px-0.5 border-r border-black text-center w-[18px] text-[5.5px] font-bold tracking-wider">In</th>
                           <th className="py-1.5 px-0.5 border-r border-black text-center w-[18px] text-[5.5px] font-bold uppercase tracking-wider">TB</th>
                           <th className="py-1.5 px-0.5 border-r border-black text-center w-[18px] text-[5.5px] font-bold tracking-wider">Sale</th>
                           <th className="py-1.5 px-0.5 border-r border-black text-center w-[18px] text-[5.5px] font-bold tracking-wider">Blnc</th>
                           <th className="py-1.5 px-0.5 border-r border-black text-right w-[48px] text-[6.5px] font-bold uppercase tracking-wider">NTD</th>
                           <th className="py-1.5 px-0.5 text-right w-[66px] text-[6.5px] font-bold uppercase tracking-wider">Total</th>
                        </tr>
                      </thead>
                    </table>
                  );
                }
                return (
                    <table className="w-full text-left text-xs border-collapse border border-black mb-3 print:mb-1" style={{ tableLayout: 'fixed' }}>
                      <thead>
                        <tr className="bg-white text-black border-b-2 border-black">
                           <th className="py-1.5 px-0.5 border-r border-black text-[6.5px] w-[111px] font-bold uppercase tracking-wider">Model</th>
                           <th className="py-1.5 px-0.5 border-r border-black text-center w-[18px] text-[5.5px] font-bold uppercase tracking-wider">XB</th>
                           <th className="py-1.5 px-0.5 border-r border-black text-center w-[18px] text-[5.5px] font-bold tracking-wider">In</th>
                           <th className="py-1.5 px-0.5 border-r border-black text-center w-[18px] text-[5.5px] font-bold uppercase tracking-wider">TB</th>
                           <th className="py-1.5 px-0.5 border-r border-black text-center w-[18px] text-[5.5px] font-bold tracking-wider">Sale</th>
                           <th className="py-1.5 px-0.5 border-r border-black text-center w-[18px] text-[5.5px] font-bold tracking-wider">Blnc</th>
                           <th className="py-1.5 px-0.5 border-r border-black text-right w-[48px] text-[6.5px] font-bold uppercase tracking-wider">NTD</th>
                           <th className="py-1.5 px-0.5 text-right w-[66px] text-[6.5px] font-bold uppercase tracking-wider">Total</th>
                        </tr>
                      </thead>
                    <tbody>
                      {rows.map((row, idx) => renderPrintRow(row, idx))}
                    </tbody>
                  </table>
                );
              };

              return (
                <div className="w-full flex flex-col items-center gap-6 print:block print:w-full print:bg-white print:p-0">
                  <style>{`
                    @media print {
                      @page {
                        margin: 0;
                      }
                    }
                  `}</style>
                  {pages.map((page, pageIdx) => (
                    <div 
                      key={pageIdx} 
                      className="bg-white text-black p-8 shadow-2xl border w-full max-w-[210mm] min-h-[297mm] font-sans printable-area print:border-none print:shadow-none print:p-0 print:my-0"
                      style={{ 
                        pageBreakAfter: pageIdx < pages.length - 1 ? 'always' : 'auto',
                        breakAfter: pageIdx < pages.length - 1 ? 'page' : 'auto',
                        marginBottom: pageIdx < pages.length - 1 ? '24px' : '0'
                      }}
                    >
                      {/* Header */}
                      <div className="border-b-2 border-slate-900 pb-4 mb-6 print:pb-1 print:mb-2 flex justify-between items-start">
                        <div>
                          <h1 className="text-2xl font-bold text-slate-900 tracking-wide">DUBAI ELECTRONICS</h1>
                          <p className="text-xs font-bold text-gray-500 tracking-wide uppercase mt-0.5">{activeBranch} Branch</p>
                          <p className="text-sm font-semibold text-gray-600 mt-1">Stock Inventory Report</p>
                          {data.settings?.branchAddress && <p className="text-[10px] text-gray-500 mt-0.5">{data.settings.branchAddress}</p>}
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <p>
                            {filterType === 'Monthly' 
                              ? `Report Month: ${formatMonthName(summaryData.activeMonth)}` 
                              : (filterType === 'Annual' 
                                  ? `Report Year: ${selectedYear}` 
                                  : `Report Date: ${formatReportDate(selectedDate)}`
                                )
                            }
                          </p>
                          <p>Total Stock Items: {filteredStock.length}</p>
                          {pages.length > 1 && <p className="font-semibold text-slate-700">Page {pageIdx + 1} of {pages.length}</p>}
                        </div>
                      </div>

                      {/* Columns Grid */}
                      <div className="grid grid-cols-2 gap-4 print:grid print:grid-cols-2 print:gap-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '14px', alignItems: 'start' }}>
                        <div>
                          {renderTable(page.left)}
                        </div>
                        <div>
                          {renderTable(page.right)}
                        </div>
                      </div>

                      {pageIdx === pages.length - 1 && (
                        <div className="mt-8 border-t-2 border-slate-900 pt-4 print:mt-4 break-inside-avoid" style={{ breakInside: 'avoid' }}>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">Month Summary ({formatMonthName(summaryData.activeMonth)})</h3>
                          <table className="w-full text-left text-xs border-collapse border border-black max-w-sm" style={{ tableLayout: 'fixed' }}>
                            <thead>
                              <tr className="bg-slate-200 font-bold border-b border-black" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                <th className="py-1.5 px-2 border-r border-black font-bold text-[8px] uppercase bg-slate-200" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>Description</th>
                                <th className="py-1.5 px-2 text-right font-bold text-[8px] uppercase bg-slate-200" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-black">
                                <td className="py-1 px-2 border-r border-black text-[9px] font-semibold text-slate-800">Opening Balance</td>
                                <td className="py-1 px-2 text-right text-[9px] font-bold text-black">Rs {summaryData.opnBln.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                              </tr>
                              <tr className="border-b border-black">
                                <td className="py-1 px-2 border-r border-black text-[9px] font-semibold text-slate-800">Added Stock</td>
                                <td className="py-1 px-2 text-right text-[9px] font-bold text-black">Rs {summaryData.addedStk.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                              </tr>
                              <tr className="border-b border-black">
                                <td className="py-1 px-2 border-r border-black text-[9px] font-semibold text-slate-800">Total Sale (excluding profits)</td>
                                <td className="py-1 px-2 text-right text-[9px] font-bold text-black">Rs {summaryData.totalSale.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                              </tr>
                              <tr className="font-bold bg-slate-200" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                <td className="py-1 px-2 border-r border-black text-[9px] text-slate-900 uppercase bg-slate-200" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>Closing Balance</td>
                                <td className="py-1 px-2 text-right text-[9px] text-black bg-slate-200" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>Rs {summaryData.clsBln.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}
      {/* History Print Preview Modal */}
      {showPrintHistoryPreview && (
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col items-center justify-center p-4 print:static print:block print:p-0 print:bg-white" onClick={() => setShowPrintHistoryPreview(false)}>
          <div className="bg-slate-900 text-white rounded-t-xl w-full max-w-4xl px-6 py-3 flex justify-between items-center shadow-lg print-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <Printer className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold">
                Print Preview - {purchaseHistoryItem ? `Purchase History: ${purchaseHistoryItem.model}` : (globalHistoryType === 'purchases' ? "Global Purchase History" : "Global Sales History")}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => window.print()} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg flex items-center gap-2 font-medium text-sm transition"
              >
                <Printer className="w-4 h-4" /> Print Now
              </button>
              <button 
                onClick={() => setShowPrintHistoryPreview(false)} 
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
                    <p className="text-sm font-semibold text-gray-600 mt-1">
                      {purchaseHistoryItem ? `Purchase History Report: ${purchaseHistoryItem.model}` : (globalHistoryType === 'purchases' ? "Global Purchase History Report" : "Global Sales History Report")}
                    </p>
                    {data.settings?.branchAddress && <p className="text-[10px] text-gray-500 mt-0.5">{data.settings.branchAddress}</p>}
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>Time Filter: {globalHistoryFilter}</p>
                    {globalHistorySearch.trim() && <p>Search Query: "{globalHistorySearch}"</p>}
                    <p>Total Records: {filteredGlobalTransactions.length}</p>
                  </div>
                </div>

                <table className="w-full text-left text-xs border-collapse border border-gray-300 mb-6 font-sans">
                  <thead>
                    <tr className="bg-white text-black border-b-2 border-slate-800">
                      <th className="py-2.5 px-2 border-r border-slate-300 text-center w-8 font-bold uppercase tracking-wider">#</th>
                      <th className="py-2.5 px-2 border-r border-slate-300 font-bold uppercase tracking-wider">Date & Time</th>
                      {!purchaseHistoryItem && <th className="py-2.5 px-2 border-r border-slate-300 font-bold uppercase tracking-wider">Item</th>}
                      <th className="py-2.5 px-2 border-r border-slate-300 text-center font-bold uppercase tracking-wider">
                        {purchaseHistoryItem || globalHistoryType === 'purchases' ? 'Qty Added' : 'Qty Sold'}
                      </th>
                      {purchaseHistoryItem && <th className="py-2.5 px-2 border-r border-slate-300 text-right font-bold uppercase tracking-wider">Prev Price</th>}
                      {purchaseHistoryItem && <th className="py-2.5 px-2 border-r border-slate-300 text-right font-bold uppercase tracking-wider">New Price</th>}
                      <th className="py-2.5 px-2 border-r border-slate-300 text-right font-bold uppercase tracking-wider">Total Amount</th>
                      <th className="py-2.5 px-2 font-bold uppercase tracking-wider">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300 border-b border-gray-300">
                    {filteredGlobalTransactions.map((tx, i) => {
                      const stockItem = data.stock.find(s => s.id === tx.stockId);
                      const itemName = stockItem ? stockItem.model : 'Unknown Item';
                      const totalAmt = tx.calculatedTotal;
                      const prevNtd = tx.prevNtd !== undefined ? tx.prevNtd : (chronologicalPrices[tx.id]?.prevNtd ?? 0);
                      const newNtd = tx.newNtd !== undefined ? tx.newNtd : (chronologicalPrices[tx.id]?.newNtd ?? 0);

                      return (
                        <tr key={i} className="hover:bg-gray-100 transition-colors">
                          <td className="py-1 px-2 border-r border-gray-300 text-center font-semibold text-gray-500">{i + 1}</td>
                          <td className="py-1 px-2 border-r border-gray-300 whitespace-nowrap text-gray-600">{formatDateClean(tx.date, true)}</td>
                          {!purchaseHistoryItem && <td className="py-1 px-2 border-r border-gray-300 font-bold text-gray-800">{itemName}</td>}
                          <td className="py-1 px-2 border-r border-gray-300 text-center font-bold text-gray-700">{tx.qty}</td>
                          {purchaseHistoryItem && (
                            <td className="py-1 px-2 border-r border-gray-300 text-right font-semibold text-gray-650">
                              {prevNtd > 0 ? `Rs ${prevNtd.toLocaleString('en-IN')}` : '-'}
                            </td>
                          )}
                          {purchaseHistoryItem && (
                            <td className="py-1 px-2 border-r border-gray-300 text-right font-bold text-slate-800">
                              Rs {newNtd.toLocaleString('en-IN')}
                            </td>
                          )}
                          <td className="py-1 px-2 border-r border-gray-300 text-right font-bold text-gray-800">Rs {totalAmt.toLocaleString('en-IN')}</td>
                          <td className="py-1 px-2 text-gray-600 text-[11px] leading-snug">{tx.details}</td>
                        </tr>
                      );
                    })}
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
