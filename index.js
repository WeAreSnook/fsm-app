const { ipcRenderer } = require('electron')

document.getElementById('pickFile').addEventListener('click', () => {
  ipcRenderer.send('pick-file')
})
