import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useUserLogin } from '../hooks/useUserLogin';
import Input  from '../components/ui/Input';
import AuthForm from '../components/ui/AuthForm';
import OptionPanel from '../components/ui/OptionPanel';
import Btn from '../components/ui/Btn';

export default function Login() {
  const navigate = useNavigate();

  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });
  
  const { login, loading, error } = useUserLogin();

  const handleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues(prev => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({
      email: formValues.email,
      password: formValues.password
    })
    .then(result => {
      if (result) {
        // Redirect to home page or dashboard after successful login
        navigate('/');
      }
    });
  };

  // Inputs del login
  const loginInputs = [
    <Input
     
      key="email"
      type="email"
      placeholder="Correo electrónico"
      value={formValues.email}
      onChange={handleChange("email")}
    />,
    <Input
     
      key="password"
      type="password"
      placeholder="Contraseña"
      value={formValues.password}
      onChange={handleChange("password")}
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
      className="text-blue-600 hover:underline mt-4 text-sm place-self-end"
    >
      ¿Olvidaste tu contraseña?
    </Link>
  ];

  // Botón de login
  const loginBtn = [
    <button
      key="iniciar"
      type="submit"
      className="hover:bg-green-600 bg-black text-white font-black p-3 rounded-lg w-full disabled:opacity-50"
      disabled={loading}
    >
      {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
    </button>,
  ];

  // Formulario de autenticación
  const AuthFormLogin = [
    <div key="auth-form" className="w-[75%] ">
      <form  onSubmit={handleSubmit}>
        <AuthForm
          style="flex-2 flex flex-col items-center justify-center px-16 w-full "
          title="Inicia sesión"
          input={loginInputs}
          newPw={pwLink}
          button={loginBtn}
        />
      </form>
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
    </div>
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
    <div className="flex min-h-screen ">
      {optPanelInicia}
      <div className="flex flex-col items-center justify-center  bg-background w-[65%]">
        {AuthFormLogin}
      </div>
    </div>
  );
}
