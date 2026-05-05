interface Props {
  value: string
  map?: Record<string, { label: string; className: string }>
}

const ESTADO_SALIDA: Record<string, { label: string; className: string }> = {
  PENDIENTE:    { label: 'Pendiente',    className: 'bg-amber-100 text-amber-700' },
  AUTORIZADA:   { label: 'Autorizada',   className: 'bg-blue-100 text-blue-700' },
  RECHAZADA:    { label: 'Rechazada',    className: 'bg-red-100 text-red-700' },
  INSPECCIONADA:{ label: 'Inspeccionada',className: 'bg-cyan-100 text-cyan-700' },
  EN_CURSO:     { label: 'En Curso',     className: 'bg-green-100 text-green-700' },
  RETORNANDO:   { label: 'Retornando',   className: 'bg-purple-100 text-purple-700' },
  COMPLETADA:   { label: 'Completada',   className: 'bg-slate-100 text-slate-600' },
  CANCELADA:    { label: 'Cancelada',    className: 'bg-gray-100 text-gray-500' },
}

const ESTADO_REQUISITO: Record<string, { label: string; className: string }> = {
  VIGENTE: { label: 'Vigente', className: 'bg-green-100 text-green-700' },
  VENCIDO: { label: 'Vencido', className: 'bg-red-100 text-red-700' },
}

const ESTADO_VEHICULO: Record<string, { label: string; className: string }> = {
  ACTIVO:           { label: 'Activo',          className: 'bg-green-100 text-green-700' },
  EN_MANTENIMIENTO: { label: 'En Mantenimiento', className: 'bg-amber-100 text-amber-700' },
  FUERA_DE_SERVICIO:{ label: 'Fuera de Servicio',className: 'bg-red-100 text-red-700' },
}

export const MAPS = { ESTADO_SALIDA, ESTADO_REQUISITO, ESTADO_VEHICULO }

export default function StatusBadge({ value, map = ESTADO_SALIDA }: Props) {
  const cfg = map[value] ?? { label: value, className: 'bg-slate-100 text-slate-600' }
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}
