import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'style'> {
  
  hoverClass?: string;
  customClass?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}


export default function Input({  
  
  type = 'text',
  className = 'w-full',
  hoverClass,
  customClass = '',
  onChange,
  ...rest
}: InputProps) {
  const baseClasses = 'bg-gray-300 p-3 rounded-lg w-xl ';
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
}
