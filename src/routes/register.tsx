import { useState } from "react";
import { useNavigate } from 'react-router-dom';

import Input from "../components/ui/Input";
import AuthForm from "../components/ui/AuthForm";
import OptionPanel from "../components/ui/OptionPanel";
import Btn from "../components/ui/Btn";
import Toggle from '../components/ui/ToggleAccountType';
import { useUserRegistration } from '../hooks/useUserRegistration';
import { toast } from 'react-toastify';

export default function RouteComponent() {
  const { registerUser, loading, error } = useUserRegistration();
  const navigate = useNavigate();
  
  const [formValues, setFormValues] = useState({
    name: "",
    correo: "",
    password: "",
    confirm: "",
    tipoCuenta: "Soy comprador",
  });

  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres";
    }
    if (!/[A-Z]/.test(password)) {
      return "Debe contener al menos una letra mayúscula";
    }
    if (!/[0-9]/.test(password)) {
      return "Debe contener al menos un número";
    }
    return "valid"; // contraseña válida
  };

  const handleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setFormValues((prev) => ({ ...prev, [key]: value }));

  if (key === "password") {
    if (!value) {
      setPasswordMessage(null);
      setConfirmMessage(null);
      return;
    }

    const validation = validatePassword(value);
    if (validation === "valid") {
      setPasswordMessage("La contraseña es válida");
    } else {
      setPasswordMessage(validation);
    }

    if (formValues.confirm) {
      setConfirmMessage(
        value === formValues.confirm
          ? "Las contraseñas coinciden"
          : "Las contraseñas no coinciden"
      );
    } else {
      setConfirmMessage(null);
    }
  }

  if (key === "confirm") {
    if (!value) {
      setConfirmMessage(null);
      return;
    }

    setConfirmMessage(
      value === formValues.password
        ? "Las contraseñas coinciden"
        : "Las contraseñas no coinciden"
    );
  }
};

  const handleSubmit = async () => {
    if (passwordMessage !== "La contraseña es válida") {
      alert("La contraseña no cumple los requisitos");
      return;
    }
    if (confirmMessage !== "Las contraseñas coinciden ") {
      alert("Las contraseñas no coinciden");
      return;
    }

    const roleId = formValues.tipoCuenta === "Soy emprendedor" ? 2 : 1;

    const userData = {
      name: formValues.name,
      email: formValues.correo,
      password: formValues.password,
      role: roleId,
    };

    try {
      const result = await registerUser(userData);
      if (result) {
        toast.success("¡Cuenta creada con éxito! Por favor, inicia sesión.");
        navigate('/login');
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      const errorMessage = err?.message || 'Error en el registro. Por favor intente nuevamente.';
      alert(errorMessage);
    }
  };

  const toggleComponent = (
    <Toggle
      options={["Soy comprador", "Soy emprendedor"]}
      initial={formValues.tipoCuenta}
      onChange={(value) => setFormValues(prev => ({ ...prev, tipoCuenta: value }))}
    />
  );

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
              <div key="password" className="w-full">
                <Input
                  type="password"
                  placeholder="Contraseña"
                  value={formValues.password}
                  onChange={handleChange("password")}
                />
                {passwordMessage && (
                  <p
                    className={`text-sm mt-1 ${
                      passwordMessage === "La contraseña es válida"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {passwordMessage}
                  </p>
                )}
              </div>,
              <div key="confirm" className="w-full">
                <Input
                  type="password"
                  placeholder="Confirmar contraseña"
                  value={formValues.confirm}
                  onChange={handleChange("confirm")}
                />
                {confirmMessage && (
                  <p
                    className={`text-sm mt-1 ${
                      confirmMessage === "Las contraseñas coinciden"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {confirmMessage}
                  </p>
                )}
              </div>,
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
