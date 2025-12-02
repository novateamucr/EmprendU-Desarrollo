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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // ✅ Nuevo estado para mostrar mensaje de confirmación
  const [confirmationSent, setConfirmationSent] = useState(false);
  // ✅ Estado para detectar correo existente
  const [emailExists, setEmailExists] = useState(false);

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
      toast.error("La contraseña no cumple los requisitos", { position: "bottom-center" });
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
      setEmailExists(false); // Reset email exists state
      const result = await registerUser(userData);
      if (result) {
        // ✅ Cambiado para mostrar mensaje de confirmación en lugar de ir directo al login
        setConfirmationSent(true);
        toast.success("¡Cuenta creada! Revisa tu correo para confirmar tu cuenta.");
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      const errorMessage = err?.message || 'Error en el registro. Por favor intente nuevamente.';
      
      // Detectar si el error es por correo existente
      if (errorMessage.toLowerCase().includes('email') && 
          (errorMessage.toLowerCase().includes('existe') || 
           errorMessage.toLowerCase().includes('already') ||
           errorMessage.toLowerCase().includes('ya está') ||
           errorMessage.toLowerCase().includes('duplicado'))) {
        setEmailExists(true);
      } else {
        toast.error(errorMessage, { position: "bottom-center" });
      }
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
                style="border-2 border-white text-white font-bold px-6 py-3 rounded-lg w-xs hover:bg-white hover:text-primary focus-brand"
                text="Iniciar sesión"
                onClick={() => navigate("/login")}
              />
      ]}
      imgSrc="/small_white_logo.png"
      imgPosition="left"
    />
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="hidden md:block w-0 md:w-[35%] h-screen">
        {optPanelRegister}
      </div>
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
                <div className="relative w-full">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Contraseña"
                    value={formValues.password}
                    onChange={handleChange("password")}
                    className="w-full pr-10"
                    aria-label="Campo de contraseña"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-800 focus:outline-none"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                        <path d="M3 3l18 18" />
                        <path d="M10.73 5.08A10.94 10.94 0 0 1 12 5c7 0 10 7 10 7a13.23 13.23 0 0 1-4.36 5.36M6.61 6.61A13.23 13.23 0 0 0 2 12s3 7 10 7a10.94 10.94 0 0 0 1.94-.17" />
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
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
                <div className="relative w-full">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirmar contraseña"
                    value={formValues.confirm}
                    onChange={handleChange("confirm")}
                    className="w-full pr-10"
                    aria-label="Campo de confirmación de contraseña"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    aria-label={showConfirm ? "Ocultar confirmación" : "Mostrar confirmación"}
                    onClick={() => setShowConfirm((s) => !s)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-800 focus:outline-none"
                  >
                    {showConfirm ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                        <path d="M3 3l18 18" />
                        <path d="M10.73 5.08A10.94 10.94 0 0 1 12 5c7 0 10 7 10 7a13.23 13.23 0 0 1-4.36 5.36M6.61 6.61A13.23 13.23 0 0 0 2 12s3 7 10 7a10.94 10.94 0 0 0 1.94-.17" />
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
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
                  className="bg-brand hover:bg-brandDark text-white font-bold p-3 rounded-lg w-full disabled:opacity-50 focus-brand"
                  disabled={
                    loading ||
                    passwordMessage !== "La contraseña es válida" ||
                    confirmMessage !== "Las contraseñas coinciden"
                  }
                >
                  {loading ? 'Creando cuenta...' : 'Registrarme'}
                </button>
              ]}
          />

          {/* ✅ Mensaje de confirmación de correo */}
          {confirmationSent && (
            <div className="text-center p-6 bg-green-100 rounded-md mt-4">
              <h2 className="text-lg font-semibold mb-2">¡Registro exitoso!</h2>
              <p>Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.</p>
              <button
                onClick={() => navigate('/login')}
                className="mt-4 bg-brand hover:bg-brandDark text-white font-bold p-3 rounded-lg"
              >
                Ir a Login
              </button>
            </div>
          )}

          
          {emailExists && (
            <div className="text-center p-6 bg-yellow-50 border-2 border-yellow-400 rounded-md mt-4">
              <h2 className="text-lg font-semibold mb-2 text-yellow-800">Este correo ya está registrado</h2>
              <p className="text-gray-700 mb-4">
                Ya existe una cuenta con el correo <strong>{formValues.correo}</strong>.
                ¿Olvidaste tu contraseña?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate('/pwReset')}
                  className="bg-brand hover:bg-brandDark text-white font-bold p-3 rounded-lg"
                >
                  Recuperar contraseña
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold p-3 rounded-lg"
                >
                  Iniciar sesión
                </button>
              </div>
            </div>
          )}

          {error && !emailExists && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="block md:hidden mt-6 text-center text-sm text-gray-600">
            ¿Ya tienes cuenta?{" "}
            <a
              href="/login"
              className="text-brand font-semibold hover:underline"
              onClick={e => { e.preventDefault(); navigate('/login'); }}
            >
              Inicia sesión aquí
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
