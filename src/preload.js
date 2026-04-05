const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('faahh', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  getStats: () => ipcRenderer.invoke('get-stats'),
  triggerTestRoast: () => ipcRenderer.invoke('trigger-test-roast'),
  pickSoundFile: () => ipcRenderer.invoke('pick-sound-file'),
  resetStats: () => ipcRenderer.invoke('reset-stats'),
});
