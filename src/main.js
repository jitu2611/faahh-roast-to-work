const { app, BrowserWindow, Tray, Menu, ipcMain, powerMonitor, shell, nativeImage, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');
const RoastEngine = require('./roast-engine');
const SoundPlayer = require('./sound-player');
const StatsTracker = require('./stats-tracker');

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

const store = new Store({
  defaults: {
    idleThreshold: 5,        // minutes before roasting
    apiKey: '',
    soundEnabled: true,
    customSoundPath: '',
    roastMode: 'brutal',     // brutal | gentle | motivational
    autoStart: false,
    streak: 0,
    lastFocusDate: null,
    totalRoasts: 0,
    dailyStats: {},
  }
});

let tray = null;
let settingsWindow = null;
let statsWindow = null;
let roastEngine = null;
let soundPlayer = null;
let statsTracker = null;
let idleCheckInterval = null;
let isIdle = false;
let appReady = false;

// ─── App Lifecycle ────────────────────────────────────────────────────────────
app.on('ready', () => {
  appReady = true;
  createTray();
  initServices();
  startIdleMonitor();

  // Hide dock icon on macOS
  if (process.platform === 'darwin') {
    app.dock.hide();
  }
});

app.on('window-all-closed', (e) => {
  // Keep app running in tray
  e.preventDefault();
});

app.on('before-quit', () => {
  stopIdleMonitor();
});

// ─── Tray ─────────────────────────────────────────────────────────────────────
function createTray() {
  const iconPath = path.join(__dirname, '..', 'assets', 'tray-icon.png');
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) {
      trayIcon = nativeImage.createFromDataURL(getFallbackIconDataURL());
    }
  } catch {
    trayIcon = nativeImage.createFromDataURL(getFallbackIconDataURL());
  }

  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));
  tray.setToolTip('Faahh - Back to work!');
  updateTrayMenu();
}

