//import Input from "./Input";
//import Divider from "./Divider";
//import Btn from "./Btn";

interface OptionPanelProps {

    style?: string;
    title: string;
    text : string;
    button: React.ReactNode[];
    imgSrc?: string;
    imgPosition?: "left" | "right";

}

export default function OptionPanel(props: OptionPanelProps) {
   return (
    <div className={` relative flex-1 flex flex-col justify-center items-center bg-gray-900 px-12 gap-6 ${props.style || ""}`}>
      {props.imgSrc && (
        <img
          src={props.imgSrc}
          alt="logo"
          className={`absolute top-6 ${props.imgPosition === "left" ? "left-6" : "right-6"} w-12 h-12`}
        />
      )}

      <h1 className="text-3xl font-bold text-white mb-4">{props.title}</h1>
      <p className="text-white text-center mb-6">{props.text}</p>
      {props.button}
    </div>
  );
}