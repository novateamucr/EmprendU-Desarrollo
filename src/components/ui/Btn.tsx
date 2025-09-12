import { useNavigate } from 'react-router-dom'

interface ButtonProps {

    style: string;
    hover?: string;
    text: string;
    to?: string; //con esto se le podria agregar una ruta 
    onClick?: () => void; //con esta se le puede agregar una funcion 
    disabled?: boolean; //para deshabilitar el botón
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function Button(props: ButtonProps) {
  const navigate = useNavigate(); 

  const handleClick = () => {
    if (props.to) {
      navigate(props.to);
    } else if (props.onClick) {
      props.onClick();
    }
  };

  return (
    <button
      className={`${props.style} ${props.hover || ''} ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={props.disabled ? undefined : handleClick}
      disabled={props.disabled}
    >
      {props.text}
    </button>
  );
}
