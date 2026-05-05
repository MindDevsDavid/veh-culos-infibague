import { PrismaClient, Rol } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('Admin123!', 12)

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@infibague.gov.co' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@infibague.gov.co',
      password_hash: hash,
      rol: Rol.ADMIN,
      activo: true,
      modifica_u: 'seed',
    },
  })
  console.log('Admin creado:', admin.email)

  // Dependencia base
  const dep = await prisma.dependencia.upsert({
    where: { id: 1 },
    update: {},
    create: {
      descripcion: 'INFIbagué',
      modifica_u: 'seed',
    },
  })

  // Tipos de vehículo
  const tiposV = ['Carro', 'Moto', 'Grúa', 'Camión', 'Bus']
  for (const desc of tiposV) {
    await prisma.tipoVehiculo.upsert({
      where: { id: tiposV.indexOf(desc) + 1 },
      update: {},
      create: { descripcion: desc, modifica_u: 'seed' },
    })
  }

  // Tipos de requisito
  const tiposR = ['SOAT', 'Revisión Técnico-Mecánica', 'Póliza Todo Riesgo', 'Tarjeta de Operación', 'Extintor', 'Kit de Carretera']
  for (const desc of tiposR) {
    await prisma.tipoRequisito.create({
      data: { descripcion: desc, modifica_u: 'seed' },
    }).catch(() => {})
  }

  console.log('Seed completado.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
