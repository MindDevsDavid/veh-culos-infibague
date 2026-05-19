import { useState } from 'react'
import { Plus, Pencil, Trash2, CheckCircle, ExternalLink, FileText, ChevronDown, ChevronRight, List, Car, Printer } from 'lucide-react'
import api from '../../api/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import DataTable from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import { mantenimientoApi } from '../../api/mantenimiento'
import type { Mantenimiento } from '../../api/mantenimiento'
import { useVehiculos } from '../../hooks/useVehiculos'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAuth } from '../../context/AuthContext'

const empty = {
  id_vehiculo: '', tipo_mantenimiento: 'PREVENTIVO', descripcion: '', fecha_ingreso: '',
  kilometraje_ingreso: '', proveedor_taller: '', observacion_ingreso: '',
  fecha_salida: '', kilometraje_salida: '', observacion_salida: '',
  fecha_factura: '', numero_factura: '', valor_factura: '',
}
type FormState = typeof empty
type Vista = 'historial' | 'vehiculo'

function TipoBadge({ tipo }: { tipo: string }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tipo === 'PREVENTIVO' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
      {tipo}
    </span>
  )
}

function MantenimientoActions({ m, onEdit, onDelete, user }: {
  m: Mantenimiento
  onEdit: (m: Mantenimiento) => void
  onDelete: (id: number) => void
  user: any
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        title="Generar PDF del mantenimiento"
        className="p-1.5 rounded-lg text-slate-400 hover:bg-green-50 hover:text-green-600"
        onClick={async () => {
          const doc = new jsPDF()
          const vehiculo = m.vehiculo?.placa_vehiculo ?? `#${m.id_vehiculo}`
          const linea = m.vehiculo?.linea ?? ''

          doc.setDrawColor(0)
          doc.setLineWidth(0.3)
          doc.rect(15, 15, 40, 25)

          try {
            const img = new Image()
            img.src = '/logo.png'
            await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject })
            doc.addImage(img, 'PNG', 17, 17, 36, 21)
          } catch {
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(8)
            doc.text('(Sin logo)', 35, 28, { align: 'center' })
          }

          doc.rect(55, 15, 100, 15)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10)
          doc.text('INSTITUTO DE FINANCIAMIENTO, PROMOCIÓN Y', 105, 20, { align: 'center' })
          doc.text('DESARROLLO DE IBAGUÉ – PROCESO DE APOYO', 105, 24, { align: 'center' })
          doc.text('ALMACEN GENERAL INFIBAGUE', 105, 28, { align: 'center' })

          doc.rect(55, 30, 100, 10)
          doc.setFontSize(11)
          doc.text('FORMATO DE HISTORIAL DE MANTENIMIENTO', 105, 36.5, { align: 'center' })

          doc.rect(155, 15, 40, 25)
          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          doc.text('Fecha de expedición:', 157, 20)
          doc.setFont('helvetica', 'normal')
          doc.text(new Date().toLocaleDateString('es-CO'), 157, 24)
          doc.setFont('helvetica', 'bold')
          doc.text('Usuario:', 157, 31)
          doc.setFont('helvetica', 'normal')
          const userName = user?.nombres ? `${user.nombres} ${user.apellidos}` : 'Administrador'
          doc.text(doc.splitTextToSize(userName, 36), 157, 35)

          let yPos = 50
          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold'); doc.text('Vehículo:', 20, yPos); doc.setFont('helvetica', 'normal'); doc.text(vehiculo, 65, yPos)
          doc.setFont('helvetica', 'bold'); doc.text('Línea:', 120, yPos); doc.setFont('helvetica', 'normal'); doc.text(linea, 145, yPos)
          yPos += 10
          doc.setFont('helvetica', 'bold'); doc.text('Tipo de mantenimiento:', 20, yPos); doc.setFont('helvetica', 'normal'); doc.text(m.tipo_mantenimiento ?? '', 65, yPos)
          yPos += 7
          doc.setFont('helvetica', 'bold'); doc.text('Descripción:', 20, yPos); doc.setFont('helvetica', 'normal'); doc.text(m.descripcion ?? '', 65, yPos)
          yPos += 7
          doc.setFont('helvetica', 'bold'); doc.text('Fecha de ingreso:', 20, yPos); doc.setFont('helvetica', 'normal'); doc.text(m.fecha_ingreso ? new Date(m.fecha_ingreso).toLocaleDateString('es-CO') : '', 65, yPos)
          doc.setFont('helvetica', 'bold'); doc.text('Km ingreso:', 120, yPos); doc.setFont('helvetica', 'normal'); doc.text(m.kilometraje_ingreso ? `${m.kilometraje_ingreso} km` : '', 145, yPos)
          yPos += 7
          doc.setFont('helvetica', 'bold'); doc.text('Taller / Proveedor:', 20, yPos); doc.setFont('helvetica', 'normal'); doc.text(m.proveedor_taller ?? '', 65, yPos)
          yPos += 7
          doc.setFont('helvetica', 'bold'); doc.text('Observación ingreso:', 20, yPos); doc.setFont('helvetica', 'normal')
          const obsIn = doc.splitTextToSize(m.observacion_ingreso ?? 'N/A', 130)
          doc.text(obsIn, 65, yPos)
          yPos += obsIn.length * 5 + 5

          if (m.fecha_salida || m.kilometraje_salida) {
            doc.setFont('helvetica', 'bold'); doc.text('Fecha de salida:', 20, yPos); doc.setFont('helvetica', 'normal'); doc.text(m.fecha_salida ? new Date(m.fecha_salida).toLocaleDateString('es-CO') : '', 65, yPos)
            doc.setFont('helvetica', 'bold'); doc.text('Km salida:', 120, yPos); doc.setFont('helvetica', 'normal'); doc.text(m.kilometraje_salida ? `${m.kilometraje_salida} km` : '', 145, yPos)
            yPos += 7
            if (m.observacion_salida) {
              doc.setFont('helvetica', 'bold'); doc.text('Observación salida:', 20, yPos); doc.setFont('helvetica', 'normal')
              const obsOut = doc.splitTextToSize(m.observacion_salida, 120)
              doc.text(obsOut, 65, yPos)
              yPos += obsOut.length * 5 + 5
            }
          }

          yPos += 5
          doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text('Información de Facturación', 20, yPos); yPos += 7
          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold'); doc.text('No. Factura:', 20, yPos); doc.setFont('helvetica', 'normal'); doc.text(m.numero_factura ?? 'N/A', 45, yPos)
          doc.setFont('helvetica', 'bold'); doc.text('Fecha factura:', 80, yPos); doc.setFont('helvetica', 'normal'); doc.text(m.fecha_factura ? new Date(m.fecha_factura).toLocaleDateString('es-CO') : '', 105, yPos)
          doc.setFont('helvetica', 'bold'); doc.text('Valor:', 140, yPos); doc.setFont('helvetica', 'normal'); doc.text(m.valor_factura ? `$${Number(m.valor_factura).toLocaleString('es-CO')}` : 'N/A', 152, yPos)

          doc.setFontSize(8); doc.setTextColor(128)
          doc.text(`Generado el ${new Date().toLocaleDateString('es-CO')} - CTV Sistema de Gestión Vehicular`, 105, 280, { align: 'center' })
          doc.save(`mantenimiento-${vehiculo}-${m.id}.pdf`)
          toast.success('PDF generado correctamente')
        }}
      ><FileText size={15} /></button>
      <button
        title="Ver factura PDF"
        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        onClick={async () => {
          try {
            const res = await api.get(mantenimientoApi.archivoUrl(m.id), { responseType: 'blob' })
            const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
            const w = window.open(url, '_blank')
            if (w) w.addEventListener('beforeunload', () => URL.revokeObjectURL(url))
          } catch { toast.error('No hay archivo adjunto') }
        }}
      ><ExternalLink size={15} /></button>
      <button onClick={() => onEdit(m)} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Pencil size={15} /></button>
      <button onClick={async () => { if (confirm('¿Eliminar este registro?')) onDelete(m.id) }} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
    </div>
  )
}

