const { ipcRenderer } = require('electron')
const { Application, Controller } = require('stimulus')
const application = Application.start()

// Picker handler
application.register(
  'picker',
  class extends Controller {
    static targets = ['hint']

    connect() {
      ipcRenderer.on(`picked-${this.name}`, this.handlePickResult)
    }

    pickFile(event) {
      ipcRenderer.send('openFile', this.name)
    }

    pickFolder(event) {
      ipcRenderer.send('openFolder', this.name)
    }

    get name() {
      return this.data.get('name')
    }

    handlePickResult = (event, fileName) => {
      this.hintTarget.innerText = fileName
    }
  }
)

// Run button handling
const runButton = document.getElementById('run')

runButton.addEventListener('click', () => {
  ipcRenderer.send('generate')
})

// Loading
const getLoader = () => document.querySelector('.loader')

function isLoading() {
  return !getLoader().classList.contains('hide')
}

ipcRenderer.on('hide-loading', () => {
  if (!isLoading()) {
    return
  }

  getLoader().classList.add('hide')
  runButton.innerHTML = runButton.innerHTML.replace(
    'Generating Report...',
    'Generate Report'
  )
})

ipcRenderer.on('show-loading', () => {
  runButton.innerHTML = runButton.innerHTML.replace(
    'Generate Report',
    'Generating Report...'
  )
  getLoader().classList.remove('hide')
})
