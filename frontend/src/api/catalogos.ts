import api from './client'

export interface Catalogo { id: number; descripcion: string }

const get = (path: string) => api.get<Catalogo[]>(path).then(r => r.data)

export interface TipoComponente { id: number; nombre_componente: string; descripcion_componente?: string | null }

export const catalogosApi = {
  marcas:           () => get('/catalogos/marcas'),
  colores:          () => get('/catalogos/colores'),
  tiposVehiculo:    () => get('/catalogos/tipos-vehiculo'),
  tiposRequisito:   () => get('/catalogos/tipos-requisito'),
  componentes:      () => get('/catalogos/componentes'),
  dependencias:     () => get('/catalogos/dependencias'),
  tiposComponente:  () => api.get<TipoComponente[]>('/catalogos/tipos-componente').then(r => r.data),
}
