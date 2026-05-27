const path = require('path')

const backendRoot = path.join(__dirname, '..')
const uploadsDir = process.env.UPLOADS_DIR
  ? path.resolve(backendRoot, process.env.UPLOADS_DIR)
  : path.join(backendRoot, 'uploads')

module.exports = {
  uploadsDir
}
