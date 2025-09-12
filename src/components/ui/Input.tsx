import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'style'> {
  hoverClass?: string;
  customClass?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}


export function Input({
  type = 'text',
  className = '',
  hoverClass,
  customClass = '',
  onChange,
  ...rest
}: InputProps) {
  const baseClasses = 'bg-gray-300 p-3 rounded-lg w-xl mb-4';
  const [currentClass, setCurrentClass] = React.useState(`${baseClasses} ${customClass} ${className}`.trim());

  React.useEffect(() => {
    setCurrentClass(`${baseClasses} ${customClass} ${className}`.trim());
  }, [customClass, className]);

  const handleMouseOver = (e: React.MouseEvent<HTMLInputElement>) => {
    if (hoverClass) {
      e.currentTarget.className = hoverClass;
    }
  };

  const handleMouseOut = () => {
    if (hoverClass) {
      setCurrentClass(`${baseClasses} ${customClass} ${className}`.trim());
    }
  };

  return (
    <input
      type={type}
      className={currentClass}
      onChange={onChange}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      {...rest}
    />
  );

export default function Input(props: InputProps) {
    return (
        <input
            type={props.type}
            className={`bg-white p-3 rounded-lg w-xl mb-4 ${props.style || ""}`}
            placeholder={props.placeholder}
            onChange={props.onChange}
            onMouseOver={(e) => {
                if (props.hover) {
                    e.currentTarget.className = props.hover;
                }
            }}
            onMouseOut={(e) => {
                if (props.hover) {
                    e.currentTarget.className = `bg-gray-300 p-3 rounded-lg w-xl mb-4 ${props.style || ""}`;
                }
            }}
            value={props.value}
        />
    );

}