function updateTrayMenu(status = 'watching') {
  const streak = store.get('streak', 0);
  const totalRoasts = store.get('totalRoasts', 0);
  const threshold = store.get('idleThreshold', 5);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '🔥 Faahh - Roast to Work',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: `Status: ${status === 'idle' ? '😴 Idle — Roasting inbound!' : '✅ You\'re working, good.'}`,
      enabled: false,
    },
    {
      label: `🔥 Streak: ${streak} day${streak !== 1 ? 's' : ''}`,
      enabled: false,
    },
    {
      label: `💀 Total Roasts Received: ${totalRoasts}`,
      enabled: false,
    },
    { type: 'separator' },
    {
      label: '📊 View Stats',
      click: openStatsWindow,
    },
    {
      label: '⚙️ Settings',
      click: openSettingsWindow,
    },
    { type: 'separator' },
    {
      label: '🚪 Quit Faahh',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

// ─── Services ─────────────────────────────────────────────────────────────────
function initServices() {
  const apiKey = store.get('apiKey', '');
  roastEngine = new RoastEngine(apiKey, store.get('roastMode', 'brutal'));
  soundPlayer = new SoundPlayer(store.get('customSoundPath', ''));
  statsTracker = new StatsTracker(store);
}

// ─── Idle Monitor ─────────────────────────────────────────────────────────────
function startIdleMonitor() {
  stopIdleMonitor();

  idleCheckInterval = setInterval(() => {
    const idleSeconds = powerMonitor.getSystemIdleTime();
    const idleThresholdSeconds = store.get('idleThreshold', 5) * 60;

    if (idleSeconds >= idleThresholdSeconds && !isIdle) {
      isIdle = true;
      onUserWentIdle();
    } else if (idleSeconds < 30 && isIdle) {
      isIdle = false;
      onUserCameBack();
    }
  }, 5000); // check every 5 seconds
}

function stopIdleMonitor() {
  if (idleCheckInterval) {
    clearInterval(idleCheckInterval);
    idleCheckInterval = null;
  }
}

async function onUserWentIdle() {
  console.log('[Faahh] User went idle — firing roast!');
  updateTrayMenu('idle');

  // Play sound
  if (store.get('soundEnabled', true)) {
    soundPlayer.play();
  }

  // Generate and show AI roast
  const apiKey = store.get('apiKey', '');
  if (apiKey) {
    try {
      const roastText = await roastEngine.generateRoast({
        idleMinutes: store.get('idleThreshold', 5),
        mode: store.get('roastMode', 'brutal'),
      });
      showRoastNotification(roastText);
    } catch (err) {
      console.error('[Faahh] Roast generation failed:', err.message);
      showRoastNotification(getOfflineRoast());
    }
  } else {
    showRoastNotification(getOfflineRoast());
  }

  statsTracker.recordRoast();
  store.set('totalRoasts', (store.get('totalRoasts', 0)) + 1);
}

function onUserCameBack() {
  console.log('[Faahh] User is back! Updating streak.');
  updateTrayMenu('working');
  statsTracker.recordFocusReturn();
}

function showRoastNotification(message) {
  const notifier = require('node-notifier');
  notifier.notify({
    title: '🔥 FAAHH! Get back to work!',
    message,
    icon: path.join(__dirname, '..', 'assets', 'tray-icon.png'),
    sound: false,
    timeout: 10,
  });
}

function getOfflineRoast() {
  const roasts = [
    "You've been idle so long, your keyboard filed a missing persons report.",
    "Back to work! Your tasks aren't going to do themselves... or are you waiting for that?",
    "Even your coffee is embarrassed by how long you've been sitting there.",
    "NASA could land on Mars in the time you've been idle.",
    "Your productivity just left the building. Please escort it back.",
    "You call this a work session? My screensaver works harder than you.",
    "Breaking: Local person mistaken for furniture after extended work avoidance.",
    "Your deadline called. It said it misses you. Sadly, you won't miss it.",
  ];
  return roasts[Math.floor(Math.random() * roasts.length)];
}

// ─── Windows ──────────────────────────────────────────────────────────────────
function openSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 480,
    height: 620,
    resizable: false,
    title: 'Faahh — Settings',
    icon: path.join(__dirname, '..', 'assets', 'tray-icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  settingsWindow.loadFile(path.join(__dirname, '..', 'renderer', 'settings', 'index.html'));
  settingsWindow.setMenuBarVisibility(false);

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function openStatsWindow() {
  if (statsWindow) {
    statsWindow.focus();
    return;
  }

  statsWindow = new BrowserWindow({
    width: 520,
    height: 560,
    resizable: false,
    title: 'Faahh — Stats',
    icon: path.join(__dirname, '..', 'assets', 'tray-icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  statsWindow.loadFile(path.join(__dirname, '..', 'renderer', 'stats', 'index.html'));
  statsWindow.setMenuBarVisibility(false);

  statsWindow.on('closed', () => {
    statsWindow = null;
  });
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────
ipcMain.handle('get-settings', () => {
  return {
    idleThreshold: store.get('idleThreshold', 5),
    apiKey: store.get('apiKey', ''),
    soundEnabled: store.get('soundEnabled', true),
    customSoundPath: store.get('customSoundPath', ''),
    roastMode: store.get('roastMode', 'brutal'),
    autoStart: store.get('autoStart', false),
  };
});

ipcMain.handle('save-settings', (event, settings) => {
  store.set('idleThreshold', settings.idleThreshold);
  store.set('apiKey', settings.apiKey);
  store.set('soundEnabled', settings.soundEnabled);
  store.set('customSoundPath', settings.customSoundPath);
  store.set('roastMode', settings.roastMode);
  store.set('autoStart', settings.autoStart);

  // Update services with new settings
  if (roastEngine) roastEngine.updateConfig(settings.apiKey, settings.roastMode);
  if (soundPlayer) soundPlayer.setCustomSound(settings.customSoundPath);

  // Restart idle monitor with new threshold
  startIdleMonitor();
  updateTrayMenu();

  // Auto-start toggle
  app.setLoginItemSettings({ openAtLogin: settings.autoStart });

  return { success: true };
});

ipcMain.handle('get-stats', () => {
  return {
    streak: store.get('streak', 0),
    totalRoasts: store.get('totalRoasts', 0),
    dailyStats: store.get('dailyStats', {}),
    lastFocusDate: store.get('lastFocusDate', null),
  };
});

ipcMain.handle('trigger-test-roast', async () => {
  await onUserWentIdle();
  return { success: true };
});

ipcMain.handle('pick-sound-file', async () => {
  const result = await dialog.showOpenDialog({
    filters: [{ name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'm4a'] }],
    properties: ['openFile'],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('reset-stats', () => {
  store.set('streak', 0);
  store.set('totalRoasts', 0);
  store.set('dailyStats', {});
  store.set('lastFocusDate', null);
  updateTrayMenu();
  return { success: true };
});

// ─── Fallback Icon ────────────────────────────────────────────────────────────
function getFallbackIconDataURL() {
  // 16x16 orange fire emoji-style PNG as base64
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFrSURBVDiNlZM9SgNBFMd/M5tNsiHZJCSCkFJEBBFBsLKwsLGysLW28ABewMrKI3gAD2Bh4QkstBIsLASxEAIBCWR3s7v5cIuZNWYTdnV+8N7j/d/Mm/cHRERFVVVRVYiIiKoiIqpKRESEiIiI5v0DInLBzCQiJoCJiGYA8DwP13UBqGkamqYBQAiBSqUCgJSSoigIIYQQwjAMAHRd57ouk8kkSqlBkiQpxhiz1loppeSce96Ue+4BqGmaCYAxxhhjTFVVJUmSNE1TVVVB13Wg67pVVdVSSimlFCGEEEIIIYQQQgghhBCR53lSSkkpJaWUlFJSSkkppZRSSiklpZRSSikkpZRSSgkhhBBCCCGEEEIIIYQQkYjIzIyIiIiIiIiIiIiIiIiI+N/fD0RE5JiZmZkREREREREREREREREREe//HBERmZmZmZkREREREREREREREREREf8Hb1BX3N3TisMAAAAASUVORK5CYII=';
}
