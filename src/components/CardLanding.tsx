
interface CardLandingProps {
  title: string;
  icon: React.ReactNode;
  description: string;
}

export function CardLanding(props: CardLandingProps) {
  return (
      <div className="bg-white rounded-2xl shadow-md p-6 text-center hover:shadow-xl hover:scale-105 transition">
      <div className="flex justify-center mb-4 text-brandDark">{props.icon}</div>
      <h3 className="font-semibold text-lg">{props.title}</h3>
      <p className="text-gray-600 mt-2">{props.description}</p>
    </div>
  );
}
//hola soy ericka
