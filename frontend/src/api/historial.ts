import api from './client'

export interface HistorialUso {
  id: number
  id_vehiculo: number
  id_salida?: number
  fecha: string
  kilometraje_inicial: number
  kilometraje_final: number
  cantidad_recorridos: number
  observaciones?: string
  vehiculo?: { placa_vehiculo: string; linea: string; marca?: { descripcion: string } }
  salida?: {
    id: number
    motivo_salida: string
    lugar_destino: string
    fecha_salida?: string
    hora_salida?: string
    fecha_entrada?: string
    hora_entrada?: string
    firma?: string
    observaciones?: string
    estado?: string
    conductor?: { nombre_conductor: string; cedula_conductor: string }
    autorizador?: { nombre: string } | null
    dependencia_uso?: { descripcion: string }
  } | null
}

export const historialApi = {
  list:       (params?: Record<string, string>) => api.get<HistorialUso[]>('/historial', { params }).then(r => r.data),
  byVehiculo: (id: number)                      => api.get<HistorialUso[]>(`/historial/vehiculo/${id}`).then(r => r.data),
}
