interface OptionPanelProps {
  style?: string;
  title: string;
  text: string;
  button: React.ReactNode[];
  imgSrc?: string;
  imgPosition?: "left" | "right";
}

export default function OptionPanel(props: OptionPanelProps) {
  return (
    <div
      className={`relative flex flex-col justify-center items-center px-16 py-20 gap-6 shadow-lg w-[600px] max-w-full rounded-tr-2xl rounded-br-2xl bg-gradient-to-b from-[#76b0cd] to-[#417895] dark:from-[#2a4d6b] dark:to-[#1a2f42] ${props.style || ""}`}
    >
      {props.imgSrc && (
        <a href="/">
          <img
            src={props.imgSrc}
            alt="logo"
            className={`absolute top-6 animate-float ${
              props.imgPosition === "left" ? "left-6" : "right-6"
            } w-12 h-12`}
          />
        </a>
      )}

      <h1 className="text-4xl font-extrabold text-white mb-4 text-center">
        {props.title}
      </h1>
      <p className="text-white text-center mb-6 leading-relaxed text-lg">
        {props.text}
      </p>
      {props.button}
    </div>
  );
}
