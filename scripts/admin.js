const { exec } = require('child_process')

const url = 'http://localhost:3000/admin'
const cmd =
  process.platform === 'win32' ? `start ${url}` :
  process.platform === 'darwin' ? `open ${url}` :
  `xdg-open ${url}`

exec(cmd)
console.log(`→ Opening ${url}`)
