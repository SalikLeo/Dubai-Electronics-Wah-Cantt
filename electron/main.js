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

// Default App Data Structure for a Single Branch
const DEFAULT_BRANCH_DATA = {
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

// Initial Multi-Branch Database Structure
// Initial Multi-Branch Database Structure
const DEFAULT_DB_DATA = {
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

// Data Storage Logic
const dataPath = path.join(app.getPath('userData'), 'database.json');

ipcMain.handle('get-data', () => {
  try {
    if (!fs.existsSync(dataPath)) {
      fs.writeFileSync(dataPath, JSON.stringify(DEFAULT_DB_DATA, null, 2));
      return DEFAULT_DB_DATA;
    }
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const parsedData = JSON.parse(rawData);

    // Migration Check: If data contains stock/sales/expenses at the root, it's the old single-branch format.
    if (parsedData.stock !== undefined || parsedData.sales !== undefined || parsedData.expenses !== undefined) {
      console.log('Migrating single-branch database.json to multi-branch schema...');
      
      // Ensure the migrated Wah Cantt branch settings have default address/phone if not set
      const migratedWahCanttSettings = {
        appIcon: parsedData.settings?.appIcon || null,
        password: parsedData.settings?.password || "",
        branchAddress: parsedData.settings?.branchAddress || "Al-Noor Shopping Mall, Bahatar Morr Main G.T Road, Wah Cantt",
        branchPhone: parsedData.settings?.branchPhone || "051-4916830"
      };

      const migratedDb = {
        activeBranch: "Wah Cantt",
        branches: {
          "Wah Cantt": {
            ...parsedData,
            settings: migratedWahCanttSettings
          },
          "Pindi Gheb": JSON.parse(JSON.stringify(DEFAULT_BRANCH_DATA)),
          "Fateh Jung": JSON.parse(JSON.stringify(DEFAULT_BRANCH_DATA))
        }
      };

      fs.writeFileSync(dataPath, JSON.stringify(migratedDb, null, 2));
      return migratedDb;
    }

    // Migration Rename: Rename branches "Islamabad" -> "Pindi Gheb" and "Karachi" -> "Fateh Jung" if they exist
    let needsMigrationRename = false;
    if (parsedData.branches) {
      if (parsedData.branches["Islamabad"]) {
        parsedData.branches["Pindi Gheb"] = parsedData.branches["Islamabad"];
        delete parsedData.branches["Islamabad"];
        needsMigrationRename = true;
      }
      if (parsedData.branches["Karachi"]) {
        parsedData.branches["Fateh Jung"] = parsedData.branches["Karachi"];
        delete parsedData.branches["Karachi"];
        needsMigrationRename = true;
      }
    }
    if (parsedData.activeBranch === "Islamabad") {
      parsedData.activeBranch = "Pindi Gheb";
      needsMigrationRename = true;
    }
    if (parsedData.activeBranch === "Karachi") {
      parsedData.activeBranch = "Fateh Jung";
      needsMigrationRename = true;
    }
    if (needsMigrationRename) {
      console.log('Renaming Islamabad and Karachi branches to Pindi Gheb and Fateh Jung in database.json...');
      fs.writeFileSync(dataPath, JSON.stringify(parsedData, null, 2));
    }

    // Ensure forward compatibility: make sure all branches and activeBranch exist in the loaded JSON
    let needsSave = false;
    if (!parsedData.branches) {
      parsedData.branches = {};
      needsSave = true;
    }
    if (!parsedData.activeBranch) {
      parsedData.activeBranch = "Wah Cantt";
      needsSave = true;
    }

    for (const b of ["Wah Cantt", "Pindi Gheb", "Fateh Jung"]) {
      if (!parsedData.branches[b]) {
        parsedData.branches[b] = JSON.parse(JSON.stringify(DEFAULT_BRANCH_DATA));
        if (b === "Wah Cantt") {
          parsedData.branches[b].settings.branchAddress = "Al-Noor Shopping Mall, Bahatar Morr Main G.T Road, Wah Cantt";
          parsedData.branches[b].settings.branchPhone = "051-4916830";
        }
        needsSave = true;
      }
    }

    if (needsSave) {
      fs.writeFileSync(dataPath, JSON.stringify(parsedData, null, 2));
    }

    return parsedData;
  } catch (error) {
    console.error('Failed to read data', error);
    return DEFAULT_DB_DATA;
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
