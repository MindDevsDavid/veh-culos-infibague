import api from './client'
import type { Vehiculo } from '../types'

export const vehiculosApi = {
  list:   ()              => api.get<Vehiculo[]>('/vehiculos').then(r => r.data),
  get:    (id: number)    => api.get<Vehiculo>(`/vehiculos/${id}`).then(r => r.data),
  create: (data: unknown) => api.post<Vehiculo>('/vehiculos', data).then(r => r.data),
  update: (id: number, data: unknown) => api.put<Vehiculo>(`/vehiculos/${id}`, data).then(r => r.data),
  remove: (id: number)    => api.delete(`/vehiculos/${id}`).then(r => r.data),
}
