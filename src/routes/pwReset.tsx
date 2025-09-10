import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';

import Input from '../components/ui/Input';
import PwForm from '../components/ui/PwForm';
import Btn from '../components/ui/Btn';

export default function PwReset() {
  const navigate = useNavigate();

  const [formValues, setFormValues] = useState({
    correo: "",
  });

  const handleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues(prev => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = () => {
    alert(JSON.stringify(formValues, null, 2)); 
    setFormValues({ correo: "" }); 
  };

  const pwEmailInput = [
    <Input
      style="w-full border border-gray-300"
      key="correo"
      type="email"
      placeholder="Correo electrónico"
      value={formValues.correo}
      onChange={handleChange("correo")}
    />,
  ];

  const btnSendLink = [
    <Btn
      style="hover:bg-green-600  bg-black text-white font-black p-3 rounded-lg w-full"
      key="restablecerPw"
      text="Enviar enlace"
      onClick={handleSubmit}
    />,
  ];

  return (
    <div className='flex-1 flex flex-col items-center justify-center bg-background px-16 p-16 pt-30'>
      <Link to="/login" className="absolute top-6 left-6">
        <img
          src="/small_dark_logo.png"
          alt="Logo"
          className="w-12 h-12"
        />
      </Link>
      
      <PwForm
        title="Restablecer contraseña"
        text="Introduce la dirección de correo electrónico de la cuenta y te enviaremos un enlace para restablecer la contraseña"
        input={pwEmailInput}
        button={btnSendLink}
      />
    </div>
  );
}