async function generarHistorialPDF(placa: string, linea: string, items: Mantenimiento[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 14

  // ── ENCABEZADO ──────────────────────────────────────────────────────────────
  const hTop = 15        // y inicio
  const hLogoW = 38      // ancho columna logo
  const hMetaW = 38      // ancho columna metadata
  const hTitleW = pageW - margin * 2 - hLogoW - hMetaW
  const hLogoX = margin
  const hTitleX = margin + hLogoW
  const hMetaX = hTitleX + hTitleW
  const hRow1H = 14      // altura fila título institución
  const hRow2H = 9       // altura fila "FORMATO DE HISTORIAL"
  const hTotalH = hRow1H + hRow2H

  doc.setDrawColor(0); doc.setLineWidth(0.3)

  // Logo
  doc.rect(hLogoX, hTop, hLogoW, hTotalH)
  try {
    const img = new Image(); img.src = '/logo.png'
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej })
    doc.addImage(img, 'PNG', hLogoX + 1, hTop + 1, hLogoW - 2, hTotalH - 2)
  } catch {
    doc.setFontSize(7); doc.setFont('helvetica', 'normal')
    doc.text('(Sin logo)', hLogoX + hLogoW / 2, hTop + hTotalH / 2, { align: 'center' })
  }

  // Título institución (fila 1 centro)
  doc.rect(hTitleX, hTop, hTitleW, hRow1H)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5)
  doc.text('INSTITUTO DE FINANCIAMIENTO, PROMOCIÓN Y', hTitleX + hTitleW / 2, hTop + 4.5, { align: 'center' })
  doc.text('DESARROLLO DE IBAGUÉ – PROCESO DE APOYO', hTitleX + hTitleW / 2, hTop + 8.5, { align: 'center' })
  doc.text('ALMACEN GENERAL INFIBAGUE', hTitleX + hTitleW / 2, hTop + 12.5, { align: 'center' })

  // "FORMATO DE HISTORIAL" (fila 2 centro)
  doc.rect(hTitleX, hTop + hRow1H, hTitleW, hRow2H)
  doc.setFontSize(10); doc.setFont('helvetica', 'bold')
  doc.text('FORMATO DE HISTORIAL DE MANTENIMIENTO', hTitleX + hTitleW / 2, hTop + hRow1H + 6, { align: 'center' })

  // Metadata (3 filas: Versión, Código, Vigencia)
  const metaRowH = hTotalH / 3
  ;['Versión:', 'Código:', 'Vigencia:'].forEach((label, i) => {
    doc.rect(hMetaX, hTop + i * metaRowH, hMetaW, metaRowH)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
    doc.text(label, hMetaX + 2, hTop + i * metaRowH + metaRowH / 2 + 1)
  })

  // ── DATOS DEL VEHÍCULO ───────────────────────────────────────────────────────
  const yVeh = hTop + hTotalH + 6
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.text('Vehículo:', margin, yVeh)
  doc.setFont('helvetica', 'normal')
  doc.text(`${placa}  —  ${linea}`, margin + 22, yVeh)

  // ── TABLA DE MANTENIMIENTOS ──────────────────────────────────────────────────
  const rows = items.map(m => [
    m.fecha_ingreso ? new Date(m.fecha_ingreso).toLocaleDateString('es-CO') : '',
    m.tipo_mantenimiento,
    [m.descripcion, m.proveedor_taller ? `Taller: ${m.proveedor_taller}` : '', m.observacion_ingreso ?? ''].filter(Boolean).join('\n'),
    '',  // firma — columna vacía para estampar a mano
  ])

  // Rellenar filas vacías hasta mínimo 20 para que el formato se vea completo
  while (rows.length < 20) rows.push(['', '', '', ''])

  autoTable(doc, {
    startY: yVeh + 4,
    head: [[
      { content: 'FECHA', styles: { halign: 'center' } },
      { content: 'TIPO DE MANTENIMIENTO\n(PREVENTIVO/CORRECTIVO)', styles: { halign: 'center' } },
      { content: 'DESCRIPCIÓN DEL MANTENIMIENTO REALIZADO', styles: { halign: 'center' } },
      { content: 'FIRMA RESPONSABLE DE VERIFICACIÓN\n(SUPERVISIÓN / PERSONA ASIGNADA AL VEHÍCULO)', styles: { halign: 'center' } },
    ]],
    body: rows,
    margin: { left: margin, right: margin },
    styles: { fontSize: 8, cellPadding: 2.5, lineColor: [0, 0, 0], lineWidth: 0.25, textColor: [0, 0, 0] },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.3 },
    columnStyles: {
      0: { cellWidth: 22, halign: 'center' },
      1: { cellWidth: 32, halign: 'center' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 40 },
    },
    alternateRowStyles: { fillColor: [255, 255, 255] },
  })

  // ── PIE DE PÁGINA ────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight()
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(80)
  doc.text('Calle 60 con Cra. 5ª Edificio CAMI Norte Barrio La Floresta, Ibagué – Tolima', pageW / 2, pageH - 10, { align: 'center' })
  doc.text('Teléfono: (608) 2772348   E-mail: correspondencia@infibague.gov.co   Página Web: www.infibague.gov.co', pageW / 2, pageH - 6, { align: 'center' })
  doc.setTextColor(0)

  doc.save(`historial-mantenimiento-${placa}.pdf`)
  toast.success(`Historial de ${placa} generado`)
}

