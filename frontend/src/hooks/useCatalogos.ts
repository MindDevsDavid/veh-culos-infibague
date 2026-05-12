import { useQuery } from '@tanstack/react-query'
import { catalogosApi } from '../api/catalogos'

const opts = { staleTime: 5 * 60_000 }

export const useMarcas        = () => useQuery({ queryKey: ['marcas'],         queryFn: catalogosApi.marcas,         ...opts })
export const useColores        = () => useQuery({ queryKey: ['colores'],        queryFn: catalogosApi.colores,        ...opts })
export const useTiposVehiculo  = () => useQuery({ queryKey: ['tiposVehiculo'],  queryFn: catalogosApi.tiposVehiculo,  ...opts })
export const useTiposRequisito = () => useQuery({ queryKey: ['tiposRequisito'], queryFn: catalogosApi.tiposRequisito, ...opts })
export const useComponentes      = () => useQuery({ queryKey: ['componentes'],      queryFn: catalogosApi.componentes,      ...opts })
export const useDependencias     = () => useQuery({ queryKey: ['dependencias'],     queryFn: catalogosApi.dependencias,     ...opts })
export const useTiposComponente  = () => useQuery({ queryKey: ['tiposComponente'],  queryFn: catalogosApi.tiposComponente,  ...opts })
