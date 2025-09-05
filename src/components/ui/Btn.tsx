import { useNavigate } from 'react-router-dom'

interface ButtonProps {

    style: string;
    hover?: string;
    text: string;
    to?: string; //con esto se le podria agregar una ruta 
    onClick?: () => void; //con esta se le puede agregar una funcion 

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
      className={`${props.style} ${props.hover || ''}`}
      onClick={handleClick}
    >
      {props.text}
    </button>
  );
}
