import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Printer, Trash2, X, Search, Bell, Check, Calendar } from 'lucide-react';
import { useDialog } from '../components/DialogProvider.jsx';

export default function ReminderTab({ data, saveData }) {
  const { alert, confirm } = useDialog();

  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState('Daily'); // Default to Daily
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPrintPreview, setShowPrintPreview] = useState(false);

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

  const [addForm, setAddForm] = useState({
    itemName: '',
    category: data.categories?.[0] || '',
    customCategory: '',
    qty: '1',
    remarks: ''
  });

  // Automatically reset custom category field or set default category if modal opens
  useEffect(() => {
    if (showAddModal) {
      setAddForm({
        itemName: '',
        category: data.categories?.[0] || '',
        customCategory: '',
        qty: '1',
        remarks: ''
      });
    }
  }, [showAddModal, data.categories]);

  const filterLabel = useMemo(() => {
    if (filterType === 'Daily') return `Daily (${selectedDate})`;
    if (filterType === 'Monthly') return `Monthly (${selectedMonth})`;
    if (filterType === 'Annual') return `Annual (${selectedYear})`;
    if (filterType === 'Custom') return `Custom (${startDate} to ${endDate})`;
    return 'All Time';
  }, [filterType, selectedDate, selectedMonth, selectedYear, startDate, endDate]);

  // Convert an ISO Date String into a local Date String of form YYYY-MM-DD
  const getLocalDateString = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const range = useMemo(() => {
    let start = '';
    let end = '';
    if (filterType === 'Daily' && selectedDate) {
      start = selectedDate;
      end = selectedDate;
    } else if (filterType === 'Monthly' && selectedMonth) {
      const [y, m] = selectedMonth.split('-').map(Number);
      const daysInMonth = new Date(y, m, 0).getDate();
      start = `${y}-${String(m).padStart(2, '0')}-01`;
      end = `${y}-${String(m).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
    } else if (filterType === 'Annual' && selectedYear) {
      const y = Number(selectedYear);
      start = `${y}-01-01`;
      end = `${y}-12-31`;
    } else if (filterType === 'Custom' && startDate && endDate) {
      start = startDate;
      end = endDate;
    } else {
      start = '1970-01-01';
      end = '9999-12-31';
    }
    return { start, end };
  }, [filterType, selectedDate, selectedMonth, selectedYear, startDate, endDate]);

  const filteredReminders = useMemo(() => {
    let result = data.reminders ? [...data.reminders] : [];

    // Filter by dates:
    // 1. Must be created on or before the end of the selected period: dCreate <= range.end
    // 2. If completed, it must not be completed before the start of the selected period: !dComplete || dComplete >= range.start
    result = result.filter(reminder => {
      const dCreate = getLocalDateString(reminder.createdAt);
      const dComplete = reminder.completedAt ? getLocalDateString(reminder.completedAt) : '';

      const isCreatedBeforeEnd = dCreate <= range.end;
      const isNotCompletedBeforeStart = !dComplete || dComplete >= range.start;

      return isCreatedBeforeEnd && isNotCompletedBeforeStart;
    });

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        (r.itemName && r.itemName.toLowerCase().includes(q)) ||
        (r.category && r.category.toLowerCase().includes(q)) ||
        (r.remarks && r.remarks.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortBy === 'latest') {
      result.sort((a, b) => {
        if (a.status === 'pending' && b.status === 'completed') return -1;
        if (a.status === 'completed' && b.status === 'pending') return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => {
        if (a.status === 'pending' && b.status === 'completed') return -1;
        if (a.status === 'completed' && b.status === 'pending') return 1;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
    } else if (sortBy === 'pending-first') {
      result.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    } else if (sortBy === 'completed-first') {
      result.sort((a, b) => {
        if (a.status === 'completed' && b.status !== 'completed') return -1;
        if (a.status !== 'completed' && b.status === 'completed') return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    }

    return result;
  }, [data.reminders, range, searchQuery, sortBy, statusFilter]);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const finalCategory = addForm.category === '__other__' ? addForm.customCategory : addForm.category;

    const newReminder = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      itemName: addForm.itemName,
      category: finalCategory || 'Uncategorized',
      qty: addForm.qty ? Number(addForm.qty) : 1,
      remarks: addForm.remarks,
      status: 'pending'
    };

    saveData({
      ...data,
      reminders: [newReminder, ...(data.reminders || [])]
    });

    setShowAddModal(false);
  };

  const markAsReceived = async (id) => {
    if (await confirm("Mark this item as received / completed?")) {
      const updatedReminders = (data.reminders || []).map(r => {
        if (r.id === id) {
          return {
            ...r,
            status: 'completed',
            completedAt: new Date().toISOString()
          };
        }
        return r;
      });

      saveData({
        ...data,
        reminders: updatedReminders
      });
    }
  };

  const deleteReminder = async (id) => {
    if (await confirm("Delete this reminder permanently?")) {
      saveData({
        ...data,
        reminders: (data.reminders || []).filter(r => r.id !== id)
      });
    }
  };

  return (
    <>
      <div className={`h-full flex flex-col p-6 print-content ${showPrintPreview ? 'print-hidden' : ''}`}>
        <div className="flex justify-between items-center mb-6 print-hidden">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Stock Reminders</h1>
            <p className="text-gray-500">Track and manage reminders for stock items currently unavailable</p>
          </div>
          <div className="flex gap-3 items-center">
            {/* Time Filter Controls */}
            <div className="flex gap-2 items-center">
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white font-medium text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
              >
                <option value="Daily">Daily</option>
                <option value="Monthly">Monthly</option>
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

              {(filterType !== 'Daily' || selectedDate !== todayYMD) && (
                <button
                  onClick={() => {
                    setFilterType('Daily');
                    setSelectedDate(todayYMD);
                  }}
                  className="text-gray-400 hover:text-red-500 hover:bg-gray-100 p-0.5 rounded-full transition ml-1"
                  title="Reset to today"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Add Reminder
            </button>
            <button
              onClick={() => setShowPrintPreview(true)}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        {/* Search and Sort Filter Row */}
        <div className="flex gap-4 mb-4 print-hidden">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search reminders by item name, category, or remarks..."
              className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-300 rounded-lg px-4 py-2 bg-white text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="completed">Received</option>
            <option value="pending">Pending</option>
          </select>
          <select
            className="border border-gray-300 rounded-lg px-4 py-2 bg-white text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
            <option value="pending-first">Pending First</option>
            <option value="completed-first">Completed First</option>
          </select>
        </div>

        {/* Reminders List Table */}
        <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-gray-200">
          <table className="w-full text-left border-collapse print-table">
            <thead className="bg-slate-900 text-white sticky top-0 print-header text-sm uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 border-r border-slate-700 font-semibold text-center w-12">#</th>
                <th className="py-2.5 px-3 border-r border-slate-700 font-semibold w-36">Date Added</th>
                <th className="py-2.5 px-3 border-r border-slate-700 font-semibold">Item Name</th>
                <th className="py-2.5 px-3 border-r border-slate-700 font-semibold w-40">Category</th>
                <th className="py-2.5 px-3 border-r border-slate-700 font-semibold text-center w-24">Quantity</th>
                <th className="py-2.5 px-3 border-r border-slate-700 font-semibold w-32">Status</th>
                <th className="py-2.5 px-3 border-r border-slate-700 font-semibold w-40">Date Received</th>
                <th className="py-2.5 px-3 border-r border-slate-700 font-semibold">Remarks</th>
                <th className="py-2.5 px-3 print-hidden w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReminders.map((reminder, index) => (
                <tr key={reminder.id} className="hover:bg-slate-50 border-b border-gray-200 group">
                  <td className="py-2.5 px-3 border-r border-gray-200 text-center font-bold text-gray-500 text-xs">
                    {index + 1}
                  </td>
                  <td className="py-2.5 px-3 border-r border-gray-200 text-sm text-gray-600">
                    {new Date(reminder.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="py-2.5 px-3 border-r border-gray-200 font-medium text-gray-900">
                    {reminder.itemName}
                  </td>
                  <td className="py-2.5 px-3 border-r border-gray-200 text-sm text-gray-600">
                    {reminder.category}
                  </td>
                  <td className="py-2.5 px-3 border-r border-gray-200 text-center font-semibold text-gray-800">
                    {reminder.qty}
                  </td>
                  <td className="py-2.5 px-3 border-r border-gray-200 text-sm">
                    {reminder.status === 'pending' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                        Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        Received
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 border-r border-gray-200 text-sm text-gray-600">
                    {reminder.completedAt ? (
                      new Date(reminder.completedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                    ) : (
                      <span className="text-gray-400 italic">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 border-r border-gray-200 text-sm text-gray-500">
                    {reminder.remarks || <span className="text-gray-300 italic">—</span>}
                  </td>
                  <td className="py-2.5 px-3 text-center print-hidden flex items-center justify-center gap-2">
                    {reminder.status === 'pending' && (
                      <button
                        onClick={() => markAsReceived(reminder.id)}
                        className="text-green-600 hover:text-green-800 hover:bg-green-50 p-1 rounded transition"
                        title="Mark as Received"
                      >
                        <Check className="w-4.5 h-4.5" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteReminder(reminder.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition"
                      title="Delete Reminder"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredReminders.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500 font-medium">
                    No reminders found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print-hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" /> Add Stock Reminder
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  value={addForm.itemName}
                  onChange={e => setAddForm({ ...addForm, itemName: e.target.value })}
                  required
                  placeholder="e.g. Dawlance Refrigerator 9193"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium cursor-pointer"
                  value={addForm.category}
                  onChange={e => setAddForm({ ...addForm, category: e.target.value })}
                >
                  {data.categories?.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__other__">Other (Enter Custom Category)</option>
                </select>
              </div>

              {addForm.category === '__other__' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Custom Category Name *</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                    value={addForm.customCategory}
                    onChange={e => setAddForm({ ...addForm, customCategory: e.target.value })}
                    required
                    placeholder="e.g. Smart LED TVs"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity Needed</label>
                <input
                  type="number"
                  min="1"
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  value={addForm.qty}
                  onChange={e => setAddForm({ ...addForm, qty: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Remarks (Optional)</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium resize-none"
                  rows="3"
                  value={addForm.remarks}
                  onChange={e => setAddForm({ ...addForm, remarks: e.target.value })}
                  placeholder="e.g. Customer advance booking / Mr. Kamran"
                />
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-600 hover:bg-gray-50 text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition shadow-sm"
                >
                  Save Reminder
                </button>
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
              <h2 className="text-lg font-bold">Print Preview - Stock Reminders ({filterLabel})</h2>
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
                    <p className="text-sm font-semibold text-gray-600">Stock Reminders Report ({filterLabel})</p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>Date: {new Date().toLocaleDateString()}</p>
                    <p>Total Records: {filteredReminders.length}</p>
                  </div>
                </div>

                <table className="w-full text-left text-xs border-collapse border border-gray-300 mb-6">
                  <thead>
                    <tr className="bg-slate-800 text-white border-b border-gray-300">
                      <th className="py-2 px-2 border-r border-slate-700 text-center w-8">#</th>
                      <th className="py-2 px-2 border-r border-slate-700">Date Added</th>
                      <th className="py-2 px-2 border-r border-slate-700">Item Name</th>
                      <th className="py-2 px-2 border-r border-slate-700">Category</th>
                      <th className="py-2 px-2 border-r border-slate-700 text-center w-16">Quantity</th>
                      <th className="py-2 px-2 border-r border-slate-700">Status</th>
                      <th className="py-2 px-2 border-r border-slate-700">Date Received</th>
                      <th className="py-2 px-2">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReminders.map((reminder, i) => (
                      <tr key={reminder.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50 border-b border-gray-200'}>
                        <td className="py-1 px-1.5 border-r border-gray-200 text-center font-semibold text-gray-500">{i + 1}</td>
                        <td className="py-1 px-1.5 border-r border-gray-200">{new Date(reminder.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td className="py-1 px-1.5 border-r border-gray-200 font-medium">{reminder.itemName}</td>
                        <td className="py-1 px-1.5 border-r border-gray-200">{reminder.category}</td>
                        <td className="py-1 px-1.5 border-r border-gray-200 text-center font-semibold">{reminder.qty}</td>
                        <td className="py-1 px-1.5 border-r border-gray-200 text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${reminder.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                            {reminder.status === 'pending' ? 'Pending' : 'Received'}
                          </span>
                        </td>
                        <td className="py-1 px-1.5 border-r border-gray-200">
                          {reminder.completedAt ? (
                            new Date(reminder.completedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                          ) : (
                            <span className="text-gray-400 italic">—</span>
                          )}
                        </td>
                        <td className="py-1 px-1.5 text-gray-600">{reminder.remarks || <span className="text-gray-300 italic">—</span>}</td>
                      </tr>
                    ))}
                    {filteredReminders.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-4 text-center text-gray-500 font-medium">
                          No reminders found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t-2 border-slate-900 pt-4 mt-6 text-center text-[10px] text-gray-400">
                Dubai Electronics Stock Management System
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
