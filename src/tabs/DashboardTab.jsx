import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PackagePlus, 
  FolderDown, 
  ShoppingCart, 
  TrendingDown, 
  Plus, 
  Activity 
} from 'lucide-react';

export default function DashboardTab({ data, saveData }) {
  const navigate = useNavigate();
  const [showSales, setShowSales] = useState(false);
  const [showExpenses, setShowExpenses] = useState(false);
  const [showReminders, setShowReminders] = useState(false);

  // Date helpers
  const todayYMD = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const getYMD = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-auto font-sans">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">Quick management and business metrics overview</p>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600 animate-pulse" /> Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Action: Add Item */}
          <button 
            onClick={() => navigate('/stock', { state: { openAddModal: true } })}
            className="flex flex-col items-center bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-lg hover:bg-blue-50/10 transition-all duration-300 text-center group font-sans cursor-pointer"
          >
            <div className="p-4 bg-blue-50 text-blue-600 rounded-full group-hover:scale-110 transition duration-300 mb-3.5 shadow-sm">
              <PackagePlus className="w-6 h-6" />
            </div>
            <span className="font-bold text-gray-800 block text-xl leading-tight tracking-tight">Add New Item</span>
            <span className="text-[11px] text-slate-500 font-medium mt-1.5 font-sans leading-normal">Register a new product model</span>
          </button>

          {/* Action: Add Stock */}
          <button 
            onClick={() => navigate('/stock', { state: { openAddStockModal: true } })}
            className="flex flex-col items-center bg-white p-6 rounded-2xl border border-slate-200 hover:border-green-500 hover:shadow-lg hover:bg-green-50/10 transition-all duration-300 text-center group font-sans cursor-pointer"
          >
            <div className="p-4 bg-green-50 text-green-600 rounded-full group-hover:scale-110 transition duration-300 mb-3.5 shadow-sm">
              <FolderDown className="w-6 h-6" />
            </div>
            <span className="font-bold text-gray-800 block text-xl leading-tight tracking-tight">Add Stock In</span>
            <span className="text-[11px] text-slate-500 font-medium mt-1.5 font-sans leading-normal">Increase stock of existing item</span>
          </button>

          {/* Action: Add Sale */}
          <button 
            onClick={() => navigate('/sales', { state: { openAddModal: true } })}
            className="flex flex-col items-center bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-lg hover:bg-indigo-50/10 transition-all duration-300 text-center group font-sans cursor-pointer"
          >
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full group-hover:scale-110 transition duration-300 mb-3.5 shadow-sm">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <span className="font-bold text-gray-800 block text-xl leading-tight tracking-tight">Record Sale</span>
            <span className="text-[11px] text-slate-500 font-medium mt-1.5 font-sans leading-normal">Log a customer sale record</span>
          </button>

          {/* Action: Add Expense */}
          <button 
            onClick={() => navigate('/expenses', { state: { openAddModal: true } })}
            className="flex flex-col items-center bg-white p-6 rounded-2xl border border-slate-200 hover:border-red-500 hover:shadow-lg hover:bg-red-50/10 transition-all duration-300 text-center group font-sans cursor-pointer"
          >
            <div className="p-4 bg-red-50 text-red-600 rounded-full group-hover:scale-110 transition duration-300 mb-3.5 shadow-sm">
              <TrendingDown className="w-6 h-6" />
            </div>
            <span className="font-bold text-gray-800 block text-xl leading-tight tracking-tight">Record Expense</span>
            <span className="text-[11px] text-slate-500 font-medium mt-1.5 font-sans leading-normal">Log office/business expenses</span>
          </button>

        </div>
      </div>

      {/* Recent Transactions List */}
      <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col transition-all duration-300 ${showSales ? 'flex-1 min-h-[300px]' : ''}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-gray-800 font-sans">Recent Sales History</h3>
          <button 
            onClick={() => setShowSales(!showSales)} 
            className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 text-xs font-bold font-sans rounded-lg transition-colors duration-200 cursor-pointer"
          >
            {showSales ? 'Hide Sales' : 'Show Sales'}
          </button>
        </div>
        {showSales && (
          <div className="flex-1 overflow-auto">
            {data.sales?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No sales logged yet.
              </div>
            ) : (
              <table className="w-full text-left border-collapse border border-gray-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                    <th className="py-2.5 px-3 border-r border-slate-200 last:border-r-0">Date</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 last:border-r-0">Item Model</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 last:border-r-0 text-center w-16">Qty</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 last:border-r-0 text-right">Sale Price</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 last:border-r-0 text-right text-green-600">Profit</th>
                    <th className="py-2.5 px-3 pl-4 last:border-r-0">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {(data.sales || []).slice(0, 10).map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 border-r border-slate-100 last:border-r-0 text-gray-500 whitespace-nowrap">
                        {new Date(sale.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-100 last:border-r-0 font-medium text-gray-800">{sale.model}</td>
                      <td className="py-2.5 px-3 border-r border-slate-100 last:border-r-0 text-center">{sale.qty}</td>
                      <td className="py-2.5 px-3 border-r border-slate-100 last:border-r-0 text-right font-semibold">Rs {sale.salePrice.toLocaleString('en-IN')}</td>
                      <td className={`py-2.5 px-3 border-r border-slate-100 last:border-r-0 text-right font-bold ${sale.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        Rs {sale.profit.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 pl-4 last:border-r-0 text-xs font-medium text-gray-600">
                        {sale.cashAmount > 0 ? `Cash: ${sale.cashAmount.toLocaleString('en-IN')}` : ''}
                        {sale.cashAmount > 0 && sale.onlineAmount > 0 ? ' / ' : ''}
                        {sale.onlineAmount > 0 ? `Online: ${sale.onlineAmount.toLocaleString('en-IN')}` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Recent Expenses History */}
      <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col transition-all duration-300 mt-6 ${showExpenses ? 'flex-1 min-h-[300px]' : ''}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-gray-800 font-sans">Recent Expenses History</h3>
          <button 
            onClick={() => setShowExpenses(!showExpenses)} 
            className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-xs font-bold font-sans rounded-lg transition-colors duration-200 cursor-pointer"
          >
            {showExpenses ? 'Hide Expenses' : 'Show Expenses'}
          </button>
        </div>
        {showExpenses && (
          <div className="flex-1 overflow-auto">
            {data.expenses?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No expenses logged yet.
              </div>
            ) : (
              <table className="w-full text-left border-collapse border border-gray-200 rounded-lg overflow-hidden font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                    <th className="py-2.5 px-3 border-r border-slate-200 last:border-r-0">Date</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 last:border-r-0">Description</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 last:border-r-0 text-right text-red-600">Amount</th>
                    <th className="py-2.5 px-3 pl-4 last:border-r-0">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {(data.expenses || []).slice(0, 10).map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 border-r border-slate-100 last:border-r-0 text-gray-500 whitespace-nowrap">
                        {new Date(expense.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-100 last:border-r-0 font-medium text-gray-800">{expense.description}</td>
                      <td className="py-2.5 px-3 border-r border-slate-100 last:border-r-0 text-right font-semibold text-red-600">Rs {expense.amount.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 pl-4 last:border-r-0 text-gray-600 font-medium">{expense.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Recent Reminders */}
      <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col transition-all duration-300 mt-6 ${showReminders ? 'flex-1 min-h-[300px]' : ''}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-gray-800 font-sans">Recent Reminders</h3>
          <button 
            onClick={() => setShowReminders(!showReminders)} 
            className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800 text-xs font-bold font-sans rounded-lg transition-colors duration-200 cursor-pointer"
          >
            {showReminders ? 'Hide Reminders' : 'Show Reminders'}
          </button>
        </div>
        {showReminders && (
          <div className="flex-1 overflow-auto">
            {data.reminders?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No stock reminders logged yet.
              </div>
            ) : (
              <table className="w-full text-left border-collapse border border-gray-200 rounded-lg overflow-hidden font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                    <th className="py-2.5 px-3 border-r border-slate-200 last:border-r-0">Date Added</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 last:border-r-0">Item Name</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 last:border-r-0">Category</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 last:border-r-0 text-center w-16">Qty</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 last:border-r-0 text-center">Status</th>
                    <th className="py-2.5 px-3 pl-4 last:border-r-0">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {(data.reminders || []).slice(0, 10).map((reminder) => (
                    <tr key={reminder.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 border-r border-slate-100 last:border-r-0 text-gray-500 whitespace-nowrap">
                        {new Date(reminder.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-100 last:border-r-0 font-medium text-gray-800">{reminder.itemName}</td>
                      <td className="py-2.5 px-3 border-r border-slate-100 last:border-r-0 text-gray-600">{reminder.category}</td>
                      <td className="py-2.5 px-3 border-r border-slate-100 last:border-r-0 text-center">{reminder.qty}</td>
                      <td className="py-2.5 px-3 border-r border-slate-100 last:border-r-0 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          reminder.status === 'received' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {reminder.status === 'received' ? 'Received' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 pl-4 last:border-r-0 text-gray-600 font-medium">{reminder.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
