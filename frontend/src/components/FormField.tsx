import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'

interface BaseProps {
  label: string
  error?: string
  required?: boolean
}

type InputProps = BaseProps & InputHTMLAttributes<HTMLInputElement> & { as?: 'input' }
type SelectProps = BaseProps & SelectHTMLAttributes<HTMLSelectElement> & { as: 'select'; children: ReactNode }
type TextareaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement> & { as: 'textarea' }

type Props = InputProps | SelectProps | TextareaProps

const baseClass = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 read-only:bg-slate-50 read-only:text-slate-500 read-only:cursor-default'

export default function FormField(props: Props) {
  const { label, error, required, as = 'input', ...rest } = props

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {as === 'select' ? (
        <select className={baseClass} {...(rest as SelectHTMLAttributes<HTMLSelectElement>)}>
          {(props as SelectProps).children}
        </select>
      ) : as === 'textarea' ? (
        <textarea rows={3} className={baseClass} {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      ) : (
        <input className={baseClass} {...(rest as InputHTMLAttributes<HTMLInputElement>)} />
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
