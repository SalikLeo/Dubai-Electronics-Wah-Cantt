import React, { createContext, useContext, useState, useCallback } from 'react';

const DialogContext = createContext();

export function useDialog() {
  return useContext(DialogContext);
}

export function DialogProvider({ children }) {
  const [dialogs, setDialogs] = useState([]);

  const showDialog = useCallback((message, isConfirm = false) => {
    return new Promise((resolve) => {
      const id = Date.now().toString() + Math.random().toString();
      setDialogs(prev => [...prev, { id, message, isConfirm, resolve }]);
    });
  }, []);

  const confirm = useCallback((message) => showDialog(message, true), [showDialog]);
  const alert = useCallback((message) => showDialog(message, false), [showDialog]);

  const handleClose = (id, result) => {
    setDialogs(prev => {
      const dialog = prev.find(d => d.id === id);
      if (dialog) dialog.resolve(result);
      return prev.filter(d => d.id !== id);
    });
  };

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      {dialogs.map(dialog => (
        <div key={dialog.id} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <p className="text-gray-800 text-[15px] font-medium whitespace-pre-wrap">{dialog.message}</p>
            </div>
            <div className="bg-gray-50 p-4 flex gap-3 justify-end border-t border-gray-100">
              {dialog.isConfirm ? (
                <>
                  <button 
                    onClick={() => handleClose(dialog.id, false)}
                    className="px-5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleClose(dialog.id, true)}
                    className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Confirm
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => handleClose(dialog.id, true)}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </DialogContext.Provider>
  );
}
