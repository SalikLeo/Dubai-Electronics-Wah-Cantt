import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Receipt, Users, Settings, Bell, MapPin, History } from 'lucide-react';
import { useDialog } from './components/DialogProvider.jsx';

// Placeholder components for tabs
import DashboardTab from './tabs/DashboardTab';
import StockTab from './tabs/StockTab';
import SalesTab from './tabs/SalesTab';
import PurchasesTab from './tabs/PurchasesTab';
import ExpensesTab from './tabs/ExpensesTab';
import EmployeesTab from './tabs/EmployeesTab';
import ReminderTab from './tabs/ReminderTab';
import SettingsTab from './tabs/SettingsTab';

function App() {
  const [dbData, setDbData] = useState(null);
  const [activeBranch, setActiveBranch] = useState('Wah Cantt');
  const [isLocked, setIsLocked] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [liveTime, setLiveTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const options = {
        timeZone: 'Asia/Karachi',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      setLiveTime(new Date().toLocaleString('en-IN', options));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Load data on mount
    if (window.api) {
      window.api.getData().then(loadedDb => {
        setDbData(loadedDb);
        const currentBranch = 'Wah Cantt';
        setActiveBranch(currentBranch);
        
        // Get password for current active branch
        const activeBranchData = loadedDb.branches?.[currentBranch];
        if (!activeBranchData?.settings?.password) {
          setIsLocked(false);
        } else {
          setIsLocked(true);
        }
      });
    } else {
      // Fallback for web preview testing
      console.warn('Electron API not found, using mock data.');
      const baseBranch = {
        settings: {
          appIcon: null,
          password: "",
          branchAddress: "",
          branchPhone: ""
        },
        categories: ["Refrigerators", "Deep Freezers", "Washing Machines", "Air Conditioners", "Microwave Ovens"],
        stock: [],
        sales: [],
        expenses: [],
        employees: []
      };
      
      const mockDb = {
        activeBranch: 'Wah Cantt',
        branches: {
          'Wah Cantt': {
            ...baseBranch,
            settings: {
              ...baseBranch.settings,
              branchAddress: "Al-Noor Shopping Mall, Bahatar Morr Main G.T Road, Wah Cantt",
              branchPhone: "051-4916830"
            }
          },
          'Pindi Gheb': JSON.parse(JSON.stringify(baseBranch)),
          'Fateh Jung': JSON.parse(JSON.stringify(baseBranch))
        }
      };
      setDbData(mockDb);
      setActiveBranch('Wah Cantt');
      setIsLocked(false);
    }
  }, []);

  // Update window/document title dynamically
  useEffect(() => {
    document.title = `Dubai Electronics Stock Manager - ${activeBranch}`;
  }, [activeBranch]);

  const saveActiveBranchData = async (newBranchData) => {
    if (!dbData) return;
    const updatedDb = {
      ...dbData,
      branches: {
        ...dbData.branches,
        [activeBranch]: newBranchData
      }
    };
    setDbData(updatedDb);
    if (window.api) {
      await window.api.saveData(updatedDb);
    }
  };

  const saveFullDbData = async (newDbData) => {
    setDbData(newDbData);
    if (window.api) {
      await window.api.saveData(newDbData);
    }
  };

  const handleBranchChange = async (targetBranch) => {
    if (!dbData) return;
    const updatedDb = {
      ...dbData,
      activeBranch: targetBranch
    };
    setDbData(updatedDb);
    setActiveBranch(targetBranch);
    if (window.api) {
      await window.api.saveData(updatedDb);
    }

    // Check if the target branch is locked
    const targetBranchData = updatedDb.branches?.[targetBranch];
    if (targetBranchData?.settings?.password) {
      setIsLocked(true);
      setPasswordInput('');
    } else {
      setIsLocked(false);
    }
  };

  const { alert } = useDialog();

  const unlockApp = async (e) => {
    e.preventDefault();
    const activeBranchData = dbData?.branches?.[activeBranch];
    if (activeBranchData?.settings?.password === passwordInput) {
      setIsLocked(false);
    } else {
      await alert("Incorrect Password!");
    }
  };

  if (!dbData) {
    return null;
  }

  // Get active branch's data to pass down to children
  const data = dbData.branches[activeBranch];
  const saveData = saveActiveBranchData;

  if (isLocked) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-[400px] text-center flex flex-col gap-5 border border-slate-700/10">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Dubai Electronics</h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">Select branch and enter password to unlock</p>
          </div>

          {/* Branch Switcher on Lock Screen */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 shadow-inner justify-center gap-1">
            {[
              { id: 'Wah Cantt', activeClass: 'bg-blue-600 text-white shadow-sm', inactiveClass: 'text-slate-600 hover:text-blue-600 hover:bg-slate-200/50' },
              { id: 'Pindi Gheb', activeClass: 'bg-emerald-600 text-white shadow-sm', inactiveClass: 'text-slate-600 hover:text-emerald-600 hover:bg-slate-200/50' },
              { id: 'Fateh Jung', activeClass: 'bg-amber-600 text-white shadow-sm', inactiveClass: 'text-slate-600 hover:text-amber-600 hover:bg-slate-200/50' }
            ].map((branch) => {
              const isActive = activeBranch === branch.id;
              return (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => handleBranchChange(branch.id)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 whitespace-nowrap shrink-0 ${
                    isActive ? branch.activeClass : branch.inactiveClass
                  }`}
                >
                  {branch.id}
                </button>
              );
            })}
          </div>

          <form onSubmit={unlockApp} className="flex flex-col gap-4 mt-1">
            <input 
              type="password" 
              placeholder={`Enter Password for ${activeBranch}`} 
              className="border border-gray-300 rounded-lg p-3 text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 outline-none"
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              autoFocus
            />
            <button type="submit" className="bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition shadow-md">
              Unlock {activeBranch}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/dashboard' },
    { name: 'Stock', icon: <Package className="w-5 h-5" />, path: '/stock' },
    { name: 'Sales', icon: <ShoppingCart className="w-5 h-5" />, path: '/sales' },
    { name: 'Purchases', icon: <History className="w-5 h-5" />, path: '/purchases' },
    { name: 'Expenses', icon: <Receipt className="w-5 h-5" />, path: '/expenses' },
    { name: 'Employees', icon: <Users className="w-5 h-5" />, path: '/employees' },
    { name: 'Reminder', icon: <Bell className="w-5 h-5" />, path: '/reminder' },
    { name: 'Settings', icon: <Settings className="w-5 h-5" />, path: '/settings' },
  ];

  return (
    <Router>
      <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
        {/* Sidebar */}
        <div className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-10 shrink-0 print-hidden">
          <div className="p-6 flex flex-col items-center border-b border-slate-800">
            {data.settings?.appIcon ? (
              <img src={data.settings.appIcon} alt="App Logo" className="w-36 h-36 rounded-2xl object-cover mb-4 shadow-lg border border-slate-700" />
            ) : (
              <div className="w-36 h-36 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg border border-slate-700">
                <span className="text-5xl font-bold">DE</span>
              </div>
            )}
            <h2 className="text-xl font-bold tracking-wider text-center leading-tight">Dubai Electronics</h2>
            <p className="text-sm font-semibold text-blue-400 tracking-wide text-center mt-1">{activeBranch} Branch</p>
            <p className="text-slate-400 text-xs mt-2">Contact: {data.settings?.branchPhone || '0300-5387166'}</p>
          </div>
          
          <nav className="flex-1 py-6 px-3 flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                    isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                {item.icon}
                {item.name}
              </NavLink>
            ))}
          </nav>
          
          <div className="p-4 text-center text-sm text-white font-normal border-t border-slate-800">
            Software By PrimeSoft<br />
            Contact: 0309-5369472
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Global Header / Top Bar */}
          <header className="bg-white border-b border-gray-150 px-6 py-3 flex items-center justify-between shadow-sm z-10 print-hidden">
            <div className="flex items-center gap-3">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 shadow-inner">
                {[
                  { 
                    id: 'Wah Cantt', 
                    iconColor: 'text-blue-500', 
                    activeClass: 'bg-blue-600 text-white shadow-sm', 
                    inactiveClass: 'text-slate-650 hover:text-blue-600 hover:bg-slate-200/50' 
                  },
                  { 
                    id: 'Pindi Gheb', 
                    iconColor: 'text-emerald-500', 
                    activeClass: 'bg-emerald-600 text-white shadow-sm', 
                    inactiveClass: 'text-slate-650 hover:text-emerald-600 hover:bg-slate-200/50' 
                  },
                  { 
                    id: 'Fateh Jung', 
                    iconColor: 'text-amber-500', 
                    activeClass: 'bg-amber-600 text-white shadow-sm', 
                    inactiveClass: 'text-slate-650 hover:text-amber-600 hover:bg-slate-200/50' 
                  }
                ].map((branch) => {
                  const isActive = activeBranch === branch.id;
                  return (
                    <button
                      key={branch.id}
                      type="button"
                      onClick={() => handleBranchChange(branch.id)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-2 whitespace-nowrap shrink-0 ${
                        isActive ? branch.activeClass : branch.inactiveClass
                      }`}
                    >
                      <MapPin className={`w-3.5 h-3.5 transition-colors duration-200 ${isActive ? 'text-white' : branch.iconColor}`} />
                      {branch.id}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/50 select-none">
                {liveTime}
              </div>
              <div className="text-xs font-bold bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded-xl border border-slate-200/60 uppercase tracking-wider flex items-center gap-2 select-none">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {activeBranch} Active
              </div>
            </div>
          </header>

          {/* Scrollable Tab Content */}
          <div className="flex-1 overflow-auto bg-gray-50">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardTab key={activeBranch} data={data} saveData={saveData} activeBranch={activeBranch} />} />
              <Route path="/stock" element={<StockTab key={activeBranch} data={data} saveData={saveData} activeBranch={activeBranch} />} />
              <Route path="/sales" element={<SalesTab key={activeBranch} data={data} saveData={saveData} activeBranch={activeBranch} />} />
              <Route path="/purchases" element={<PurchasesTab key={activeBranch} data={data} saveData={saveData} activeBranch={activeBranch} />} />
              <Route path="/expenses" element={<ExpensesTab key={activeBranch} data={data} saveData={saveData} activeBranch={activeBranch} />} />
              <Route path="/employees" element={<EmployeesTab key={activeBranch} data={data} saveData={saveData} activeBranch={activeBranch} />} />
              <Route path="/reminder" element={<ReminderTab key={activeBranch} data={data} saveData={saveData} activeBranch={activeBranch} />} />
              <Route path="/settings" element={<SettingsTab key={activeBranch} data={data} saveData={saveData} activeBranch={activeBranch} fullDbData={dbData} saveFullDbData={saveFullDbData} />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
