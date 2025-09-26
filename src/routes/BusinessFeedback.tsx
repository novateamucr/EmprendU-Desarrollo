import { useState } from "react";
import Btn from "../components/ui/Btn";
import BusinessFeedbackPopup from "../components/ui/BusinessFeedback"; // tu nuevo popup

export default function BusinessFeedbackTestPage() {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-6">
      <h1 className="text-3xl font-bold">Popup test</h1>

      <Btn
        style="bg-blue-600 text-white p-3 rounded-lg"
        key="abrirPopup"
        text="Abrir Feedback"
        onClick={() => setShowPopup(true)}
      />

      {/* Aquí se muestra el popup solo si showPopup es true */}
      <BusinessFeedbackPopup
        show={showPopup}
        title="¡Califica tu experiencia!"
        imageUrl="https://via.placeholder.com/150"
        productName="Nombre_producto"
        onSubmit={(rating: number, comments: string) => {
          alert(`Rating: ${rating}\nComentarios: ${comments}`);
          setShowPopup(false); 
        }}
        onCancel={() => setShowPopup(false)}
      />
    </div>
  );
}
