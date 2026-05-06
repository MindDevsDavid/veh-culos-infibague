import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '..', '.env') })

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!)

  const hash = await bcrypt.hash('Admin123!', 12)

  await conn.execute(
    `INSERT INTO usuarios (nombre, email, password_hash, rol, activo, modifica_u)
     VALUES ('Administrador', 'admin@infibague.gov.co', ?, 'ADMIN', 1, 'seed')
     ON DUPLICATE KEY UPDATE nombre=nombre`,
    [hash],
  )
  console.log('Admin: admin@infibague.gov.co / Admin123!')

  await conn.execute(
    `INSERT INTO ctv_dependencias (descripcion, modifica_u) VALUES ('INFIbagué', 'seed')
     ON DUPLICATE KEY UPDATE descripcion=descripcion`
  )

  const tiposV = ['Carro', 'Moto', 'Grúa', 'Camión', 'Bus']
  for (const desc of tiposV) {
    await conn.execute(
      `INSERT INTO ctv_tipo_vehiculos (descripcion, modifica_u) VALUES (?, 'seed')
       ON DUPLICATE KEY UPDATE descripcion=descripcion`,
      [desc],
    ).catch(() => {})
  }

  const tiposR = ['SOAT', 'Revisión Técnico-Mecánica', 'Póliza Todo Riesgo', 'Tarjeta de Operación', 'Extintor', 'Kit de Carretera']
  for (const desc of tiposR) {
    await conn.execute(
      `INSERT INTO ctv_tipos_requisito (descripcion, modifica_u) VALUES (?, 'seed')
       ON DUPLICATE KEY UPDATE descripcion=descripcion`,
      [desc],
    ).catch(() => {})
  }

  const marcas = ['Chevrolet', 'Ford', 'Toyota', 'Renault', 'Mazda', 'Hyundai', 'Kia', 'Volkswagen']
  for (const desc of marcas) {
    await conn.execute(
      `INSERT INTO ctv_marcas (descripcion, modifica_u) VALUES (?, 'seed')
       ON DUPLICATE KEY UPDATE descripcion=descripcion`,
      [desc],
    ).catch(() => {})
  }

  const colores = ['Blanco', 'Negro', 'Gris', 'Plata', 'Rojo', 'Azul', 'Verde', 'Amarillo']
  for (const desc of colores) {
    await conn.execute(
      `INSERT INTO ctv_color (descripcion, modifica_u) VALUES (?, 'seed')
       ON DUPLICATE KEY UPDATE descripcion=descripcion`,
      [desc],
    ).catch(() => {})
  }

  const componentes = ['Extintor', 'Botiquín', 'Kit de carretera', 'Llanta de repuesto', 'Gata', 'Cruceta']
  for (const desc of componentes) {
    await conn.execute(
      `INSERT INTO ctv_componentes (descripcion, modifica_u) VALUES (?, 'seed')
       ON DUPLICATE KEY UPDATE descripcion=descripcion`,
      [desc],
    ).catch(() => {})
  }

  await conn.end()
  console.log('Seed completado.')
}

main().catch(e => { console.error(e); process.exit(1) })
