import InspeccionForm from '../../components/InspeccionForm'
import { useParams } from 'react-router-dom'

export default function InspeccionPost() {
  const { id } = useParams<{ id: string }>()
  return <InspeccionForm tipo="POSTOPERACIONAL" salidaId={id ? Number(id) : undefined} />
}
