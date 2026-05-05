import api from './client'
import type { SalidaVehiculo } from '../types'

export const salidasApi = {
  list:       (params?: Record<string, string>) => api.get<SalidaVehiculo[]>('/salidas', { params }).then(r => r.data),
  enCurso:    ()                                => api.get<SalidaVehiculo[]>('/salidas/en-curso').then(r => r.data),
  get:        (id: number)                      => api.get<SalidaVehiculo>(`/salidas/${id}`).then(r => r.data),
  create:     (data: unknown)                   => api.post<SalidaVehiculo>('/salidas', data).then(r => r.data),
  autorizar:  (id: number)                      => api.put<SalidaVehiculo>(`/salidas/${id}/autorizar`).then(r => r.data),
  rechazar:   (id: number, motivo: string)      => api.put<SalidaVehiculo>(`/salidas/${id}/rechazar`, { motivo_rechazo: motivo }).then(r => r.data),
  checkSalida:(id: number, form: FormData)      => api.put<SalidaVehiculo>(`/salidas/${id}/check-salida`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  checkEntrada:(id: number, form: FormData)     => api.put<SalidaVehiculo>(`/salidas/${id}/check-entrada`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  remove:     (id: number)                      => api.delete(`/salidas/${id}`).then(r => r.data),
}
