import { Router, Request, Response } from 'express'
import { query, queryOne, run } from '../utils/db'
import { authenticate } from '../middleware/auth'
import { allowRoles } from '../middleware/roles'

const router = Router()
router.use(authenticate)

function catalogRoutes(
  r: Router,
  tabla: string,
  readRoles: string[],
  writeRoles: string[]
) {
  r.get('/', allowRoles(...readRoles), async (_req: Request, res: Response) => {
    const items = await query(`SELECT * FROM ${tabla} ORDER BY descripcion ASC`)
    res.json(items)
  })

  r.post('/', allowRoles(...writeRoles), async (req: Request, res: Response) => {
    const { descripcion } = req.body
    if (!descripcion) { res.status(400).json({ error: 'descripcion requerida' }); return }
    try {
      const result = await run(`INSERT INTO ${tabla} (descripcion, modifica_u) VALUES (?, ?)`, [descripcion, req.user!.email])
      const item = await queryOne(`SELECT * FROM ${tabla} WHERE id = ?`, [result.insertId])
      res.status(201).json(item)
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ error: `"${descripcion}" ya existe en este catálogo` }); return
      }
      throw err
    }
  })

  r.put('/:id', allowRoles(...writeRoles), async (req: Request, res: Response) => {
    const { descripcion } = req.body
    try {
      await run(`UPDATE ${tabla} SET descripcion=?, modifica_u=? WHERE id=?`, [descripcion, req.user!.email, req.params.id])
      const item = await queryOne(`SELECT * FROM ${tabla} WHERE id = ?`, [req.params.id])
      res.json(item)
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ error: `"${descripcion}" ya existe en este catálogo` }); return
      }
      throw err
    }
  })

  r.delete('/:id', allowRoles(...writeRoles), async (req: Request, res: Response) => {
    await run(`DELETE FROM ${tabla} WHERE id = ?`, [req.params.id])
    res.json({ ok: true })
  })
}

const marcas = Router()
catalogRoutes(marcas, 'ctv_marcas', ['ADMIN', 'AUTORIZADOR', 'CONDUCTOR'], ['ADMIN'])
router.use('/marcas', marcas)

const colores = Router()
catalogRoutes(colores, 'ctv_color', ['ADMIN', 'AUTORIZADOR', 'CONDUCTOR'], ['ADMIN'])
router.use('/colores', colores)

const tiposVehiculo = Router()
catalogRoutes(tiposVehiculo, 'ctv_tipo_vehiculos', ['ADMIN', 'AUTORIZADOR', 'CONDUCTOR'], ['ADMIN'])
router.use('/tipos-vehiculo', tiposVehiculo)

const tiposRequisito = Router()
catalogRoutes(tiposRequisito, 'ctv_tipos_requisito', ['ADMIN', 'AUTORIZADOR'], ['ADMIN'])
router.use('/tipos-requisito', tiposRequisito)

const componentes = Router()
catalogRoutes(componentes, 'ctv_componentes', ['ADMIN', 'AUTORIZADOR'], ['ADMIN'])
router.use('/componentes', componentes)

const tiposComponente = Router()
router.use('/tipos-componente', tiposComponente)
tiposComponente.get('/', allowRoles('ADMIN', 'AUTORIZADOR'), async (_req, res) => {
  const items = await query('SELECT * FROM ctv_tipos_componente ORDER BY nombre_componente ASC')
  res.json(items)
})
tiposComponente.post('/', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  const { nombre_componente, descripcion_componente } = req.body
  if (!nombre_componente) { res.status(400).json({ error: 'nombre_componente requerido' }); return }
  try {
    const result = await run(
      'INSERT INTO ctv_tipos_componente (nombre_componente, descripcion_componente, modifica_u) VALUES (?, ?, ?)',
      [nombre_componente, descripcion_componente ?? null, req.user!.email],
    )
    const item = await queryOne('SELECT * FROM ctv_tipos_componente WHERE id = ?', [result.insertId])
    res.status(201).json(item)
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: `"${nombre_componente}" ya existe en este catálogo` }); return
    }
    throw err
  }
})
tiposComponente.put('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  const { nombre_componente, descripcion_componente } = req.body
  try {
    await run('UPDATE ctv_tipos_componente SET nombre_componente=?, descripcion_componente=?, modifica_u=? WHERE id=?',
      [nombre_componente, descripcion_componente ?? null, req.user!.email, req.params.id])
    const item = await queryOne('SELECT * FROM ctv_tipos_componente WHERE id = ?', [req.params.id])
    res.json(item)
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: `"${nombre_componente}" ya existe en este catálogo` }); return
    }
    throw err
  }
})
tiposComponente.delete('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  await run('DELETE FROM ctv_tipos_componente WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

const dependencias = Router()
router.use('/dependencias', dependencias)
dependencias.get('/', allowRoles('ADMIN', 'AUTORIZADOR', 'CONDUCTOR', 'VIGILANTE'), async (_req, res) => {
  const items = await query('SELECT * FROM ctv_dependencias ORDER BY descripcion ASC')
  res.json(items)
})
dependencias.post('/', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  const { descripcion, id_dependencia_ig } = req.body
  try {
    const result = await run(
      'INSERT INTO ctv_dependencias (descripcion, id_dependencia_ig, modifica_u) VALUES (?, ?, ?)',
      [descripcion, id_dependencia_ig ?? null, req.user!.email],
    )
    const item = await queryOne('SELECT * FROM ctv_dependencias WHERE id = ?', [result.insertId])
    res.status(201).json(item)
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: `"${descripcion}" ya existe en este catálogo` }); return
    }
    throw err
  }
})
dependencias.put('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  const { descripcion, id_dependencia_ig } = req.body
  try {
    await run('UPDATE ctv_dependencias SET descripcion=?, id_dependencia_ig=?, modifica_u=? WHERE id=?',
      [descripcion, id_dependencia_ig ?? null, req.user!.email, req.params.id])
    const item = await queryOne('SELECT * FROM ctv_dependencias WHERE id = ?', [req.params.id])
    res.json(item)
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: `"${descripcion}" ya existe en este catálogo` }); return
    }
    throw err
  }
})
dependencias.delete('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  await run('DELETE FROM ctv_dependencias WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

export default router
