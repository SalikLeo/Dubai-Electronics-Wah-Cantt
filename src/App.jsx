import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Receipt, Users, Settings, Bell } from 'lucide-react';
import { useDialog } from './components/DialogProvider.jsx';

// Placeholder components for tabs
import DashboardTab from './tabs/DashboardTab';
import StockTab from './tabs/StockTab';
import SalesTab from './tabs/SalesTab';
import ExpensesTab from './tabs/ExpensesTab';
import EmployeesTab from './tabs/EmployeesTab';
import ReminderTab from './tabs/ReminderTab';
import SettingsTab from './tabs/SettingsTab';

function App() {
  const [data, setData] = useState(null);
  const [isLocked, setIsLocked] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');

  useEffect(() => {
    // Load data on mount
    if (window.api) {
      window.api.getData().then(loadedData => {
        setData(loadedData);
        if (!loadedData.settings?.password) {
          setIsLocked(false);
        }
      });
    } else {
      // Fallback for web preview testing
      console.warn('Electron API not found, using mock data.');
      setData({
        settings: {}, categories: [], stock: [], sales: [], expenses: [], employees: []
      });
      setIsLocked(false);
    }
  }, []);

  const saveData = async (newData) => {
    setData(newData);
    if (window.api) {
      await window.api.saveData(newData);
    }
  };

  const { alert } = useDialog();

  const unlockApp = async (e) => {
    e.preventDefault();
    if (data?.settings?.password === passwordInput) {
      setIsLocked(false);
    } else {
      await alert("Incorrect Password!");
    }
  };

  if (!data) {
    return null;
  }

  if (isLocked) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-96 text-center">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Dubai Electronics</h1>
          <form onSubmit={unlockApp} className="flex flex-col gap-4">
            <input 
              type="password" 
              placeholder="Enter Password" 
              className="border border-gray-300 rounded p-3 text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              autoFocus
            />
            <button type="submit" className="bg-blue-600 text-white font-semibold py-3 rounded hover:bg-blue-700 transition">
              Unlock
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
              <img src={data.settings.appIcon} alt="App Logo" className="w-28 h-28 rounded-2xl object-cover mb-4 shadow-lg border border-slate-700" />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg border border-slate-700">
                <span className="text-3xl font-bold">DE</span>
              </div>
            )}
            <h2 className="text-xl font-bold tracking-wider text-center leading-tight">Dubai Electronics</h2>
            <p className="text-sm font-semibold text-blue-400 tracking-wide text-center mt-1">Wah Cantt Branch</p>
            <p className="text-slate-400 text-xs mt-2">Contact: 0300-5387166</p>
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
          
          <div className="p-4 text-center text-xs text-slate-400 font-normal border-t border-slate-800" style={{ fontFamily: 'Provicali, sans-serif' }}>
            Software By PrimeSoft<br />
            Contact: 0309-5369472
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardTab data={data} saveData={saveData} />} />
            <Route path="/stock" element={<StockTab data={data} saveData={saveData} />} />
            <Route path="/sales" element={<SalesTab data={data} saveData={saveData} />} />
            <Route path="/expenses" element={<ExpensesTab data={data} saveData={saveData} />} />
            <Route path="/employees" element={<EmployeesTab data={data} saveData={saveData} />} />
            <Route path="/reminder" element={<ReminderTab data={data} saveData={saveData} />} />
            <Route path="/settings" element={<SettingsTab data={data} saveData={saveData} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
