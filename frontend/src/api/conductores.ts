import api from './client'
import type { Conductor } from '../types'

export const conductoresApi = {
  list:   ()              => api.get<Conductor[]>('/conductores').then(r => r.data),
  get:    (id: number)    => api.get<Conductor>(`/conductores/${id}`).then(r => r.data),
  create: (data: unknown) => api.post<Conductor>('/conductores', data).then(r => r.data),
  update: (id: number, data: unknown) => api.put<Conductor>(`/conductores/${id}`, data).then(r => r.data),
  remove: (id: number)    => api.delete(`/conductores/${id}`).then(r => r.data),
}
