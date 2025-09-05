import { useState } from "react";
import Input from '../ui/Input';
import AuthForm from '../ui/AuthForm';
import OptionPanel from '../ui/OptionPanel';
import Btn from '../ui/Btn';

export default function Login() {
  const [formValues, setFormValues] = useState({
    correo: "",
    password: "",
  });

  const handleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues(prev => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = () => {
    alert(JSON.stringify(formValues, null, 2)); 

    setFormValues({ 
      correo: "", 
      password: "" 
    }); 
  };

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

  const loginBtn = [
    <Btn
      style="hover:bg-gray-800 bg-gray-600 text-white font-black p-3 rounded-lg w-xl"
      text='Iniciar sesión'
      key="iniciar"
      onClick={handleSubmit} // ahora manda alerta con datos
    />,
  ];

  const registerBtn = [
    <Btn
      style="border-2 border-white text-white font-black px-6 py-3 rounded-lg w-xs hover:bg-gray-200 hover:text-gray-800 "
      key="crear"
      text="Crear cuenta"
      to="/register"
    />,
  ];

  const pwLink = [
    <a
      key="forgot"
      href="/pwreset"
      className="text-blue-600 hover:underline mt-4 text-sm"
    >
      ¿Olvidaste tu contraseña?
    </a>
  ];

  const AuthFormLogin = [
    <AuthForm
      style="flex-2 flex flex-col items-center justify-center bg-white px-16"
      title="Inicia sesión"
      input={loginInputs}
      newPw={pwLink}
      button={loginBtn}
    />
  ];

  const optPanelInicia = [
    <OptionPanel
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
