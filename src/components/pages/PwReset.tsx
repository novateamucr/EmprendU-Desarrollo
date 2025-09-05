import { useState } from "react";
import Input from '../ui/Input';
import PwForm from '../ui/PwForm';
import Btn from '../ui/Btn';
import { Link } from '@tanstack/react-router';


export default function PwReset() {

const [formValues, setFormValues] = useState({
    correo: "",
  });

  const handleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues(prev => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = () => {
    alert(JSON.stringify(formValues, null, 2)); 

    setFormValues({ 
      correo: "" 
    }); 
  };

  const pwEmailInput = [
  <Input key="correo" 
  type="email" 
  placeholder="Correo electrónico" 
  value={formValues.correo} 
  onChange={handleChange("correo")} />,
]

const btnSendLink = [
  <Btn 
    style="hover:bg-gray-800 bg-gray-600 text-white font-black p-3 rounded-lg w-xl" 
    key="restablecerPw"
    text = "Enviar enlace"
    onClick={handleSubmit} //probando el boton
  />
]

    return (
    <div className='flex-1 flex flex-col items-center justify-center bg-white px-16 p-16 pt-30'>
      <Link to="/login" className="absolute top-6 left-6">
        <img
          src="/small_dark_logo.png"
          alt="Logo"
          className="w-12 h-12"
        />
      </Link>
      
      <PwForm
        title="Restablecer contraseña"
        text="¿Olvidaste tu contraseña? Introduce la dirección de correo electrónico de la cuenta y te enviaremos un enlace para restablecer la contraseña"
        input={pwEmailInput}
        button={btnSendLink}
      />

    </div>
    )

}

