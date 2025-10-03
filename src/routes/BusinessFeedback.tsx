//ESTA YA NO SE USA, ERA SOLO PARA HACER PRUEBAS DEL POPUP
import { useState } from "react";
import Btn from "../components/ui/Btn";
import BusinessFeedbackPopup from "../components/ui/BusinessFeedback";
import { toast } from "react-toastify";
import { useAuth } from '../context/AuthContext';

export default function BusinessFeedbackTestPage() {
  const { token, user } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);

  // Función para enviar la review al backend
  const submitReview = async (rating: number, comments: string) => {
    setLoading(true);
    try {
      
      const response = await fetch("http://emprendu-backend.test/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: rating,
          review: comments,
          user_id: user?.id,         
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al enviar el review");
      }

      const data = await response.json();
      toast.success("¡Review enviado con éxito!");
      console.log("Review creado:", data);
      setShowPopup(false);
    } catch (err: any) {
      console.error("Error enviando review:", err);
      toast.error(err.message || "Error al enviar review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-6">
      <h1 className="text-3xl font-bold">Popup test</h1>

      <Btn
        style="bg-blue-600 text-white p-3 rounded-lg"
        key="abrirPopup"
        text="Abrir Feedback"
        onClick={() => setShowPopup(true)}
      />

      {showPopup && (
        <BusinessFeedbackPopup
          show={showPopup}
          title="¡Califica tu experiencia!"
          imageUrl=""
          onSubmit={(rating: number, comments: string) => {
            submitReview(rating, comments);
          }}
          onCancel={() => setShowPopup(false)}
        />
      )}
    </div>
  );
}
