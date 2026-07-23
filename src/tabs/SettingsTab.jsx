import React, { useState, useRef } from 'react';
import { Save, Plus, Trash2, Download, Upload, Shield, Camera, Lock, Settings, X, List, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { useDialog } from '../components/DialogProvider.jsx';

export default function SettingsTab({ data, saveData }) {
  const { alert, confirm } = useDialog();
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [localCategories, setLocalCategories] = useState([...(data.categories || [])]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const fileInputRef = useRef(null);
  const dataInputRef = useRef(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [clearDataPasswordInput, setClearDataPasswordInput] = useState('');
  const [clearDataError, setClearDataError] = useState('');

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

  const handleSavePositions = async () => {
    saveData({ ...data, categories: localCategories });
    await alert('Category positions saved successfully!');
  };

  const closeCategoryModal = () => {
    setLocalCategories([...(data.categories || [])]);
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
      settings: { ...data.settings, password: finalPassword }
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
    if (await confirm('Are you sure you want to delete all app data completely? This will clear all stock, sales, expenses, employees, and settings. This action cannot be undone!')) {
      const clearedData = {
        settings: {
          appIcon: null,
          password: ""
        },
        categories: ["Refrigerators", "Deep Freezers", "Washing Machines", "Air Conditioners", "Microwave Ovens"],
        stock: [],
        sales: [],
        expenses: [],
        employees: []
      };
      saveData(clearedData);
      setLocalCategories(clearedData.categories);
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setShowClearDataModal(false);
      await alert('All app data has been successfully cleared.');
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
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `DubaiElectronics_Backup_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
  };

  const restoreData = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if(await confirm('This will OVERWRITE all current data. Are you absolutely sure?')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const importedData = JSON.parse(e.target.result);
            if(importedData.stock && importedData.sales) {
              saveData(importedData);
              await alert('Data restored successfully!');
              setLocalCategories(importedData.categories || []);
              setCurrentPasswordInput('');
              setNewPasswordInput('');
              setConfirmPasswordInput('');
            } else {
              await alert('Invalid backup file structure.');
            }
          } catch(err) {
            await alert('Failed to parse backup file.');
          }
        };
        reader.readAsText(file);
      }
    }
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500">Configure app behavior and backup data</p>
      </div>

      <div className="max-w-3xl flex flex-col gap-6">
        
        {/* App Configuration */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Settings className="w-5 h-5"/> App Configuration</h2>
          <div className="grid gap-6">
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

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><Lock className="w-4 h-4 text-slate-600"/> App Lock Password Settings</h3>
              
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

        {/* Data Management */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Data Management</h2>
          <p className="text-gray-600 text-sm mb-6">Since this app runs entirely offline, it's crucial to backup your data regularly. Download a copy and keep it somewhere safe (like a USB drive).</p>
          
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
                      className={`flex justify-between items-center bg-white border border-gray-200 p-2 rounded shadow-sm cursor-grab active:cursor-grabbing transition-all duration-150 ${draggedIndex === i ? 'opacity-40 bg-blue-50 border-blue-300 scale-[0.98]' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-gray-400 shrink-0 select-none" />
                        <div className="flex flex-col">
                          <button 
                            disabled={i === 0}
                            onClick={() => moveCategoryUp(i)}
                            className={`p-0.5 rounded hover:bg-gray-100 ${i === 0 ? 'text-gray-200 cursor-not-allowed opacity-30' : 'text-gray-500 hover:text-blue-600'}`}
                            title="Move Up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            disabled={i === localCategories.length - 1}
                            onClick={() => moveCategoryDown(i)}
                            className={`p-0.5 rounded hover:bg-gray-100 ${i === localCategories.length - 1 ? 'text-gray-200 cursor-not-allowed opacity-30' : 'text-gray-500 hover:text-blue-600'}`}
                            title="Move Down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="font-medium text-gray-800">
                          {cat} <span className="text-xs text-gray-400 font-normal ml-1">({(data.stock || []).filter(item => item.category === cat).length} items)</span>
                        </span>
                      </div>
                      <button 
                        onClick={() => handleRemoveCategory(cat)}
                        className="text-gray-400 hover:text-red-500 p-1 hover:bg-red-50 rounded transition"
                        title="Remove category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
                <Save className="w-4 h-4" /> Save Positions
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
    </div>
  );
}
