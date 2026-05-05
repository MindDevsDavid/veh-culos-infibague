import api from './client'
import type { Rol } from '../types'

export interface Usuario {
  id: number
  nombre: string
  email: string
  rol: Rol
  activo: boolean
  modifica_f?: string
}

export const usuariosApi = {
  list:   ()              => api.get<Usuario[]>('/usuarios').then(r => r.data),
  create: (data: unknown) => api.post<Usuario>('/usuarios', data).then(r => r.data),
  update: (id: number, data: unknown) => api.put<Usuario>(`/usuarios/${id}`, data).then(r => r.data),
  remove: (id: number)    => api.delete(`/usuarios/${id}`).then(r => r.data),
}
