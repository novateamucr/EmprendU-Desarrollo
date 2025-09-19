import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { getDashboardPath } from '../utils/routeUtils';
import { useAuth } from '../context/AuthContext';
import Input from "../components/ui/Input";
import AuthForm from "../components/ui/AuthForm";
import OptionPanel from "../components/ui/OptionPanel";
import Btn from "../components/ui/Btn";
import Toggle from '../components/ui/ToggleAccountType';
import { useUserRegistration } from '../hooks/useUserRegistration';

export default function RouteComponent() {
  const { registerUser, loading, error } = useUserRegistration();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formValues, setFormValues] = useState({
    name: "",
    correo: "",
    password: "",
    confirm: "",
    tipoCuenta: "Soy comprador",
  });

  const handleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues((prev) => ({ ...prev, [key]: e.target.value }));
  };


  const handleSubmit = async () => {
    // Validar que las contraseñas coincidan
    if (formValues.password !== formValues.confirm) {
      alert("Las contraseñas no coinciden");
      return;
    }

    // Mapear el tipo de cuenta a role ID (comprador = 1, emprendedor = 2)
    const roleId = formValues.tipoCuenta === "Soy emprendedor" ? 2 : 1;

    const userData = {
      name: formValues.name,
      email: formValues.correo,
      password: formValues.password,
      role: roleId,
    };

    try {
      const result = await registerUser(userData);
      
      if (result?.token) {
        // The registration was successful, now log the user in with the response data
        login({
          token: result.token,
          user: {
            id: result.id,
            name: result.name,
            email: result.email,
            role: result.role,
            phone: result.phone,
            province: result.province,
            canton: result.canton,
            district: result.district,
            address: result.address,
            avatar_url: result.avatar_url,
            created_at: result.created_at,
            updated_at: result.updated_at
          }
        });
        
        // Redirect based on role (3: Admin, 2: Entrepreneur, 1: Client)
        const dashboardPath = getDashboardPath(result.role);
        navigate(dashboardPath);
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      // Show error message to user
      const errorMessage = err?.message || 'Error en el registro. Por favor intente nuevamente.';
      alert(errorMessage);
    }
  };

  //const [accountType, setAccountType] = useState("Soy comprador");
  const toggleComponent = (
    <Toggle
      options={["Soy comprador", "Soy emprendedor"]}
      initial={formValues.tipoCuenta}
      onChange={(value) => setFormValues(prev => ({ ...prev, tipoCuenta: value }))}
    />
  );

  // Panel lateral
  const optPanelRegister = (
    <OptionPanel
      style="w-[25%] h-screen"
      title="¡Únete a nuestra comunidad!"
      text="Regístrate para descubrir y apoyar emprendimientos locales"
      button={[
        <Btn
          key="login"
          style="border-2 border-white text-white font-black px-6 py-3 rounded-lg w-xs hover:bg-gray-200 hover:text-gray-800"
          text="Iniciar sesión"
          onClick={() => navigate("/login")}
        />
      ]}
      imgSrc="/small_white_logo.png"
      imgPosition="left"
    />
  );

  return (
    <div className="flex min-h-screen w-full">
      {optPanelRegister}
      <div className="flex flex-col items-center justify-center bg-background w-full md:w-3/4">
        <div className="w-full max-w-md p-4">
          <AuthForm
            style="w-full"
            title="Crea tu cuenta"
            input={[
            <Input
             
              key="name"
              type="text"
              placeholder="Nombre completo"
              value={formValues.name}
              onChange={handleChange("name")}
            />,
            <Input
              
              key="correo"
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
            <Input
              
              key="confirm"
              type="password"
              placeholder="Confirmar contraseña"
              value={formValues.confirm}
              onChange={handleChange("confirm")}
            />,
          ]}
          dividerText="Tipo de cuenta"
          toggle={toggleComponent}
          button={[
            <button
              key="register"
              type="button"
              onClick={handleSubmit}
              className="hover:bg-green-600 bg-black text-white font-black p-3 rounded-lg w-full disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creando cuenta...' : 'Registrarme'}
            </button>
          ]}
        />
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
