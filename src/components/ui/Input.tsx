interface InputProps {

    type?: string;
    placeholder?: string;
    hover?: string;
    style?: string;
    value?: string; //con este talvez pueda servir para ir resando en tiempo real si el correo que van poniendo ya esta siendo utilizado
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
export default function Input(props: InputProps) {
    return (
        <input
            type={props.type}
            className={`bg-gray-300 p-3 rounded-lg w-xl mb-4 ${props.style || ""}`}
            placeholder={props.placeholder}
            onChange={props.onChange}
            onMouseOver={(e) => {
                if (props.hover) {
                    e.currentTarget.className = props.hover;
                }
            }}
            onMouseOut={(e) => {
                if (props.hover) {
                    e.currentTarget.className = `bg-gray-300 p-3 rounded-lg w-xl mb-4 ${props.style || ""}`;
                }
            }}
            value={props.value}
        />
    );
}
