interface DividerProps {
  text: string;
}

export default function Divider(props: DividerProps) {
  return (
    <div className="flex items-center w-xl my-4">
      <div className="flex-grow border-t border-gray-400 dark:border-gray-600"></div>
      <span className="mx-2 text-gray-700 font-semibold dark:text-secondaryDark">{props.text}</span>
      <div className="flex-grow border-t border-gray-400 dark:border-gray-600"></div>
    </div>
  );
}
