import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUserLogin } from '../hooks/useUserLogin';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import AuthForm from '../components/ui/AuthForm';
import OptionPanel from '../components/ui/OptionPanel';
import Btn from '../components/ui/Btn';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: authLogin } = useAuth();

  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });
  
  const { login, loading, error } = useUserLogin();

  const handleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues(prev => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with values:', formValues);
    
    try {
      console.log('Calling login function...');
      const response = await login({
        email: formValues.email,
        password: formValues.password
      });
      
      console.log('Login response received:', response);
      
      if (response) {
        console.log('Updating auth context with response:', response);
        
        // Ensure we have a valid response with token and user
        if (!response.token || !response.user) {
          throw new Error('Respuesta de inicio de sesión inválida');
        }
        
        // Update auth context with the response
        authLogin(response);
        
        // Get the redirect path from location state or default to home
        const from = location.state?.from?.pathname || '/';
        const role = response.user.role;
        
        console.log('User role:', role, 'Role type:', typeof role);
        
        // Define role-based redirects
        const roleRedirects: { [key: number]: string } = {
          1: '/gestor-usuarios',           // Admin
          2: '/entrepreneur/dashboard',    // Entrepreneur
          3: '/'                           // Regular User (home)
        };
        
        // Ensure role is a number for the lookup
        const roleNum = typeof role === 'string' ? parseInt(role, 10) : role;
        
        // Get the redirect path based on role, fallback to from location
        const redirectPath = roleRedirects[roleNum] || from;
        
        console.log('Redirecting to:', redirectPath, 'for role:', roleNum);
        
        // Use replace: true to prevent going back to login page with browser back button
        navigate(redirectPath, { replace: true });
      }
    } catch (error: any) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          data: error.config?.data
        }
      });
      // Error is already handled by useUserLogin hook
    }
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

  // Panel lateral
  const optPanelInicia = (
    <OptionPanel
      style="w-[25%] h-screen"
      title="¡Inicia ahora!"
      text="Ingresa tus datos y comienza a explorar emprendimientos en tu zona"
      button={registerBtn}
      imgSrc="/small_white_logo.png"
      imgPosition="left"
    />
  );

  return (
    <div className="flex min-h-screen w-full">
      {optPanelInicia}
      <div className="flex flex-col items-center justify-center bg-background w-full md:w-3/4">
        <div className="w-full max-w-md p-4">
          <form onSubmit={handleSubmit} className="w-full">
            <AuthForm
              style="w-full"
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
      </div>
    </div>
  );
}
