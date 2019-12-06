const { app, BrowserWindow, ipcMain, dialog } = require('electron')

// Keep a global reference of the window object, to prevent close on GC
let win

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
    icon: __dirname + '/public/icons/png/icon.png'
  })

  win.loadFile('index.html')

  // Open the DevTools.
  // TODO dev only
  // win.webContents.openDevTools()

  win.on('closed', () => {
    win = null
  })

  // create add todo window
  ipcMain.on('pick-file', () => {
    const options = {
      title: 'Choose a file',
      buttonLabel: 'Select',
      filters: [{ extensions: ['xlsx', 'csv', 'xls'] }]
    }

    const selectedPaths = dialog.showOpenDialog(null, options, filePaths => {
      event.sender.send('open-dialog-paths-selected', filePaths)
    })
    console.log(selectedPaths)
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