function VehiculoMantenimientos({ placa, linea, items, onEdit, onDelete, user }: {
  placa: string; linea: string
  items: Mantenimiento[]
  onEdit: (m: Mantenimiento) => void
  onDelete: (id: number) => void
  user: any
}) {
  const [open, setOpen] = useState(false)
  const enTaller = items.filter(m => !m.fecha_salida).length

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 flex-1 text-left hover:opacity-80 transition-opacity"
        >
          {open ? <ChevronDown size={15} className="text-slate-400" /> : <ChevronRight size={15} className="text-slate-400" />}
          <span className="font-mono font-semibold text-slate-800">{placa}</span>
          <span className="text-sm text-slate-500">{linea}</span>
          {enTaller > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">{enTaller} en taller</span>
          )}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{items.length} registro(s)</span>
          <button
            title="Imprimir historial de mantenimiento"
            onClick={() => generarHistorialPDF(placa, linea, items)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          ><Printer size={15} /></button>
        </div>
      </div>
      {open && (
        <div className="divide-y divide-slate-100 bg-white">
          {items.length === 0
            ? <p className="px-4 py-3 text-sm text-slate-400 italic">Sin mantenimientos.</p>
            : items.map(m => (
              <div key={m.id} className="flex items-start justify-between px-4 py-3 hover:bg-slate-50">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <TipoBadge tipo={m.tipo_mantenimiento} />
                    <span className="text-sm font-medium text-slate-800">{m.descripcion}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    {m.fecha_ingreso && <span>Ingreso: {new Date(m.fecha_ingreso).toLocaleDateString('es-CO')}</span>}
                    {m.proveedor_taller && <span>Taller: {m.proveedor_taller}</span>}
                    {m.fecha_salida
                      ? <span className="flex items-center gap-1 text-green-600"><CheckCircle size={11} />Salida: {new Date(m.fecha_salida).toLocaleDateString('es-CO')}</span>
                      : <span className="text-amber-600 font-medium">En taller</span>
                    }
                  </div>
                </div>
                <MantenimientoActions m={m} onEdit={onEdit} onDelete={onDelete} user={user} />
              </div>
            ))
          }
        </div>
      )}
    </div>
  )
}

