interface ButtonProps {
  text: string;
  style: string;
}
export default function Button(props: ButtonProps) {
  return <button className={props.style}>{props.text}</button>;
}