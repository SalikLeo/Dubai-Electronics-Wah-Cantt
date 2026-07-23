const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Disable hardware acceleration to eliminate startup stuttering, GPU process crashes, and window flickering
app.disableHardwareAcceleration();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    backgroundColor: '#0f172a',
    title: "Dubai Electronics Stock Manager",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  // Real-time live reload watcher for Electron window
  const distDir = path.join(__dirname, '../dist');
  let reloadTimeout = null;
  if (fs.existsSync(distDir)) {
    fs.watch(distDir, (eventType, filename) => {
      if (filename === 'bundle.js' || filename === 'styles.css') {
        if (reloadTimeout) clearTimeout(reloadTimeout);
        reloadTimeout = setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.reload();
          }
        }, 25);
      }
    });
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Default App Data Structure
const DEFAULT_DATA = {
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

// Data Storage Logic
const dataPath = path.join(app.getPath('userData'), 'database.json');

ipcMain.handle('get-data', () => {
  try {
    if (!fs.existsSync(dataPath)) {
      fs.writeFileSync(dataPath, JSON.stringify(DEFAULT_DATA, null, 2));
      return DEFAULT_DATA;
    }
    const rawData = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Failed to read data', error);
    return DEFAULT_DATA;
  }
});

ipcMain.handle('save-data', (event, data) => {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Failed to save data', error);
    return { success: false, error: error.message };
  }
});
