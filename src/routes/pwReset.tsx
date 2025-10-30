import { useState } from "react";
import { Link } from "react-router-dom";

import Input from "../components/ui/Input";
import PwForm from "../components/ui/PwForm";
import Btn from "../components/ui/Btn";
import { usePasswordReset } from "../hooks/usePasswordReset";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function PwReset() {
  const { requestPasswordReset, loading, error } = usePasswordReset();

  const [formValues, setFormValues] = useState({ correo: "" });
  const [success, setSuccess] = useState(false);

  const handleChange =
    (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormValues((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const handleSubmit = async () => {
    const email = formValues.correo.trim();

    // Validar email simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Por favor ingresa un correo válido", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    const result = await requestPasswordReset(email);

    if (result) {
      setSuccess(true);
      setFormValues({ correo: "" });
      toast.success("Correo enviado correctamente", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } else if (error) {
      toast.error("Ocurrió un error. Intenta de nuevo más tarde.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  if (success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background h-screen pt-30">
        <Link to="/login" className="absolute top-6 left-6">
          <img
            src="/small_dark_logo.png"
            alt="Logo"
            className="w-12 h-12"
          />
        </Link>

        <div className="bg-white rounded-xl p-10 w-1/2 text-center">
          <h2 className="text-2xl font-semibold text-slate-700 mb-4">
            Revisa tu correo electrónico
          </h2>
          <p className="text-slate-600">
            Si existe una cuenta con ese correo, te hemos enviado un enlace
            para restablecer tu contraseña.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block bg-black text-white font-semibold px-6 py-3 rounded-full hover:bg-green-600"
          >
            Volver al login
          </Link>
        </div>
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background h-screen pt-30">
      <Link to="/login" className="absolute top-6 left-6">
        <img src="/small_dark_logo.png" alt="Logo" className="w-12 h-12" />
      </Link>

      <PwForm
        title="Restablecer contraseña"
        text="Introduce tu correo electrónico, si existe una cuenta te enviaremos un enlace para restablecer tu contraseña"
        input={[
          <Input
            key="correo"
            type="email"
            placeholder="Correo electrónico"
            value={formValues.correo}
            onChange={handleChange("correo")}
          />,
        ]}
        button={[
          <Btn
            style="bg-brand hover:bg-brandDark text-white font-bold p-3 rounded-full w-full"
            key="restablecerPw"
            text={loading ? "Enviando..." : "Enviar enlace"}
            onClick={handleSubmit}
            disabled={loading}
          />,
        ]}
      />

      <ToastContainer />
    </div>
  );
}
