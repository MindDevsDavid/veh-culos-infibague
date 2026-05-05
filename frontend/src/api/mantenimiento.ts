import api from './client'

export interface Mantenimiento {
  id: number
  id_vehiculo: number
  tipo_mantenimiento: string
  descripcion: string
  fecha_ingreso: string
  kilometraje_ingreso?: number
  proveedor_taller?: string
  observacion_ingreso?: string
  fecha_salida?: string
  kilometraje_salida?: number
  observacion_salida?: string
  fecha_factura?: string
  numero_factura?: string
  valor_factura?: number
  vehiculo?: { placa_vehiculo: string }
}

export const mantenimientoApi = {
  list:   (params?: Record<string, string>) => api.get<Mantenimiento[]>('/mantenimiento', { params }).then(r => r.data),
  get:    (id: number)                      => api.get<Mantenimiento>(`/mantenimiento/${id}`).then(r => r.data),
  create: (data: unknown)                   => api.post<Mantenimiento>('/mantenimiento', data).then(r => r.data),
  update: (id: number, data: unknown)       => api.put<Mantenimiento>(`/mantenimiento/${id}`, data).then(r => r.data),
  remove: (id: number)                      => api.delete(`/mantenimiento/${id}`).then(r => r.data),
}
