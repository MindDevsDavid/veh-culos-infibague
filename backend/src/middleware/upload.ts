import multer from 'multer'
import path from 'path'
import fs from 'fs'

function makeStorage(subfolder: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(process.env.UPLOADS_BASE_PATH ?? './uploads', subfolder)
      fs.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname)
      const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`
      cb(null, name)
    },
  })
}

export const uploadPdf = multer({
  storage: makeStorage('cumplimientos'),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true)
    else cb(new Error('Solo se permiten archivos PDF'))
  },
  limits: { fileSize: 10 * 1024 * 1024 },
})

export const uploadFotos = multer({
  storage: makeStorage('inspecciones'),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Solo se permiten imágenes'))
  },
  limits: { fileSize: 5 * 1024 * 1024 },
})

export const uploadFotosSalida = multer({
  storage: makeStorage('fotos_salida'),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Solo se permiten imágenes'))
  },
  limits: { fileSize: 5 * 1024 * 1024 },
})
