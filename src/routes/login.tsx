import { useNavigate, Link } from "react-router-dom";
import { getDashboardPath } from "../utils/routeUtils";
import { useState } from "react";
import { useUserLogin } from "../hooks/useUserLogin";
import { useAuth } from "../context/AuthContext";
import Input from "../components/ui/Input";
import AuthForm from "../components/ui/AuthForm";
import OptionPanel from "../components/ui/OptionPanel";
import Btn from "../components/ui/Btn";
import { toast } from "react-toastify";
import axios from "axios";

export default function Login() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });

  const { login, loading: isLoading, error } = useUserLogin();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);

  const handleChange =
    (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormValues((prev) => ({ ...prev, [key]: e.target.value }));
    };

  // Check if all required fields are filled
  const isFormValid =
    formValues.email.trim() !== "" && formValues.password.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isSubmitting || !isFormValid) return;

    setIsSubmitting(true);

    try {
      console.log("Attempting login with:", formValues.email);
      const response = await login({
        email: formValues.email,
        password: formValues.password,
      });

      if (response) {
        console.log("Login successful, updating auth context");

        // Ensure we have a valid response with token and user
        if (!response.token || !response.user) {
          throw new Error("Invalid login response: missing token or user data");
        }

        // Ensure the user object has all required fields
        const userData = {
          ...response.user,
          role:
            typeof response.user.role === "string"
              ? parseInt(response.user.role, 10)
              : response.user.role,
          name: response.user.name || "",
          username: response.user.username || "",
          email: response.user.email || "",
          phone: response.user.phone || "",
          province: response.user.province || "",
          canton: response.user.canton || "",
          district: response.user.district || "",
          address: response.user.address || "",
          avatar_url: response.user.avatar_url || "",
          role_relation: response.user.role_relation || null,
          interests: response.user.interests || [],
          entrepreneurships: response.user.entrepreneurships || [],
          created_at: response.user.created_at || new Date().toISOString(),
          updated_at: response.user.updated_at || new Date().toISOString(),
        };

        // Update auth context with the response
        authLogin({
          token: response.token,
          user: userData,
        });

        console.log("User authenticated with role:", userData.role);

        // Redirect based on user role
        const dashboardPath = getDashboardPath(userData.role);
        console.log("Redirecting to:", dashboardPath);
        navigate(dashboardPath, { replace: true });
      }
    } catch (error: any) {
      console.error("Login error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Show error message to user
      // You can set an error state here to display in the UI
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailToReset = formValues.email.trim();

    if (!emailToReset) {
      toast.error(
        "Por favor ingresa tu correo electrónico en el campo de inicio de sesión"
      );
      return;
    }

    try {
      setIsResetting(true);
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

      // Make the POST request to the password reset endpoint
      await axios.post(
        `${apiBaseUrl}/password/reset`,
        { email: emailToReset },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Show generic success message regardless of the response
      toast.success(
        "Si el correo existe, se ha enviado una nueva contraseña temporal"
      );
      setShowResetForm(false);
    } catch (error: any) {
      console.error("Password reset error:", error);
      // Show generic error message
      toast.error("Ha ocurrido un error al procesar la solicitud");
    } finally {
      setIsResetting(false);
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

    <div key="password" className="relative w-full">
      <Input
        type={showPassword ? "text" : "password"}
        placeholder="Contraseña"
        value={formValues.password}
        onChange={handleChange("password")}
        aria-label="Campo de contraseña"
        autoComplete="current-password"
        className="w-full pr-10"
      />
      <button
        type="button"
        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        onClick={() => setShowPassword((s) => !s)}
        className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-800 focus:outline-none"
      >
        {showPassword ? (
          // Eye Off Icon
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5"
          >
            <path d="M3 3l18 18" />
            <path d="M10.73 5.08A10.94 10.94 0 0 1 12 5c7 0 10 7 10 7a13.23 13.23 0 0 1-4.36 5.36M6.61 6.61A13.23 13.23 0 0 0 2 12s3 7 10 7a10.94 10.94 0 0 0 1.94-.17" />
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          </svg>
        ) : (
          // Eye Icon
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5"
          >
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>,
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
  const pwLink = (
    <button
      type="button"
      onClick={() => setShowResetForm(true)}
      className="text-brand hover:underline text-sm text-left w-full mt-2"
    >
      ¿Olvidaste tu contraseña?
    </button>
  );

  const resetForm = (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h3 className="font-medium text-gray-900 mb-2">Restablecer contraseña</h3>
      <p className="text-sm text-gray-600 mb-3">
        Se enviará una nueva contraseña temporal a:
        <span className="font-medium text-gray-900"> {formValues.email}</span>
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await handlePasswordReset(e);
        }}
        className="space-y-3"
      >
        <div className="p-3 bg-gray-100 rounded-md text-sm">
          <p className="font-medium">Correo electrónico:</p>
          <p className="text-gray-700">{formValues.email}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isResetting}
            className="flex-1 bg-brand hover:bg-brandDark text-white py-2 px-4 rounded-md disabled:opacity-50"
            onClick={(e) => {
              e.preventDefault();
              handlePasswordReset(e);
            }}
          >
            {isResetting ? "Enviando..." : "Enviar contraseña temporal"}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowResetForm(false);
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={isResetting}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );

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
              newPw={showResetForm ? null : pwLink}
              button={[
                <button
                  key="login-button"
                  type="submit"
                  className={`w-full bg-brand hover:bg-brandDark text-white font-bold p-3 rounded-lg ${
                    !isFormValid || isLoading
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  } focus-brand`}
                  disabled={!isFormValid || isLoading}
                >
                  {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                </button>,
              ]}
            />
            {showResetForm && resetForm}
          </form>
          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="block md:hidden mt-6 text-center text-sm text-gray-600">
            ¿No tienes cuenta?{" "}
            <Link
              to="/register"
              className="text-brand font-semibold hover:underline"
            >
              Regístrate aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
