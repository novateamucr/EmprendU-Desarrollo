import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Input from "../components/ui/Input";
import Btn from "../components/ui/Btn";

export default function NewPw() {
  const navigate = useNavigate();

  const [formValues, setFormValues] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange =
    (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormValues((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formValues.newPassword !== formValues.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/password-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: formValues.newPassword }),
      });

      if (!res.ok) throw new Error("Error al actualizar la contraseña");

      setSuccess(true);
      setFormValues({ newPassword: "", confirmPassword: "" });

      // Opcional: redirigir al login después de unos segundos
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError("No se pudo actualizar la contraseña. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background h-screen pt-30">
        <Link to="/login" className="absolute top-6 left-6">
          <img src="/small_dark_logo.png" alt="Logo" className="w-12 h-12" />
        </Link>

        <div className="bg-white rounded-xl p-10 w-1/2 text-center">
          <h2 className="text-2xl font-bold text-slate-700 mb-4">
            Contraseña actualizada ✅
          </h2>
          <p className="text-slate-600">
            Tu contraseña ha sido actualizada correctamente. Redirigiendo al
            login...
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block bg-black text-white font-bold px-6 py-3 rounded-full hover:bg-green-600"
          >
            Ir al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background h-screen">
      <Link to="/login" className="absolute top-6 left-6">
        <img src="/small_dark_logo.png" alt="Logo" className="w-12 h-12" />
      </Link>

      <div className="items-center justify-center bg-white rounded-xl pb-16 w-1/2">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center gap-6 w-full px-10 mt-10"
        >
          <h2 className="text-2xl font-bold self-start pl-8">
            Crear nueva contraseña
          </h2>
          <p className="text-slate-500 self-start pl-8">
            Ingresa tu nueva contraseña y confírmala para continuar
          </p>

          <Input
            
            type="password"
            placeholder="Nueva contraseña"
            value={formValues.newPassword}
            onChange={handleChange("newPassword")}
          />

          <Input
            
            type="password"
            placeholder="Confirmar contraseña"
            value={formValues.confirmPassword}
            onChange={handleChange("confirmPassword")}
          />

          <Btn
            style="hover:bg-green-600 bg-black text-white font-black p-3 rounded-full w-[90%]"
            key="newPw"
            text={loading ? "Actualizando..." : "Guardar contraseña"}
            //type="submit"
            disabled={loading}
          />

          {error && (
            <p className="text-red-500 text-sm self-start pl-8">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}
