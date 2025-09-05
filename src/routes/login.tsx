import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';

import Input from '../components/ui/Input';
import AuthForm from '../components/ui/AuthForm';
import OptionPanel from '../components/ui/OptionPanel';
import Btn from '../components/ui/Btn';

export default function Login() {
  const navigate = useNavigate();

  const [formValues, setFormValues] = useState({
    correo: "",
    password: "",
  });

  const handleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues(prev => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = () => {
    alert(JSON.stringify(formValues, null, 2));
    setFormValues({ correo: "", password: "" });
  };

  // Inputs del login
  const loginInputs = [
    <Input
      key="correoLogin"
      type="email"
      placeholder="Correo electrónico"
      value={formValues.correo}
      onChange={handleChange("correo")}
    />,
    <Input
      key="password"
      type="password"
      placeholder="Contraseña"
      value={formValues.password}
      onChange={handleChange("password")}
    />,
  ];

  // Botón de login
  const loginBtn = [
    <Btn
      style="hover:bg-gray-800 bg-gray-600 text-white font-black p-3 rounded-lg w-xl"
      text='Iniciar sesión'
      key="iniciar"
      onClick={handleSubmit}
    />,
  ];

  // Botón de registro usando navigate de react-router-dom
  const registerBtn = [
    <Btn
      style="border-2 border-white text-white font-black px-6 py-3 rounded-lg w-xs hover:bg-gray-200 hover:text-gray-800 "
      key="crear"
      text="Crear cuenta"
      onClick={() => navigate("/register")}
    />,
  ];

  // Link de contraseña olvidada
  const pwLink = [
    <Link
      key="forgot"
      to="/pwreset"
      className="text-blue-600 hover:underline mt-4 text-sm"
    >
      ¿Olvidaste tu contraseña?
    </Link>
  ];

  // Formulario de autenticación
  const AuthFormLogin = [
    <AuthForm
      style="flex-2 flex flex-col items-center justify-center bg-white px-16 w-[75%]"
      title="Inicia sesión"
      input={loginInputs}
      newPw={pwLink}
      button={loginBtn}
    />
  ];

  // Panel lateral
  const optPanelInicia = [
    <OptionPanel
      style="w-[25%]"
      title="¡Inicia ahora!"
      text="Ingresa tus datos y comienza a explorar emprendimientos en tu zona"
      button={registerBtn}
      imgSrc="/small_white_logo.png"
      imgPosition="left"
    />
  ];

  return (
    <div className="flex min-h-screen">
      {optPanelInicia}
      <div className="flex-2 flex flex-col items-center justify-center bg-white px-16">
        {AuthFormLogin}
      </div>
    </div>
  );
}
