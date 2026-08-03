import React, { useState, useRef, useEffect } from 'react';
import { Save, Plus, Trash2, Download, Upload, Shield, Camera, Lock, Settings, X, List, ChevronUp, ChevronDown, GripVertical, Edit, Share2, RefreshCw } from 'lucide-react';
import { useDialog } from '../components/DialogProvider.jsx';
export default function SettingsTab({ data, saveData, activeBranch, fullDbData, saveFullDbData }) {
  const { alert, confirm } = useDialog();
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [localCategories, setLocalCategories] = useState([...(data.categories || [])]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [branchAddress, setBranchAddress] = useState(data.settings?.branchAddress || '');
  const [branchPhone, setBranchPhone] = useState(data.settings?.branchPhone || '');
  const [lowStockLimit, setLowStockLimit] = useState(data.settings?.lowStockLimit !== undefined ? data.settings.lowStockLimit : 3);
  const fileInputRef = useRef(null);
  const dataInputRef = useRef(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [clearDataPasswordInput, setClearDataPasswordInput] = useState('');
  const [clearDataError, setClearDataError] = useState('');
  
  // Category Rename States
  const [editingCatIndex, setEditingCatIndex] = useState(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [categoryRenames, setCategoryRenames] = useState({});

  const [showShareStockModal, setShowShareStockModal] = useState(false);
  const [shareStep, setShareStep] = useState(1);
  const [selectedShareCategories, setSelectedShareCategories] = useState([]);
  const [selectedShareBranches, setSelectedShareBranches] = useState([]);

  // Move Stock States
  const [showMoveStockModal, setShowMoveStockModal] = useState(false);
  const [selectedMoveBranch, setSelectedMoveBranch] = useState('');
  const [moveItemsList, setMoveItemsList] = useState([]);
  const [moveSearchQuery, setMoveSearchQuery] = useState('');
  const [selectedMoveItem, setSelectedMoveItem] = useState(null);
  const [moveItemQty, setMoveItemQty] = useState('');
  const [isMoveDropdownOpen, setIsMoveDropdownOpen] = useState(false);
  const moveDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (moveDropdownRef.current && !moveDropdownRef.current.contains(event.target)) {
        setIsMoveDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setLocalCategories([...(data.categories || [])]);
    setBranchAddress(data.settings?.branchAddress || '');
    setBranchPhone(data.settings?.branchPhone || '');
    setLowStockLimit(data.settings?.lowStockLimit !== undefined ? data.settings.lowStockLimit : 3);
  }, [data]);

  const handleAddCategory = () => {
    if (newCategory.trim() && !localCategories.includes(newCategory.trim())) {
      const newCats = [...localCategories, newCategory.trim()];
      setLocalCategories(newCats);
    }
    setNewCategory('');
  };

  const handleRemoveCategory = async (cat) => {
    const count = (data.stock || []).filter(item => item.category === cat).length;
    if (count > 0) {
      await alert(`Cannot delete category "${cat}" because it contains ${count} items. Please reassign or delete the items first.`);
      return;
    }
    if (await confirm(`Are you sure you want to delete the category "${cat}"?`)) {
      const newCats = localCategories.filter(c => c !== cat);
      setLocalCategories(newCats);
    }
  };

  const moveCategoryUp = (index) => {
    if (index === 0) return;
    const newCats = [...localCategories];
    const temp = newCats[index];
    newCats[index] = newCats[index - 1];
    newCats[index - 1] = temp;
    setLocalCategories(newCats);
  };

  const moveCategoryDown = (index) => {
    if (index === localCategories.length - 1) return;
    const newCats = [...localCategories];
    const temp = newCats[index];
    newCats[index] = newCats[index + 1];
    newCats[index + 1] = temp;
    setLocalCategories(newCats);
  };

  const handleSaveCategoryName = (index) => {
    const oldName = localCategories[index];
    const newName = editingCatName.trim();
    if (!newName) return;
    if (newName === oldName) {
      setEditingCatIndex(null);
      return;
    }
    if (localCategories.includes(newName)) {
      alert(`Category "${newName}" already exists!`);
      return;
    }

    setCategoryRenames(prev => {
      const originalName = Object.keys(prev).find(key => prev[key] === oldName) || oldName;
      return {
        ...prev,
        [originalName]: newName
      };
    });

    const newCats = [...localCategories];
    newCats[index] = newName;
    setLocalCategories(newCats);
    setEditingCatIndex(null);
  };

  const handleSavePositions = async () => {
    const updatedStock = (data.stock || []).map(item => {
      if (item.category && categoryRenames[item.category]) {
        return { ...item, category: categoryRenames[item.category] };
      }
      return item;
    });

    saveData({ 
      ...data, 
      categories: localCategories,
      stock: updatedStock
    });
    setCategoryRenames({});
    await alert('Categories saved successfully!');
  };

  const closeCategoryModal = () => {
    setLocalCategories([...(data.categories || [])]);
    setCategoryRenames({});
    setEditingCatIndex(null);
    setShowCategoryModal(false);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const reorderedCats = [...localCategories];
    const draggedItem = reorderedCats[draggedIndex];
    reorderedCats.splice(draggedIndex, 1);
    reorderedCats.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setLocalCategories(reorderedCats);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleIconUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        saveData({ ...data, settings: { ...data.settings, appIcon: reader.result } });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSettings = async () => {
    let finalPassword = data.settings?.password || '';

    if (data.settings?.password) {
      if (currentPasswordInput || newPasswordInput || confirmPasswordInput) {
        if (currentPasswordInput !== data.settings.password) {
          await alert('Incorrect Current Password!');
          return;
        }
        if (newPasswordInput !== confirmPasswordInput) {
          await alert('New Password and Confirm New Password do not match!');
          return;
        }
        finalPassword = newPasswordInput;
      }
    } else {
      if (newPasswordInput || confirmPasswordInput) {
        if (newPasswordInput !== confirmPasswordInput) {
          await alert('Passwords do not match!');
          return;
        }
        finalPassword = newPasswordInput;
      }
    }

    saveData({ 
      ...data, 
      categories: localCategories,
      settings: { 
        ...data.settings, 
        password: finalPassword,
        branchAddress: branchAddress,
        branchPhone: branchPhone,
        lowStockLimit: Number(lowStockLimit || 0)
      }
    });

    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');

    await alert('Settings Saved Successfully!');
  };

  const handleClearDataClick = () => {
    if (data.settings?.password) {
      setClearDataPasswordInput('');
      setClearDataError('');
      setShowClearDataModal(true);
    } else {
      triggerClearDataFinal();
    }
  };

  const triggerClearDataFinal = async () => {
    if (await confirm('Are you sure you want to delete all app data completely? This will clear all stock, sales, expenses, employees, and settings for ALL branches. This action cannot be undone!')) {
      const DEFAULT_BRANCH_DATA = {
        settings: { appIcon: null, password: "", branchAddress: "", branchPhone: "" },
        categories: ["Refrigerators", "Deep Freezers", "Washing Machines", "Air Conditioners", "Microwave Ovens"],
        stock: [], sales: [], expenses: [], employees: []
      };
      
      const clearedDb = {
        activeBranch: "Wah Cantt",
        branches: {
          "Wah Cantt": {
            ...DEFAULT_BRANCH_DATA,
            settings: {
              ...DEFAULT_BRANCH_DATA.settings,
              branchAddress: "Al-Noor Shopping Mall, Bahatar Morr Main G.T Road, Wah Cantt",
              branchPhone: "051-4916830"
            }
          },
          "Pindi Gheb": JSON.parse(JSON.stringify(DEFAULT_BRANCH_DATA)),
          "Fateh Jung": JSON.parse(JSON.stringify(DEFAULT_BRANCH_DATA))
        }
      };
      
      await saveFullDbData(clearedDb);
      setLocalCategories(clearedDb.branches[activeBranch].categories);
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setShowClearDataModal(false);
      await alert('All app data has been successfully cleared for all branches.');
    }
  };

  const handleConfirmPasswordForClear = async () => {
    if (clearDataPasswordInput === data.settings?.password) {
      setShowClearDataModal(false);
      setTimeout(() => {
        triggerClearDataFinal();
      }, 100);
    } else {
      setClearDataError('Incorrect Password!');
    }
  };

  const backupData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullDbData));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `DubaiElectronics_AllBranches_Backup_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
  };

  const restoreData = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (await confirm('This will OVERWRITE all current data for ALL branches. Are you absolutely sure?')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const imported = JSON.parse(e.target.result);
            
            // Check if it's the new multi-branch format
            if (imported.branches && (imported.branches["Wah Cantt"] || imported.branches["Pindi Gheb"] || imported.branches["Fateh Jung"])) {
              await saveFullDbData(imported);
              await alert('All branch data restored successfully!');
              setLocalCategories(imported.branches[activeBranch]?.categories || []);
              setCurrentPasswordInput('');
              setNewPasswordInput('');
              setConfirmPasswordInput('');
              return;
            }
            
            // If it's the old single-branch format, we migrate it to Wah Cantt and preserve the rest
            if (imported.stock && imported.sales) {
              const DEFAULT_BRANCH_DATA = {
                settings: { appIcon: null, password: "", branchAddress: "", branchPhone: "" },
                categories: ["Refrigerators", "Deep Freezers", "Washing Machines", "Air Conditioners", "Microwave Ovens"],
                stock: [], sales: [], expenses: [], employees: []
              };
              
              const migratedDb = {
                activeBranch: activeBranch, // keep current active branch selection
                branches: {
                  "Wah Cantt": imported,
                  "Pindi Gheb": JSON.parse(JSON.stringify(DEFAULT_BRANCH_DATA)),
                  "Fateh Jung": JSON.parse(JSON.stringify(DEFAULT_BRANCH_DATA))
                }
              };
              
              // Ensure migrated Wah Cantt has branch details
              if (migratedDb.branches["Wah Cantt"].settings) {
                if (!migratedDb.branches["Wah Cantt"].settings.branchAddress) {
                  migratedDb.branches["Wah Cantt"].settings.branchAddress = "Al-Noor Shopping Mall, Bahatar Morr Main G.T Road, Wah Cantt";
                }
                if (!migratedDb.branches["Wah Cantt"].settings.branchPhone) {
                  migratedDb.branches["Wah Cantt"].settings.branchPhone = "051-4916830";
                }
              }
              
              await saveFullDbData(migratedDb);
              await alert('Old single-branch backup file imported and migrated successfully into the Wah Cantt branch!');
              setLocalCategories(migratedDb.branches[activeBranch]?.categories || []);
              setCurrentPasswordInput('');
              setNewPasswordInput('');
              setConfirmPasswordInput('');
              return;
            }
            
            await alert('Invalid backup file structure.');
          } catch (err) {
            await alert('Failed to parse backup file.');
          }
        };
        reader.readAsText(file);
      }
    }
  };

  const handleExecuteShare = async () => {
    if (selectedShareCategories.length === 0 || selectedShareBranches.length === 0) return;
    
    const isConfirmed = await confirm(
      `Are you sure you want to share stock items of selected categories (${selectedShareCategories.join(', ')}) to branches (${selectedShareBranches.join(', ')})? This will replace items in these categories there, starting their stock counts at 0.`
    );
    if (!isConfirmed) return;

    // Create a copy of the database data to modify
    const updatedDb = JSON.parse(JSON.stringify(fullDbData));

    // Get current branch source data
    const sourceBranchData = updatedDb.branches[activeBranch];
    if (!sourceBranchData) return;

    // Get all items in selected categories in source branch
    const sourceItems = sourceBranchData.stock.filter(item => 
      selectedShareCategories.includes(item.category)
    );

    // For each target branch, perform the replacement
    selectedShareBranches.forEach(branchName => {
      const targetBranch = updatedDb.branches[branchName];
      if (!targetBranch) return;

      // 1. Remove all items belonging to selected categories from target stock
      targetBranch.stock = (targetBranch.stock || []).filter(item => 
        !selectedShareCategories.includes(item.category)
      );

      // 2. Ensure categories exist in target branch categories array
      if (!targetBranch.categories) targetBranch.categories = [];
      selectedShareCategories.forEach(cat => {
        if (!targetBranch.categories.includes(cat)) {
          targetBranch.categories.push(cat);
        }
      });

      // 3. For each source item, clone it with zero quantities and insert into target stock
      sourceItems.forEach(item => {
        // Generate clean ID for target branch copy
        const newId = Date.now().toString() + '_' + Math.random().toString(36).substring(2, 9);
        const copiedItem = {
          id: newId,
          model: item.model,
          category: item.category,
          x_b: 0,
          in: 0,
          sale: 0,
          ntd: Number(item.ntd || 0),
        };

        targetBranch.stock.push(copiedItem);
      });
    });

    // Save full database data
    await saveFullDbData(updatedDb);

    // Reset share states and close modal
    setShowShareStockModal(false);
    setSelectedShareCategories([]);
    setSelectedShareBranches([]);
    setShareStep(1);

    await alert(`Successfully shared stock items of selected categories to target branches!`);
  };

  const handleExecuteMove = async () => {
    if (!selectedMoveBranch) {
      await alert("Please select a destination branch.");
      return;
    }
    if (moveItemsList.length === 0) {
      await alert("Please add at least one item to move.");
      return;
    }

    const isConfirmed = await confirm(
      `Are you sure you want to move the selected items to ${selectedMoveBranch} Branch? This will deduct the quantities from ${activeBranch} and add them to ${selectedMoveBranch}.`
    );
    if (!isConfirmed) return;

    // Create deep copy of the full database
    const updatedDb = JSON.parse(JSON.stringify(fullDbData));

    // Get source and target branch data
    const sourceBranch = updatedDb.branches[activeBranch];
    const targetBranch = updatedDb.branches[selectedMoveBranch];

    if (!sourceBranch || !targetBranch) {
      await alert("Branch data not found.");
      return;
    }

    const txDateIso = new Date().toISOString();

    for (const moveItem of moveItemsList) {
      // Find item in source branch
      const sourceItem = sourceBranch.stock.find(item => item.id === moveItem.stockId);
      if (!sourceItem) {
        await alert(`Item "${moveItem.model}" not found in source branch!`);
        return;
      }

      // Check current available balance
      const currentSourceBalance = Math.max(0, (sourceItem.x_b || 0) + (sourceItem.in || 0) - (sourceItem.sale || 0));
      if (currentSourceBalance < moveItem.qty) {
        await alert(`Not enough stock for "${moveItem.model}"! Available: ${currentSourceBalance}, Requested: ${moveItem.qty}`);
        return;
      }

      // Deduct from source branch
      sourceItem.in = (sourceItem.in || 0) - moveItem.qty;

      // Add to source branch history
      const sourceTxId = Date.now().toString() + '_' + Math.random().toString(36).substring(2, 9);
      const sourceTx = {
        id: sourceTxId,
        date: txDateIso,
        stockId: sourceItem.id,
        type: 'Stock In',
        qty: -moveItem.qty,
        details: `Moved to ${selectedMoveBranch} Branch`,
        prevNtd: sourceItem.ntd || 0,
        newNtd: sourceItem.ntd || 0
      };
      if (!sourceBranch.history) sourceBranch.history = [];
      sourceBranch.history.push(sourceTx);

      // Find or create item in target branch by model name (exact match)
      let targetItem = targetBranch.stock.find(item => item.model === sourceItem.model);
      
      if (targetItem) {
        // Calculate new NTD (weighted average)
        const currentTargetNtd = targetItem.ntd || 0;
        const currentTargetBalance = Math.max(0, (targetItem.x_b || 0) + (targetItem.in || 0) - (targetItem.sale || 0));
        let newTargetNtd = (currentTargetNtd === 0 || currentTargetBalance <= 0)
          ? moveItem.ntd
          : ((currentTargetBalance * currentTargetNtd) + (moveItem.qty * moveItem.ntd)) / (currentTargetBalance + moveItem.qty);

        // Increment target item's Stock In
        targetItem.in = (targetItem.in || 0) + moveItem.qty;
        targetItem.ntd = newTargetNtd;

        // Add to target branch history
        const targetTxId = Date.now().toString() + '_' + Math.random().toString(36).substring(2, 9);
        const targetTx = {
          id: targetTxId,
          date: txDateIso,
          stockId: targetItem.id,
          type: 'Stock In',
          qty: moveItem.qty,
          details: `Moved from ${activeBranch} Branch`,
          prevNtd: currentTargetNtd,
          newNtd: newTargetNtd
        };
        if (!targetBranch.history) targetBranch.history = [];
        targetBranch.history.push(targetTx);
      } else {
        // Ensure category exists in target branch
        if (!targetBranch.categories) targetBranch.categories = [];
        if (!targetBranch.categories.includes(sourceItem.category)) {
          targetBranch.categories.push(sourceItem.category);
        }

        // Create new item in target branch
        const targetItemId = Date.now().toString() + '_' + Math.random().toString(36).substring(2, 9);
        const newTargetItem = {
          id: targetItemId,
          model: sourceItem.model,
          category: sourceItem.category,
          x_b: 0,
          in: moveItem.qty,
          sale: 0,
          ntd: sourceItem.ntd
        };
        if (!targetBranch.stock) targetBranch.stock = [];
        targetBranch.stock.push(newTargetItem);

        // Add to target branch history
        const targetTxId = Date.now().toString() + '_' + Math.random().toString(36).substring(2, 9);
        const targetTx = {
          id: targetTxId,
          date: txDateIso,
          stockId: targetItemId,
          type: 'Stock In',
          qty: moveItem.qty,
          details: `Moved from ${activeBranch} Branch`,
          prevNtd: 0,
          newNtd: sourceItem.ntd
        };
        if (!targetBranch.history) targetBranch.history = [];
        targetBranch.history.push(targetTx);
      }
    }

    // Save full database data
    await saveFullDbData(updatedDb);

    // Reset move states and close modal
    setShowMoveStockModal(false);
    setSelectedMoveBranch('');
    setMoveItemsList([]);
    setMoveSearchQuery('');
    setSelectedMoveItem(null);
    setMoveItemQty('');

    await alert("Stock items successfully moved to target branch!");
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500 text-sm">Configure app behavior and backup data</p>
      </div>

      <div className="max-w-3xl flex flex-col gap-4">
        
        {/* App Configuration */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Settings className="w-5 h-5"/> App Configuration</h2>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">App Icon</label>
              <div className="flex items-center gap-4">
                {data.settings?.appIcon ? (
                  <img src={data.settings.appIcon} alt="Logo" className="w-16 h-16 rounded-full object-cover border" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">No Logo</div>
                )}
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleIconUpload} />
                <button onClick={() => fileInputRef.current.click()} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition">
                  Upload Logo
                </button>
              </div>
            </div>

            {/* Branch Details */}
            <div className="flex flex-col gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-200/60">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Branch Address</label>
                <input 
                  type="text" 
                  placeholder={`Enter Address for ${activeBranch} Branch`} 
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                  value={branchAddress}
                  onChange={e => setBranchAddress(e.target.value)}
                />
                <p className="text-[10px] text-gray-500 mt-1">Printed at the top of customer sale invoices/receipts.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Branch Phone / Contact</label>
                  <input 
                    type="text" 
                    placeholder={`Enter Phone for ${activeBranch} Branch`} 
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                    value={branchPhone}
                    onChange={e => setBranchPhone(e.target.value)}
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Shown under the logo in the sidebar and printed on receipts.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Low Stock Limit (Threshold)</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="3" 
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                    value={lowStockLimit}
                    onChange={e => setLowStockLimit(e.target.value)}
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Stock balance below or equal to this value highlights items as low stock.</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
              <button 
                onClick={() => setShowCategoryModal(true)}
                className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-4 py-2 rounded flex items-center gap-2 font-medium transition"
              >
                <List className="w-4 h-4" /> Manage Categories ({localCategories.length})
              </button>
              <p className="text-xs text-gray-500 mt-2">Used for grouping in the Stock Tab.</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2"><Lock className="w-4 h-4 text-slate-600"/> App Lock Password Settings</h3>
              
              {data.settings?.password ? (
                <div className="grid gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Current Password</label>
                    <input 
                      type="password" 
                      placeholder="Enter current password to authorize changes" 
                      className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={currentPasswordInput}
                      onChange={e => setCurrentPasswordInput(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">New Password</label>
                      <input 
                        type="password" 
                        placeholder="Leave empty to remove lock" 
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newPasswordInput}
                        onChange={e => setNewPasswordInput(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Confirm New Password</label>
                      <input 
                        type="password" 
                        placeholder="Leave empty to remove lock" 
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={confirmPasswordInput}
                        onChange={e => setConfirmPasswordInput(e.target.value)}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">To change or remove the lock, verify with your current password first. Leave new password fields blank to disable the password lock.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">New Password</label>
                      <input 
                        type="password" 
                        placeholder="Create a new startup password" 
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newPasswordInput}
                        onChange={e => setNewPasswordInput(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Confirm New Password</label>
                      <input 
                        type="password" 
                        placeholder="Confirm new startup password" 
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={confirmPasswordInput}
                        onChange={e => setConfirmPasswordInput(e.target.value)}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Set a password to lock the application on startup. Leave these fields empty if you do not want an app lock.</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <button onClick={saveSettings} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition">
                <Save className="w-4 h-4" /> Save Settings
              </button>
            </div>
          </div>
        </div>

        {/* Share Stock Across Branches */}
        {fullDbData && saveFullDbData && (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-600" /> Share Stock Across Branches
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Copy and sync stock items from <strong>{activeBranch} Branch</strong> to other branches. You can choose which categories to share, and overwrite target categories.
            </p>
            <div>
              <button 
                onClick={() => {
                  setSelectedShareCategories([]);
                  setSelectedShareBranches([]);
                  setShareStep(1);
                  setShowShareStockModal(true);
                }} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition text-sm cursor-pointer"
              >
                <Share2 className="w-4 h-4" /> Share Stock
              </button>
            </div>
          </div>
        )}

        {/* Move Stock to Another Branch */}
        {fullDbData && saveFullDbData && (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-emerald-600" /> Move Stock to Another Branch
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Transfer specific quantity of stock items from <strong>{activeBranch} Branch</strong> to another branch. This will deduct the quantity from {activeBranch} and add it to the destination branch with the same NTD value.
            </p>
            <div>
              <button 
                onClick={() => {
                  setSelectedMoveBranch('');
                  setMoveItemsList([]);
                  setMoveSearchQuery('');
                  setSelectedMoveItem(null);
                  setMoveItemQty('');
                  setShowMoveStockModal(true);
                }} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition text-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Move Stock
              </button>
            </div>
          </div>
        )}

        {/* Data Management */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold mb-3">Data Management</h2>
          <p className="text-gray-600 text-sm mb-4">Since this app runs entirely offline, it's crucial to backup your data regularly. Download a copy and keep it somewhere safe (like a USB drive).</p>
          
          <div className="flex gap-4">
            <button onClick={backupData} className="flex-1 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 py-3 rounded-lg flex justify-center items-center gap-2 font-semibold transition">
              <Download className="w-5 h-5" /> Backup Data to File
            </button>
            
            <input type="file" accept=".json" className="hidden" ref={dataInputRef} onChange={restoreData} />
            <button onClick={() => dataInputRef.current.click()} className="flex-1 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 py-3 rounded-lg flex justify-center items-center gap-2 font-semibold transition">
              <Upload className="w-5 h-5" /> Restore Data from Backup
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-150 flex flex-col gap-2">
            <h3 className="text-sm font-bold text-red-650 uppercase tracking-wider">Danger Zone</h3>
            <p className="text-gray-500 text-xs">Erase all database records (stock, sales, categories, employees, expenses, and password) completely from this device.</p>
            <div>
              <button 
                onClick={handleClearDataClick} 
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-semibold transition text-sm shadow-sm"
              >
                <Trash2 className="w-4 h-4" /> Clear All App Data
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeCategoryModal}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Manage Categories</h2>
              <button onClick={closeCategoryModal} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                placeholder="New category name..." 
                className="flex-1 border border-gray-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleAddCategory();
                  }
                }}
              />
              <button 
                onClick={handleAddCategory} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            <div className="flex-1 overflow-auto border rounded-lg bg-gray-50 p-2">
              {localCategories.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">No categories added yet.</div>
              ) : (
                <ul className="space-y-1">
                  {localCategories.map((cat, i) => (
                    <li 
                      key={i} 
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, i)}
                      onDragOver={(e) => handleDragOver(e, i)}
                      onDragEnd={handleDragEnd}
                      className={`flex justify-between items-center bg-white border border-gray-200 py-1 px-2 rounded shadow-sm cursor-grab active:cursor-grabbing transition-all duration-150 ${draggedIndex === i ? 'opacity-40 bg-blue-50 border-blue-300 scale-[0.98]' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-gray-400 shrink-0 select-none" />
                        <div className="flex flex-col -space-y-0.5">
                          <button 
                            disabled={i === 0}
                            onClick={() => moveCategoryUp(i)}
                            className={`p-[1px] rounded hover:bg-gray-100 ${i === 0 ? 'text-gray-200 cursor-not-allowed opacity-30' : 'text-gray-500 hover:text-blue-600'}`}
                            title="Move Up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            disabled={i === localCategories.length - 1}
                            onClick={() => moveCategoryDown(i)}
                            className={`p-[1px] rounded hover:bg-gray-100 ${i === localCategories.length - 1 ? 'text-gray-200 cursor-not-allowed opacity-30' : 'text-gray-500 hover:text-blue-600'}`}
                            title="Move Down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {editingCatIndex === i ? (
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="text" 
                              className="border border-gray-300 rounded px-2 py-0.5 text-xs outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                              value={editingCatName}
                              onChange={e => setEditingCatName(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveCategoryName(i);
                                if (e.key === 'Escape') setEditingCatIndex(null);
                              }}
                              autoFocus
                            />
                            <button 
                              onClick={() => handleSaveCategoryName(i)}
                              className="text-green-600 hover:bg-green-50 p-0.5 rounded transition"
                              title="Save Name"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => setEditingCatIndex(null)}
                              className="text-red-500 hover:bg-red-50 p-0.5 rounded transition"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="font-medium text-gray-800">
                            {cat} <span className="text-xs text-gray-400 font-normal ml-1">({(data.stock || []).filter(item => item.category === cat).length} items)</span>
                          </span>
                        )}
                      </div>
                      {editingCatIndex !== i && (
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => { setEditingCatIndex(i); setEditingCatName(cat); }}
                            className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded transition"
                            title="Rename category"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleRemoveCategory(cat)}
                            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition"
                            title="Remove category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t flex justify-end">
              <button 
                onClick={handleSavePositions} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition flex items-center gap-1.5 w-full justify-center"
              >
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Clear Data Password Verification Modal */}
      {showClearDataModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowClearDataModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 text-red-650" style={{ color: '#dc2626' }}>
                <Shield className="w-5 h-5 animate-pulse" /> Security Check
              </h2>
              <button onClick={() => setShowClearDataModal(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Please enter the application password to authorize clearing all database records.
            </p>

            <div className="flex flex-col gap-3">
              <input 
                type="password" 
                placeholder="Enter Password" 
                className="w-full border border-gray-300 rounded p-2.5 focus:ring-2 focus:ring-red-550 outline-none text-center text-lg"
                value={clearDataPasswordInput}
                onChange={e => setClearDataPasswordInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleConfirmPasswordForClear();
                  }
                }}
                autoFocus
              />
              
              {clearDataError && (
                <p className="text-xs text-red-600 font-semibold text-center">{clearDataError}</p>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <button 
                  onClick={() => setShowClearDataModal(false)} 
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded font-medium transition text-sm flex-1"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmPasswordForClear} 
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition text-sm flex-1"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Stock Modal */}
      {showShareStockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowShareStockModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-600" />
                Share Stock - Step {shareStep} of 2
              </h2>
              <button 
                type="button" 
                onClick={() => setShowShareStockModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {shareStep === 1 ? (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">Select Categories to Share</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Choose which stock categories from <strong>{activeBranch}</strong> you want to share with other branches.
                  </p>
                  
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 flex flex-col gap-2 bg-slate-50">
                    {data.categories.map(cat => {
                      const itemCount = (data.stock || []).filter(item => item.category === cat).length;
                      return (
                        <div 
                          key={cat} 
                          onClick={() => {
                            if (selectedShareCategories.includes(cat)) {
                              setSelectedShareCategories(selectedShareCategories.filter(c => c !== cat));
                            } else {
                              setSelectedShareCategories([...selectedShareCategories, cat]);
                            }
                          }}
                          className="flex items-center gap-3 p-2 rounded hover:bg-white cursor-pointer select-none transition border border-transparent hover:border-gray-200"
                        >
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                            checked={selectedShareCategories.includes(cat)}
                            readOnly
                          />
                          <div className="flex-1 flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-800">{cat}</span>
                            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full font-semibold">{itemCount} items</span>
                          </div>
                        </div>
                      );
                    })}
                    {data.categories.length === 0 && (
                      <div className="text-sm text-gray-500 text-center py-4">No categories found in this branch.</div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 justify-end mt-2 border-t pt-3">
                  <button 
                    type="button" 
                    onClick={() => setShowShareStockModal(false)} 
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-semibold text-sm transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    disabled={selectedShareCategories.length === 0}
                    onClick={() => setShareStep(2)} 
                    className={`px-5 py-2 text-white rounded font-bold text-sm shadow-sm transition cursor-pointer ${
                      selectedShareCategories.length === 0 ? 'bg-indigo-400 cursor-not-allowed opacity-60' : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">Select Target Branches</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Choose which branches to share the stock items of selected categories to.
                  </p>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800 mb-3 flex flex-col gap-1">
                    <span className="font-bold flex items-center gap-1">
                      ⚠️ WARNING: OVERWRITE WARNING
                    </span>
                    <span>
                      Sharing will completely overwrite the stock items of the selected categories on the target branches:
                    </span>
                    <ul className="list-disc pl-4 font-semibold mt-1 flex flex-col gap-0.5">
                      {selectedShareCategories.map(cat => (
                        <li key={cat}>{cat}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 flex flex-col gap-2 bg-slate-50">
                    {Object.keys(fullDbData.branches)
                      .filter(bName => bName !== activeBranch)
                      .map(bName => (
                        <div 
                          key={bName} 
                          onClick={() => {
                            if (selectedShareBranches.includes(bName)) {
                              setSelectedShareBranches(selectedShareBranches.filter(b => b !== bName));
                            } else {
                              setSelectedShareBranches([...selectedShareBranches, bName]);
                            }
                          }}
                          className="flex items-center gap-3 p-2 rounded hover:bg-white cursor-pointer select-none transition border border-transparent hover:border-gray-200"
                        >
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                            checked={selectedShareBranches.includes(bName)}
                            readOnly
                          />
                          <span className="text-sm font-semibold text-gray-800">{bName} Branch</span>
                        </div>
                      ))}
                    {Object.keys(fullDbData.branches).filter(bName => bName !== activeBranch).length === 0 && (
                      <div className="text-sm text-gray-500 text-center py-4">No other branches found.</div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 justify-end mt-2 border-t pt-3">
                  <button 
                    type="button" 
                    onClick={() => setShareStep(1)} 
                    className="px-4 py-2 text-gray-600 hover:bg-gray-150 rounded font-semibold text-sm transition cursor-pointer"
                  >
                    Back
                  </button>
                  <button 
                    type="button" 
                    disabled={selectedShareBranches.length === 0}
                    onClick={handleExecuteShare} 
                    className={`px-5 py-2 text-white rounded font-bold text-sm shadow-sm transition cursor-pointer ${
                      selectedShareBranches.length === 0 ? 'bg-emerald-400 cursor-not-allowed opacity-60' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    Share Stock
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Move Stock Modal */}
      {showMoveStockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowMoveStockModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin-hover" />
                Move Stock
              </h2>
              <button 
                type="button" 
                onClick={() => setShowMoveStockModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto pr-1">
              {/* Target Branch Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Select Destination Branch</label>
                <select
                  value={selectedMoveBranch}
                  onChange={e => setSelectedMoveBranch(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium cursor-pointer"
                >
                  <option value="">-- Choose Branch --</option>
                  {Object.keys(fullDbData.branches)
                    .filter(bName => bName !== activeBranch)
                    .map(bName => (
                      <option key={bName} value={bName}>{bName} Branch</option>
                    ))}
                </select>
              </div>

              {/* Add Item Section */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">Add Item to Move List</h3>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  
                  {/* Searchable Dropdown */}
                  <div className="md:col-span-6 relative" ref={moveDropdownRef}>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Search Product Model</label>
                    <input
                      type="text"
                      placeholder={selectedMoveItem ? selectedMoveItem.model : "Type model name to search..."}
                      value={moveSearchQuery}
                      onChange={e => {
                        setMoveSearchQuery(e.target.value);
                        setIsMoveDropdownOpen(true);
                      }}
                      onFocus={() => setIsMoveDropdownOpen(true)}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                    />
                    
                    {isMoveDropdownOpen && (
                      <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                        {/* Filtered list */}
                        {(data.stock || [])
                          .filter(item => {
                            const balance = Math.max(0, (item.x_b || 0) + (item.in || 0) - (item.sale || 0));
                            const isAlreadyAdded = moveItemsList.some(mi => mi.stockId === item.id);
                            return balance > 0 && 
                              !isAlreadyAdded && 
                              item.model.toLowerCase().includes(moveSearchQuery.toLowerCase());
                          })
                          .map(item => {
                            const balance = Math.max(0, (item.x_b || 0) + (item.in || 0) - (item.sale || 0));
                            return (
                              <div
                                key={item.id}
                                onClick={() => {
                                  setSelectedMoveItem(item);
                                  setMoveSearchQuery('');
                                  setIsMoveDropdownOpen(false);
                                }}
                                className="px-4 py-2 hover:bg-slate-100 cursor-pointer flex justify-between items-center text-sm border-b last:border-0"
                              >
                                <span className="font-semibold text-gray-800">{item.model}</span>
                                <div className="text-xs text-gray-500 flex gap-2">
                                  <span className="bg-slate-150 px-2 py-0.5 rounded font-medium">Qty: {balance}</span>
                                  <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">Cost: Rs {item.ntd.toLocaleString('en-IN')}</span>
                                </div>
                              </div>
                            );
                          })}
                        {/* No items found */}
                        {(data.stock || [])
                          .filter(item => {
                            const balance = Math.max(0, (item.x_b || 0) + (item.in || 0) - (item.sale || 0));
                            const isAlreadyAdded = moveItemsList.some(mi => mi.stockId === item.id);
                            return balance > 0 && 
                              !isAlreadyAdded && 
                              item.model.toLowerCase().includes(moveSearchQuery.toLowerCase());
                          }).length === 0 && (
                            <div className="p-3 text-center text-gray-500 text-xs font-semibold">No available items found</div>
                          )}
                      </div>
                    )}
                  </div>

                  {/* Quantity Input */}
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                      Qty {selectedMoveItem ? `(Max: ${Math.max(0, (selectedMoveItem.x_b || 0) + (selectedMoveItem.in || 0) - (selectedMoveItem.sale || 0))})` : ''}
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="0"
                      disabled={!selectedMoveItem}
                      value={moveItemQty}
                      onChange={e => setMoveItemQty(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium disabled:bg-slate-100 disabled:cursor-not-allowed text-center"
                    />
                  </div>

                  {/* Add Button */}
                  <div className="md:col-span-3">
                    <button
                      type="button"
                      disabled={!selectedMoveItem || !moveItemQty}
                      onClick={() => {
                        const qty = Number(moveItemQty);
                        const balance = Math.max(0, (selectedMoveItem.x_b || 0) + (selectedMoveItem.in || 0) - (selectedMoveItem.sale || 0));
                        if (qty <= 0) {
                          alert("Please enter a valid quantity.");
                          return;
                        }
                        if (qty > balance) {
                          alert(`Requested quantity (${qty}) exceeds available stock (${balance}).`);
                          return;
                        }
                        setMoveItemsList([...moveItemsList, {
                          stockId: selectedMoveItem.id,
                          model: selectedMoveItem.model,
                          category: selectedMoveItem.category,
                          qty: qty,
                          ntd: selectedMoveItem.ntd || 0,
                          available: balance
                        }]);
                        setSelectedMoveItem(null);
                        setMoveItemQty('');
                        setMoveSearchQuery('');
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-2 font-bold text-sm shadow-sm transition disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Add to List
                    </button>
                  </div>
                </div>
              </div>

              {/* Items List Table */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Items to Move ({moveItemsList.length})</label>
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-slate-50 max-h-52 overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-800 text-white text-xs font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="p-2 border-r border-slate-700">Model</th>
                        <th className="p-2 border-r border-slate-700 text-center">Category</th>
                        <th className="p-2 border-r border-slate-700 text-center">Qty to Move</th>
                        <th className="p-2 border-r border-slate-700 text-right">NTD (Cost)</th>
                        <th className="p-2 text-center w-16">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {moveItemsList.map((item, index) => (
                        <tr key={index} className="bg-white hover:bg-slate-50 border-b last:border-0 font-medium">
                          <td className="p-2 border-r border-gray-200 font-bold text-gray-800">{item.model}</td>
                          <td className="p-2 border-r border-gray-200 text-center text-gray-500">{item.category}</td>
                          <td className="p-2 border-r border-gray-200 text-center font-bold text-emerald-600">{item.qty}</td>
                          <td className="p-2 border-r border-gray-200 text-right text-gray-700">Rs {item.ntd.toLocaleString('en-IN')}</td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setMoveItemsList(moveItemsList.filter((_, i) => i !== index));
                              }}
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {moveItemsList.length === 0 && (
                        <tr>
                          <td colSpan="5" className="p-4 text-center text-gray-400 font-semibold italic">
                            No items added to the move list yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-4 border-t pt-3">
              <button 
                type="button" 
                onClick={() => setShowMoveStockModal(false)} 
                className="px-5 py-2.5 text-gray-650 hover:bg-gray-100 rounded-lg font-semibold text-sm transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button" 
                disabled={moveItemsList.length === 0 || !selectedMoveBranch}
                onClick={handleExecuteMove} 
                className={`px-6 py-2.5 text-white rounded-lg font-bold text-sm shadow-sm transition cursor-pointer ${
                  moveItemsList.length === 0 || !selectedMoveBranch ? 'bg-emerald-400 cursor-not-allowed opacity-60' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
