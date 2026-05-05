import api from './client'
import type { Inspeccion } from '../types'

export const inspeccionesApi = {
  list:   (params?: Record<string, string>) => api.get<Inspeccion[]>('/inspecciones', { params }).then(r => r.data),
  get:    (id: number)                      => api.get<Inspeccion>(`/inspecciones/${id}`).then(r => r.data),
  create: (form: FormData)                  => api.post<Inspeccion>('/inspecciones', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
}
