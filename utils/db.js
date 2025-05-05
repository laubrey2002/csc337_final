const fs = require('fs')
const path = require('path')

function read(file) {
  const filePath = path.join(__dirname, '..', 'data', file)
  if (!fs.existsSync(filePath)) return []
  return JSON.parse(fs.readFileSync(filePath))
}

function write(file, data) {
  const filePath = path.join(__dirname, '..', 'data', file)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

module.exports = { read, write }