export default function AdminMantenimiento() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const { data: items = [], isLoading } = useQuery({ queryKey: ['mantenimiento'], queryFn: () => mantenimientoApi.list() })
  const { data: vehiculos = [] } = useVehiculos()

  const create = useMutation({ mutationFn: mantenimientoApi.create, onSuccess: () => { qc.invalidateQueries({ queryKey: ['mantenimiento'] }); qc.invalidateQueries({ queryKey: ['vehiculos'] }); toast.success('Mantenimiento registrado') }, onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error') })
  const upd = useMutation({ mutationFn: ({ id, data }: { id: number; data: unknown }) => mantenimientoApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['mantenimiento'] }); qc.invalidateQueries({ queryKey: ['vehiculos'] }); toast.success('Mantenimiento actualizado') }, onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error') })
  const del_ = useMutation({ mutationFn: mantenimientoApi.remove, onSuccess: () => { qc.invalidateQueries({ queryKey: ['mantenimiento'] }); toast.success('Eliminado') }, onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error') })

  const [vista, setVista] = useState<Vista>('historial')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Mantenimiento | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [archivo, setArchivo] = useState<File | null>(null)

  function openCreate() { setForm(empty); setEditing(null); setArchivo(null); setModal('create') }
  function openEdit(m: Mantenimiento) {
    setEditing(m)
    setForm({
      id_vehiculo: String(m.id_vehiculo), tipo_mantenimiento: m.tipo_mantenimiento,
      descripcion: m.descripcion, fecha_ingreso: m.fecha_ingreso?.slice(0, 10) ?? '',
      kilometraje_ingreso: String(m.kilometraje_ingreso ?? ''), proveedor_taller: m.proveedor_taller ?? '',
      observacion_ingreso: m.observacion_ingreso ?? '',
      fecha_salida: m.fecha_salida?.slice(0, 10) ?? '', kilometraje_salida: String(m.kilometraje_salida ?? ''),
      observacion_salida: m.observacion_salida ?? '', fecha_factura: m.fecha_factura?.slice(0, 10) ?? '',
      numero_factura: m.numero_factura ?? '', valor_factura: String(m.valor_factura ?? ''),
    })
    setArchivo(null)
    setModal('edit')
  }
  function handleDelete(id: number) { del_.mutateAsync(id) }

  function set(k: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, String(v)) })
    if (archivo) fd.append('archivo', archivo)
    try {
      if (modal === 'create') await create.mutateAsync(fd)
      else await upd.mutateAsync({ id: editing!.id, data: fd })
      setModal(null)
    } catch { /* toast */ }
  }

  const columns: Column<Mantenimiento>[] = [
    { key: 'vehiculo', header: 'Vehículo', render: m => m.vehiculo?.placa_vehiculo ?? `#${m.id_vehiculo}` },
    { key: 'tipo_mantenimiento', header: 'Tipo', render: m => <TipoBadge tipo={m.tipo_mantenimiento} /> },
    { key: 'descripcion', header: 'Descripción' },
    { key: 'fecha_ingreso', header: 'Ingreso', render: m => m.fecha_ingreso ? new Date(m.fecha_ingreso).toLocaleDateString('es-CO') : '' },
    { key: 'proveedor_taller', header: 'Taller', render: m => m.proveedor_taller ?? '' },
    { key: 'fecha_salida', header: 'Salida', render: m => m.fecha_salida
      ? <span className="flex items-center gap-1 text-green-600"><CheckCircle size={13} />{new Date(m.fecha_salida).toLocaleDateString('es-CO')}</span>
      : <span className="text-amber-600 text-xs">En taller</span>
    },
  ]

  const isPending = create.isPending || upd.isPending

  // Agrupar por vehículo para vista por vehículo
  const porVehiculo = vehiculos
    .map(v => ({ v, mantenimientos: items.filter(m => m.id_vehiculo === v.id) }))
    .filter(({ mantenimientos }) => mantenimientos.length > 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Mantenimiento</h1>
          <p className="text-sm text-slate-500">{items.length} registros · {porVehiculo.length} vehículos</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus size={16} /> Nuevo mantenimiento
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        <button
          onClick={() => setVista('historial')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${vista === 'historial' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <List size={15} /> Historial
        </button>
        <button
          onClick={() => setVista('vehiculo')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${vista === 'vehiculo' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Car size={15} /> Por vehículo
        </button>
      </div>

      {/* Vista Historial */}
      {vista === 'historial' && (
        <DataTable columns={columns} data={items} keyField="id" loading={isLoading}
          searchable searchPlaceholder="Buscar vehículo, taller..."
          searchFilter={(m, q) => [m.vehiculo?.placa_vehiculo ?? '', m.proveedor_taller ?? '', m.descripcion].join(' ').toLowerCase().includes(q.toLowerCase())}
          actions={m => (
            <div className="flex items-center justify-end gap-1">
              <MantenimientoActions m={m} onEdit={openEdit} onDelete={handleDelete} user={user} />
            </div>
          )}
        />
      )}

      {/* Vista Por Vehículo */}
      {vista === 'vehiculo' && (
        <div className="space-y-3">
          {isLoading && <p className="text-sm text-slate-400">Cargando...</p>}
          {!isLoading && porVehiculo.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
              No hay mantenimientos registrados.
            </div>
          )}
          {porVehiculo.map(({ v, mantenimientos }) => (
            <VehiculoMantenimientos
              key={v.id}
              placa={v.placa_vehiculo}
              linea={v.linea}
              items={mantenimientos}
              onEdit={openEdit}
              onDelete={handleDelete}
              user={user}
            />
          ))}
        </div>
      )}

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === 'create' ? 'Nuevo Mantenimiento' : 'Editar Mantenimiento'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField as="select" label="Vehículo" required value={form.id_vehiculo} onChange={set('id_vehiculo')}>
              <option value="">Seleccionar...</option>
              {vehiculos.map(v => <option key={v.id} value={v.id}>{v.placa_vehiculo} — {v.linea}</option>)}
            </FormField>
            <FormField as="select" label="Tipo" value={form.tipo_mantenimiento} onChange={set('tipo_mantenimiento')}>
              <option value="PREVENTIVO">Preventivo</option>
              <option value="CORRECTIVO">Correctivo</option>
            </FormField>
          </div>
          <FormField label="Descripción" required value={form.descripcion} onChange={set('descripcion')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Fecha ingreso" type="date" required value={form.fecha_ingreso} onChange={set('fecha_ingreso')} />
            <FormField label="Km ingreso" type="number" value={form.kilometraje_ingreso} onChange={set('kilometraje_ingreso')} />
            <FormField label="Taller / Proveedor" value={form.proveedor_taller} onChange={set('proveedor_taller')} />
            <FormField label="Observación ingreso" value={form.observacion_ingreso} onChange={set('observacion_ingreso')} />
          </div>
          <hr className="border-slate-100" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Salida del taller (completar al terminar)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Fecha salida" type="date" value={form.fecha_salida} onChange={set('fecha_salida')} />
            <FormField label="Km salida" type="number" value={form.kilometraje_salida} onChange={set('kilometraje_salida')} />
            <FormField label="Observación salida" value={form.observacion_salida} onChange={set('observacion_salida')} />
            <FormField label="No. factura" value={form.numero_factura} onChange={set('numero_factura')} />
            <FormField label="Fecha factura" type="date" value={form.fecha_factura} onChange={set('fecha_factura')} />
            <FormField label="Valor factura ($)" type="number" value={form.valor_factura} onChange={set('valor_factura')} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Factura PDF</label>
            <input type="file" accept="application/pdf" onChange={e => setArchivo(e.target.files?.[0] ?? null)}
              className="text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" />
            {modal === 'edit' && <p className="text-xs text-slate-400 mt-1">Deja vacío para mantener el archivo existente.</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={isPending} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
              {isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
