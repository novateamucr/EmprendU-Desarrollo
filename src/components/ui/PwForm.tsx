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

        <div className={`flex-1 flex flex-col items-center justify-center gap-5 border-1 border-gray-200 rounded-xl p-16 px-16 ${props.style || ""}`}>
            <div className=" content-start w-xl text-left">
                <h2 className="text-3xl font-bold mb-4">Recuperación de contraseña</h2>
                <p className="mb-6">{props.text}</p>
            </div>
            {props.input}
            {props.button}
        </div>
    );
}