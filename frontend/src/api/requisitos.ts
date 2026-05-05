import api from './client'
import type { ControlRequisito } from '../types'

export const requisitosApi = {
  list:   (vehiculoId?: number) => api.get<ControlRequisito[]>('/requisitos', { params: vehiculoId ? { vehiculo_id: vehiculoId } : {} }).then(r => r.data),
  get:    (id: number)          => api.get<ControlRequisito>(`/requisitos/${id}`).then(r => r.data),
  create: (form: FormData)      => api.post<ControlRequisito>('/requisitos', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  update: (id: number, data: unknown) => api.put<ControlRequisito>(`/requisitos/${id}`, data).then(r => r.data),
  remove: (id: number)          => api.delete(`/requisitos/${id}`).then(r => r.data),
  archivoUrl: (id: number)      => `/api/requisitos/${id}/archivo`,
}
