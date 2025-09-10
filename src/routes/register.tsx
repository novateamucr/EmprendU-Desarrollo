import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Input from "../components/ui/Input";
import AuthForm from "../components/ui/AuthForm";
import OptionPanel from "../components/ui/OptionPanel";
import Btn from "../components/ui/Btn";
import Toggle from '../components/ui/ToggleAccountType';
import { useUserRegistration } from '../hooks/useUserRegistration';



export default function RouteComponent() {
  const { registerUser, loading, error } = useUserRegistration();
  const navigate = useNavigate();
  
  const [formValues, setFormValues] = useState({
    name: "",
    username: "",
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

    // Mapear el tipo de cuenta a role ID (asumiendo: comprador = 1, emprendedor = 2)
    const roleId = formValues.tipoCuenta === "Soy emprendedor" ? 2 : 1;

    const userData = {
      name: formValues.name,
      username: formValues.username,
      email: formValues.correo,
      password: formValues.password,
      role: roleId,
    };

    const result = await registerUser(userData);
    
    if (result) {
      // Guardar token en cookies si existe
      if (result.token) {
        document.cookie = `auth_token=${result.token}; path=/; max-age=86400; secure; samesite=strict`;
      }
      
      // Registro exitoso - limpiar formulario
      setFormValues({
        name: "",
        username: "",
        correo: "",
        password: "",
        confirm: "",
        tipoCuenta: "Soy comprador",
      });
      
      // Redirigir a la página principal
      navigate("/");
    } else if (error) {
      alert(`Error: ${error}`);
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

  return (
    <div className="flex min-h-screen">
      <div className="flex-2 flex flex-col items-center justify-center bg-background px-16 w-[65%]">
        <AuthForm
          style="flex-2 flex flex-col items-center justify-center px-16 p-8"
          title="Crea tu cuenta"
          input={[
            <Input
              style="w-full"
              key="name"
              type="text"
              placeholder="Nombre completo"
              value={formValues.name}
              onChange={handleChange("name")}
            />,
            <Input
              style="w-full"
              key="username"
              type="text"
              placeholder="Nombre de usuario"
              value={formValues.username}
              onChange={handleChange("username")}
            />,
            <Input
              style="w-full"
              key="correo"
              type="email"
              placeholder="Correo electrónico"
              value={formValues.correo}
              onChange={handleChange("correo")}
            />,
            <Input
              style="w-full"
              key="password"
              type="password"
              placeholder="Contraseña"
              value={formValues.password}
              onChange={handleChange("password")}
            />,
            <Input
              style="w-full"
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
            <Btn
              key="crear"
              style="hover:bg-green-600 bg-black text-white font-black p-3 rounded-lg w-full"
              text={loading ? "Creando cuenta..." : "Crear cuenta"}
              onClick={handleSubmit}
              disabled={loading}
            />,
          ]}
        />
      </div>

      <OptionPanel
        title="¡Bienvenida!"
        text="Continúa explorando diferentes productos y emprendimientos en tu zona!"
        button={[
          <Btn
            style="border-2 border-white text-white font-black px-6 py-3 rounded-lg w-xs hover:bg-gray-200 hover:text-gray-800"
            key="iniciar"
            text="Iniciar sesión"
            to="/login"
          />,
        ]}
        imgSrc="/small_white_logo.png"
        imgPosition="right"
      />
    </div>
  );
}
