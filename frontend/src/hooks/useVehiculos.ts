import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vehiculosApi } from '../api/vehiculos'
import { toast } from 'sonner'

export function useVehiculos() {
  return useQuery({ queryKey: ['vehiculos'], queryFn: vehiculosApi.list })
}

export function useVehiculo(id: number) {
  return useQuery({ queryKey: ['vehiculos', id], queryFn: () => vehiculosApi.get(id), enabled: id > 0 })
}

export function useCreateVehiculo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: vehiculosApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehiculos'] }); toast.success('Vehículo creado') },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error al crear vehículo'),
  })
}

export function useUpdateVehiculo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) => vehiculosApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehiculos'] }); toast.success('Vehículo actualizado') },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error al actualizar'),
  })
}

export function useDeleteVehiculo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: vehiculosApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehiculos'] }); toast.success('Vehículo eliminado') },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error al eliminar'),
  })
}
