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

}

export default function AuthForm(props: AuthFormProps) {
   return (
    <div className={props.style +  " items-start"}>
        <h1 className="text-3xl font-bold pb-4 ">{props.title}</h1>
        {props.input}
        {props.newPw && <div className="pl-103  mb-4 pb-6">{props.newPw}</div>}
        {props.dividerText && <Divider text={props.dividerText} />}
        {props.toggle && <div className="my-4">{props.toggle}</div>} 
        {props.button}
    </div>
   );
}