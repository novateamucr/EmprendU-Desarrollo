//import Input from "./Input";
//import Btn from "./Btn";
import {  Link } from 'react-router-dom';

interface PwFormProps {
  style?: string;
  title: string;
  text: string;
  input: React.ReactNode[];
  button: React.ReactNode[];
}

export default function PwForm(props: PwFormProps) {
  return (
    <div className={`relative flex flex-col items-center justify-center gap-5 bg-white rounded-xl p-16 px-16 w-1/2 ${props.style || ""}`}>
      {/* X de cierre */}
      <Link
        to="/login"
        className="absolute top-4 right-4 text-slate-700 text-2xl font-bold hover:text-red-500"
      >
        ×
      </Link>

      <div className="">
        <h2 className="text-2xl font-bold mb-4">{props.title}</h2>
        <p>¿Olvidaste tu contraseña?</p>
        <p className="mb-6">{props.text}</p>
      </div>

      {props.input}
      {props.button}
    </div>
  );
}

