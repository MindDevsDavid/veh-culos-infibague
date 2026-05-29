import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  file: File
  onRemove?: () => void
  className?: string
}

export default function FotoThumb({ file, onRemove, className }: Props) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])

  return (
    <div className={`relative group ${className ?? ''}`}>
      <a href={url} target="_blank" rel="noopener noreferrer" title="Ver en grande">
        <img src={url} alt={file.name} className="w-full h-24 object-cover rounded-lg border border-slate-200 hover:opacity-90 transition-opacity" />
      </a>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          title="Quitar foto"
          className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center transition-colors"
        ><X size={12} /></button>
      )}
    </div>
  )
}
