const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  dialog,
  globalShortcut
} = require('electron')
const { exec } = require('child_process')
const path = require('path')

const isWindows = process.platform === 'win32'
const executableFileName = isWindows
  ? path.join(__dirname, 'fsm-processor.exe')
  : './fsm-processor'

// Keep a global reference of the window object, to prevent close on GC
let win

let isExecuting = false
function setLoading(loading) {
  isExecuting = loading
  const eventName = loading ? 'show-loading' : 'hide-loading'
  win.webContents.send(eventName)
}

function createWindow() {
  win = new BrowserWindow({
    width: 875,
    height: 700,
    webPreferences: {
      nodeIntegration: true
    },
    icon: __dirname + '/public/icons/png/icon.png',
    resizable: false
  })

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
    ctcFigure: 16105.0,
    ctcWtcFigure: 6420.0,
    rollover: false,
    awardCG: true
  }

  function hasValidInputs() {
    return (
      paths.output != null &&
      paths.benefitExtract != null &&
      paths.dependents != null &&
      paths.universalCredit != null &&
      paths.awards != null &&
      paths.schoolRoll != null &&
      paths.consent != null &&
      paths.filter != null
    )
  }

  win.loadFile('index.html')

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
        const dirName = path.basename(filePath)
        paths[name] = filePath
        event.reply(`picked-${name}`, dirName)
      })
  })

  ipcMain.on('updateValue', (event, name, value) => {
    paths[name] = value
  })

  ipcMain.on('generate', event => {
    if (isExecuting) {
      showError({
        title: 'Processing',
        message: 'Already processing, please wait until finished'
      })
      return
    }

    if (!hasValidInputs()) {
      showError({
        title: 'Missing inputs',
        message: 'Please select all input files and an output folder'
      })
      return
    }

    const command = `${executableFileName} --output="${paths.output}" --awards="${paths.awards}"  --benefitextract="${paths.benefitExtract}" --dependents="${paths.dependents}" --universalcredit="${paths.universalCredit}" --awards="${paths.awards}" --schoolroll="${paths.schoolRoll}" --consent="${paths.consent}" --filter="${paths.filter}" --benefitamount=${paths.benefitAmount} --ctcfigure=${paths.ctcFigure} --ctcwtcfigure=${paths.ctcWtcFigure} --rollover=${paths.rollover} --awardcg=${paths.awardCG}`

    setLoading(true)
    exec(command, (err, stdout, stderr) => {
      var result
      if (stdout != null) {
        try {
          result = JSON.parse(stdout)
        } catch (err) {
          result = null
        }
      }

      if (err != null || result == null) {
        const detail = result == null ? stderr : result.error

        showError({
          title: 'Error running',
          message: 'There was an error running the algorithm',
          detail
        })
        setLoading(false)
        return
      }

      if (!result.success) {
        showError({
          title: 'Error generating output',
          message: "The output couldn't be generated",
          result
        })
        setLoading(false)
        return
      }

      // Success!
      setLoading(false)

      const options = {
        type: 'info',
        title: 'Generated Report',
        message:
          'Open the chosen output location to view the reports. Open the reports in Excel.',
        buttons: ['Close', 'Open Output Folder'],
        cancelId: 0
      }

      if (result.log != null && result.log.length > 0) {
        options.buttons = [...options.buttons, 'View Log']
      }

      const successResult = dialog.showMessageBox(win, options)
      successResult.then(messageResult => {
        if (messageResult.response === 1) {
          // If they clicked the open output folder button
          shell.openItem(paths.output)
        } else if (messageResult.response === 2) {
          showError({ title: 'Log', message: 'Log data', detail: result.log })
        }
      })
    })
  })
}

app.on('ready', () => {
  createWindow()

  // Disable refreshing
  globalShortcut.register('CmdOrCtrl+R', () => {})
})

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

function showError(error) {
  const options = {
    type: 'error',
    title: error.title,
    message: error.message,
    buttons: ['Close'],
    cancelId: 0
  }

  const result = error.result
  if (result != null) {
    if (result.log != null && result.log.length > 0) {
      options.buttons = ['Close', 'View Log']
    }

    if (result.error != null) {
      options.detail = result.error
    }
  }

  if (error.detail != null) {
    options.detail = error.detail
  }

  dialog.showMessageBox(win, options).then(messageResult => {
    const showLog = messageResult.response === 1
    if (showLog) {
      showError({ title: 'Log', message: 'Log data', detail: result.log })
    }
  })
}
