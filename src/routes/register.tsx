import { useState } from "react";

import Input from "../components/ui/Input";
import AuthForm from "../components/ui/AuthForm";
import OptionPanel from "../components/ui/OptionPanel";
import Btn from "../components/ui/Btn";
import Toggle from '../components/ui/ToggleAccountType';



export default function RouteComponent() {
  const [formValues, setFormValues] = useState({
    correo: "",
    password: "",
    confirm: "",
    tipoCuenta: "Soy comprador",
  });

  const handleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = () => {
    alert(JSON.stringify(formValues, null, 2));

    //para limpiar los inputs
      setFormValues({
        correo: "",
        password: "",
        confirm: "",
        tipoCuenta: "",
      });
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
      <div className="flex-2 flex flex-col items-center justify-center bg-white px-16">
        <AuthForm
          style="flex-2 flex flex-col items-center justify-center bg-white px-16"
          title="Crea tu cuenta"
          input={[
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
            <Btn
              style="hover:bg-gray-800 bg-gray-600 text-white font-black p-3 rounded-lg w-xl"
              key="crear"
              text="Crear cuenta"
              onClick={handleSubmit}
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
