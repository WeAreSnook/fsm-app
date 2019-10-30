const { app, BrowserWindow } = require('electron')

// Keep a global reference of the window object, to prevent close on GC
let win

function createWindow () {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  win.loadFile('index.html')

  // Open the DevTools.
  // TODO dev only
  win.webContents.openDevTools()

  win.on('closed', () => {
    win = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  // Keep the app open when windows are closed on macOS
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // Recreate window when dock icon is pressed on macOS
  if (win === null) {
    createWindow()
  }
})