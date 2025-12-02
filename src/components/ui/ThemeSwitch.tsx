import { useDarkMode } from "../../hooks/useDarkMode";
//import { Moon, Sun } from "lucide-react"; 

export const ThemeSwitch = () => {
  const { isDark, toggleDarkMode } = useDarkMode();

  return (
    <button
      onClick={toggleDarkMode}
      className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
        isDark ? "bg-lime-400" : "bg-gray-300 border border-gray-300"
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full bg-white shadow-md transform transition ${
          isDark ? "translate-x-6" : "translate-x-0"
        }`}
      >
        
      </div>
    </button>
  );
};
