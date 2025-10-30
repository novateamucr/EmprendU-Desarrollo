import { useNavigate, Link } from 'react-router-dom';
import { getDashboardPath } from '../utils/routeUtils';
import { useState } from 'react';
import { useUserLogin } from '../hooks/useUserLogin';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import AuthForm from '../components/ui/AuthForm';
import OptionPanel from '../components/ui/OptionPanel';
import Btn from '../components/ui/Btn';

export default function Login() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });
  
  const { login, loading: isLoading, error } = useUserLogin();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues(prev => ({ ...prev, [key]: e.target.value }));
  };

  // Check if all required fields are filled
  const isFormValid = formValues.email.trim() !== '' && formValues.password.trim() !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isSubmitting || !isFormValid) return;
    
    setIsSubmitting(true);
    
    try {
      console.log('Attempting login with:', formValues.email);
      const response = await login({
        email: formValues.email,
        password: formValues.password
      });
      
      if (response) {
        console.log('Login successful, updating auth context');
        
        // Ensure we have a valid response with token and user
        if (!response.token || !response.user) {
          throw new Error('Invalid login response: missing token or user data');
        }
        
        // Ensure the user object has all required fields
        const userData = {
          ...response.user,
          role: typeof response.user.role === 'string' ? parseInt(response.user.role, 10) : response.user.role,
          name: response.user.name || '',
          username: response.user.username || '',
          email: response.user.email || '',
          phone: response.user.phone || '',
          province: response.user.province || '',
          canton: response.user.canton || '',
          district: response.user.district || '',
          address: response.user.address || '',
          avatar_url: response.user.avatar_url || '',
          role_relation: response.user.role_relation || null,
          interests: response.user.interests || [],
          entrepreneurships: response.user.entrepreneurships || [],
          created_at: response.user.created_at || new Date().toISOString(),
          updated_at: response.user.updated_at || new Date().toISOString()
        };
        
        // Update auth context with the response
        authLogin({
          token: response.token,
          user: userData
        });
        
        console.log('User authenticated with role:', userData.role);
        
        // Redirect based on user role
        const dashboardPath = getDashboardPath(userData.role);
        console.log('Redirecting to:', dashboardPath);
        navigate(dashboardPath, { replace: true });
      }
    } catch (error: any) {
      console.error('Login error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Show error message to user
      // You can set an error state here to display in the UI
    } finally {
      setIsSubmitting(false);
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
      style="border-2 border-white text-white font-bold px-6 py-3 rounded-lg w-xs hover:bg-white hover:text-primary focus-brand "
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
      className="text-brand hover:text-brandDark hover:underline underline-offset-4 mt-4 text-sm place-self-end"
    >
      ¿Olvidaste tu contraseña?
    </Link>
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
    <div className="flex min-h-screen w-full bg-background">
      <div className="hidden md:block w-0 md:w-[35%] h-screen">
        {optPanelInicia}
      </div>
      <div className="flex flex-col items-center justify-center bg-background w-full md:w-3/4">
        <div className="w-full max-w-md p-4">
          <form onSubmit={handleSubmit} className="w-full">
            <AuthForm
              style="w-full"
              title="Inicia sesión"
              input={loginInputs}
              newPw={pwLink}
              button={[
                <button
                  key="login-button"
                  type="submit"
                  className={`w-full bg-brand hover:bg-brandDark text-white font-bold p-3 rounded-lg ${(!isFormValid || isLoading) ? 'opacity-50 cursor-not-allowed' : ''} focus-brand`}
                  disabled={!isFormValid || isLoading}
                >
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </button>
              ]}
            />
          </form>
          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="block md:hidden mt-6 text-center text-sm text-gray-600">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-brand font-semibold hover:underline">
              Regístrate aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
