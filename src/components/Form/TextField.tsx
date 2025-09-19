import { UseFormRegister, FieldError } from 'react-hook-form';

interface TextFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'password';
  placeholder?: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  required?: boolean;
}

export function TextField({
  label,
  name,
  type = 'text',
  placeholder,
  register,
  error,
  required = false
}: TextFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-primary mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        {...register(name)}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
          error ? 'border-red-500' : 'border-border'
        }`}
        inputMode={name === 'phone' ? 'numeric' : undefined}
        pattern={name === 'phone' ? '[0-9]*' : undefined}
        onInput={name === 'phone' ? (e => {
          e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
        }) : undefined}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
      )}
    </div>
  );
}
