// hooks/usePasswordReset.ts
import { useState } from "react";

export function usePasswordReset() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPasswordReset = async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Error en la solicitud");
      }

      // No importa si el correo existe o no, devolvemos true
      return true;
    } catch (err: any) {
      setError(err.message || "Error desconocido");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { requestPasswordReset, loading, error };
}
