import type { ComponentProps, HTMLAttributes, ReactNode } from 'react';
type ButtonProps = ComponentProps<'button'> & { loading?: boolean; variant?: 'primary' | 'secondary' | 'quiet' };
export function Button({ loading = false, variant = 'primary', disabled, type = 'button', className = '', ...props }: ButtonProps) {
  return <button {...props} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={`u-button u-button--${variant} ${className}`} />;
}
export function IconButton({ label, children, className = '', ...props }: ComponentProps<'button'> & { label: string }) {
  return <Button {...props} variant="quiet" aria-label={label} className={`u-icon-button ${className}`}>{children}</Button>;
}
export interface FieldControl { id: string; 'aria-describedby'?: string | undefined; 'aria-invalid'?: boolean | undefined }
export function Field({ id, label, help, error, children }: { id: string; label: string; help?: string; error?: string; children: (control: FieldControl) => ReactNode }) {
  const description = [help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return <div className="u-field"><label htmlFor={id}>{label}</label>{children({ id, 'aria-describedby': description, 'aria-invalid': !!error || undefined })}
    {help && <p className="u-help" id={`${id}-help`}>{help}</p>}{error && <p className="u-error" id={`${id}-error`}>{error}</p>}</div>;
}
export function TextInput({ className = '', ...props }: ComponentProps<'input'>) { return <input {...props} className={`u-input ${className}`} />; }
export function Select({ className = '', ...props }: ComponentProps<'select'>) { return <select {...props} className={`u-input ${className}`} />; }
export function TextArea({ className = '', ...props }: ComponentProps<'textarea'>) { return <textarea {...props} className={`u-input ${className}`} />; }
export function RadioGroup({ label, name, value, options, disabled, onChange }: { label: string; name: string; value: string; options: { value: string; label: string }[]; disabled?: boolean; onChange: (value: string) => void }) {
  return <fieldset className="u-radio-group" disabled={disabled}><legend>{label}</legend>{options.map(option => <label key={option.value}>
    <input type="radio" name={name} value={option.value} checked={option.value === value} onChange={() => onChange(option.value)} />{option.label}</label>)}</fieldset>;
}
export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) { return <div {...props} className={`u-card ${className}`} />; }
export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warning' | 'error' | 'success'; children: ReactNode }) { return <div role={tone === 'error' ? 'alert' : undefined} className={`u-notice u-notice--${tone}`}>{children}</div>; }
export function Status({ children, busy = false }: { children: ReactNode; busy?: boolean }) { return <p role="status" aria-live="polite" aria-busy={busy} className="u-status">{children}</p>; }
