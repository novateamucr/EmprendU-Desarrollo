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
  const baseClasses = 'bg-white dark:bg-cardDark border border-gray-200 dark:border-cardDark p-3 rounded-lg dark:text-white focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-brandDark transition-colors';
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
