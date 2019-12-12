const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const { exec } = require('child_process')
const path = require('path')

// Keep a global reference of the window object, to prevent close on GC
let win

function createWindow() {
  win = new BrowserWindow({
    width: 475,
    height: 800,
    webPreferences: {
      nodeIntegration: true
    },
    icon: __dirname + '/public/icons/png/icon.png'
  })

  let outputDir = '/'
  const paths = {
    output: null,
    benefitExtract: null,
    dependents: null,
    universalCredit: null,
    awards: null,
    schoolRoll: null,
    consent: null,
    filter: null,
    benefitAmount: 610.0,
    rollover: false
  }

  win.loadFile('index.html')

  // Open the DevTools.
  // TODO dev only
  win.webContents.openDevTools()

  win.on('closed', () => {
    win = null
  })

  ipcMain.on('openFile', (event, name) => {
    const options = {
      title: 'Pick a File',
      buttonLabel: 'Select',
      filters: [{ extensions: ['xlsx', 'csv', 'xls'] }]
    }

    dialog
      .showOpenDialog(win, options, files => {
        resolve(files ? files[0] : undefined)
      })
      .then(file => {
        if (file == null || file.filePaths.length === 0) {
          return
        }

        const filePath = file.filePaths[0]
        const fileName = path.basename(filePath)
        paths[name] = filePath
        event.reply(`picked-${name}`, fileName)
      })
  })

  ipcMain.on('openFolder', (event, name) => {
    const options = {
      title: 'Pick a Folder',
      buttonLabel: 'Select',
      properties: ['openDirectory']
    }

    dialog
      .showOpenDialog(win, options, files => {
        resolve(files ? files[0] : undefined)
      })
      .then(file => {
        if (file == null || file.filePaths.length === 0) {
          return
        }

        const filePath = file.filePaths[0]
        const dirName = path.basename(path.dirname(filePath))
        paths[name] = filePath
        event.reply(`picked-${name}`, dirName)
      })
  })

  ipcMain.on('generate', event => {
    // TODO validate no options are null
    const options = {
      type: 'info',
      title: 'Generating Report',
      buttonLabel: 'Ok'
    }
    dialog.showMessageBox(win, options)

    // TODO .exe on windows
    const paths = {
      output: null,
      benefitExtract: null,
      dependents: null,
      universalCredit: null,
      awards: null,
      schoolRoll: null,
      consent: null,
      filter: null,
      benefitAmount: 610.0,
      rollover: false
    }
    const command = `./fsm-processor --output=${paths.output} --awards=${paths.awards}  --benefitextract=${paths.benefitExtract} --dependents=${paths.dependents} --universalcredit=${paths.universalCredit} --awards=${paths.awards} --schoolroll=${paths.schoolRoll} --consent=${paths.consent} --filter=${paths.filter} --benefitamount=${paths.benefitAmount} --rollover=${paths.rollover}`

    exec(command, (err, stdout, stderr) => {
      console.log(err, stdout, stderr)
    })
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
