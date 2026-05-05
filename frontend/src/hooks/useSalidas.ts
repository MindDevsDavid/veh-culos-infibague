import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salidasApi } from '../api/salidas'
import { toast } from 'sonner'

export function useSalidas(params?: Record<string, string>) {
  return useQuery({ queryKey: ['salidas', params], queryFn: () => salidasApi.list(params) })
}

export function useSalidasEnCurso() {
  return useQuery({ queryKey: ['salidas', 'en-curso'], queryFn: salidasApi.enCurso })
}

export function useSalida(id: number) {
  return useQuery({ queryKey: ['salidas', id], queryFn: () => salidasApi.get(id), enabled: id > 0 })
}

export function useCreateSalida() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: salidasApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salidas'] }); toast.success('Solicitud creada') },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error al crear solicitud'),
  })
}

export function useAutorizarSalida() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: salidasApi.autorizar,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salidas'] }); toast.success('Salida autorizada') },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error al autorizar'),
  })
}

export function useRechazarSalida() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) => salidasApi.rechazar(id, motivo),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salidas'] }); toast.success('Salida rechazada') },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error al rechazar'),
  })
}

export function useCheckSalida() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, form }: { id: number; form: FormData }) => salidasApi.checkSalida(id, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salidas'] }); toast.success('Check-salida registrado') },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error en check-salida'),
  })
}

export function useCheckEntrada() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, form }: { id: number; form: FormData }) => salidasApi.checkEntrada(id, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salidas'] }); toast.success('Check-entrada registrado') },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error en check-entrada'),
  })
}
