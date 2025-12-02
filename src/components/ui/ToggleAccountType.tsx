import { useState } from "react";

interface ToggleAccountTypeProps {  
  options: string[];
  onChange: (value: string) => void;
  initial?: string;
}

export default function Toggle(props: ToggleAccountTypeProps) {
  const [selected, setSelected] = useState(props.initial || props.options[0]);

  const handleClick = (option: string) => {
    setSelected(option);
    props.onChange(option);
  };

  return (
    <div className="flex  gap-2 bg-gray-300 dark:bg-cardDark dark:text-secondaryDark rounded-lg p-1 w-xl mb-5">
      {props.options.map((option) => (
        <button
          key={option}
          onClick={() => handleClick(option)}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
            selected === option ? "bg-brandDark dark:bg-brandDark text-white" : "text-gray-900 dark:text-secondaryDark hover:bg-gray-400/30 dark:hover:bg-gray-600/30"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

//bg-gray-300 p-3 rounded-lg w-xl mb-4