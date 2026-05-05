import InspeccionForm from '../../components/InspeccionForm'
import { useParams } from 'react-router-dom'

export default function InspeccionPre() {
  const { id } = useParams<{ id: string }>()
  return <InspeccionForm tipo="PREOPERACIONAL" salidaId={id ? Number(id) : undefined} />
}
