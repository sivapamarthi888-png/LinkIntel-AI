import { forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

const baseInput =
  'mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input(props, ref) {
    return <input ref={ref} {...props} className={`${baseInput} ${props.className || ''}`} />;
  }
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select(props, ref) {
    return <select ref={ref} {...props} className={`${baseInput} ${props.className || ''}`} />;
  }
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea(props, ref) {
    return <textarea ref={ref} {...props} className={`${baseInput} ${props.className || ''}`} />;
  }
);

export function Label({ htmlFor, children, hint }: { htmlFor: string; children: React.ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
      {children}
      {hint && <span className="ml-1 text-xs font-normal text-gray-400">({hint})</span>}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-xs font-medium text-rose-600" role="alert">
      {message}
    </p>
  );
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'subtle' }) {
  const variants: Record<string, string> = {
    primary: 'bg-blue-700 text-white hover:bg-blue-800 disabled:bg-blue-300 focus-visible:ring-blue-400',
    secondary: 'bg-white text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-50 focus-visible:ring-gray-400',
    danger: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100 focus-visible:ring-rose-300',
    ghost: 'bg-transparent text-blue-700 hover:bg-blue-50 focus-visible:ring-blue-300',
    subtle: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:ring-slate-300',
  };
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    />
  );
}
