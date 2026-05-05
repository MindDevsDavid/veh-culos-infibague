import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { conductoresApi } from '../api/conductores'
import { toast } from 'sonner'

export function useConductores() {
  return useQuery({ queryKey: ['conductores'], queryFn: conductoresApi.list })
}

export function useCreateConductor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: conductoresApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['conductores'] }); toast.success('Conductor creado') },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error al crear'),
  })
}

export function useUpdateConductor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) => conductoresApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['conductores'] }); toast.success('Conductor actualizado') },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error al actualizar'),
  })
}

export function useDeleteConductor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: conductoresApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['conductores'] }); toast.success('Conductor eliminado') },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error al eliminar'),
  })
}
