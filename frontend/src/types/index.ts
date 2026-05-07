export type Rol = 'ADMIN' | 'CONDUCTOR' | 'AUTORIZADOR' | 'VIGILANTE' | 'CONSULTAS'

export interface AuthUser {
  id?: number
  sub?: number
  email: string
  rol: Rol
  nombre: string
}

export interface Vehiculo {
  id: number
  id_tipo_vehiculo: number
  placa_vehiculo: string
  id_marca: number
  linea: string
  anno: number
  id_color: number
  numero_chasis: string
  numero_motor: string
  tipo_combustible: string
  capacidad_combustible?: number
  capacidad_peso?: number
  capacidad_pasajeros?: number
  id_dependencia_asignada: number
  id_responsable: number
  estado: string
  fecha_adquisicion: string
  valor_adquisicion: number
  placa_almacen?: string
  tipo_vehiculo?: { descripcion: string }
  marca?: { descripcion: string }
  color?: { descripcion: string }
  dependencia?: { descripcion: string }
}

export interface Conductor {
  id: number
  id_usuario?: number
  nombre_conductor: string
  cedula_conductor: string
  licencia_conduccion: string
  categoria_licencia: string
  fecha_vence_licencia: string
  autorizacion_th: string | null
  fecha_autorizacion_th?: string
  fecha_vence_th?: string
  telefono?: number
  id_dependencia_conductor: number
  dependencia?: { descripcion: string }
}

export interface SalidaVehiculo {
  id: number
  id_vehiculo: number
  placa_vehiculo: string
  id_conductor: number
  id_inspeccion?: number
  fecha_salida: string
  hora_salida?: string
  motivo_salida: string
  lugar_destino: string
  kilometraje_salida: number
  id_autorizado_por?: number
  firma?: string
  id_dependencia_uso: number
  fecha_entrada?: string
  hora_entrada?: string
  kilometraje_llegada?: number
  observaciones?: string
  estado: string
  motivo_rechazo?: string
  vehiculo?: Vehiculo
  conductor?: Conductor
}

export interface ControlRequisito {
  id: number
  id_vehiculo: number
  id_tipo_requisito: number
  numero_requisito: string
  empresa_expide: string
  fecha_expedicion: string
  fecha_vencimiento: string
  estado_requisito: string
  observacion?: string
  tipo_requisito?: { descripcion: string }
}

export interface Inspeccion {
  id: number
  fecha: string
  hora: string
  id_vehiculo: number
  placa_vehiculo: string
  id_conductor: number
  tipo_inspeccion: 'PREOPERACIONAL' | 'POSTOPERACIONAL'
  kilometraje: number
  apto_operar: boolean
  reporte_mantenimiento: boolean
  observaciones?: string
  vehiculo?: { placa_vehiculo: string }
  conductor?: { nombre_conductor: string }
}
