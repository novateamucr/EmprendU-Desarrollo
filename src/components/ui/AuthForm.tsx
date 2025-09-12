//import Input from "./Input";
import Divider from "./Divider";
//import Btn from "./Btn";

interface AuthFormProps {

    title: string;
    input: React.ReactNode[];
    newPw?: React.ReactNode[];
    dividerText?: string;
    button: React.ReactNode[];
    style: string;
    toggle?: React.ReactNode;
    type?: "submit" | "button" | "reset" | undefined;
}

export default function AuthForm(props: AuthFormProps) {
   return (
    <div className={`w-full ${props.style}`}>
        <div className="w-full max-w-md space-y-6">
            <h1 className="text-3xl font-bold text-center">{props.title}</h1>
            <div className="space-y-4 w-full">
                {props.input}
                {props.newPw && <div className="w-full">{props.newPw}</div>}
                {props.dividerText && <Divider text={props.dividerText} />}
                {props.toggle && <div className="w-full">{props.toggle}</div>} 
                <div className="w-full">
                    {props.button}
                </div>
            </div>
        </div>
    </div>
   );
}