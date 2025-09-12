//import Input from "./Input";
//import Btn from "./Btn";

interface PwFormProps {

    style?: string;
    title: string;
    text: string;
    input: React.ReactNode[];
    button: React.ReactNode[];

}

export default function Button(props: PwFormProps) {
    return (

        <div className={`flex flex-col items-center justify-center gap-5 bg-white rounded-xl p-16 px-16 w-1/2 ${props.style || ""}`}>
            <div className="">
                <h2 className="text-2xl font-bold mb-4">Recuperación de contraseña</h2>
                <p>¿Olvidaste tu contraseña?</p>
                <p className="mb-6">{props.text}</p>
            </div>
            {props.input}
            {props.button}
        </div>
    );
}