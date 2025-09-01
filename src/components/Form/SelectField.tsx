import { UseFormRegister, FieldError } from 'react-hook-form';

interface SelectFieldProps {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  register: UseFormRegister<any>;
  error?: FieldError;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

export function SelectField({
  label,
  name,
  options,
  register,
  error,
  placeholder = "Seleccionar...",
  required = false,
  disabled = false,
  onChange
}: SelectFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-primary mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        {...register(name)}
        disabled={disabled}
        onChange={(e) => {
          register(name).onChange(e);
          onChange?.(e.target.value);
        }}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
          error ? 'border-red-500' : 'border-border'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
      )}
    </div>
  );
}
