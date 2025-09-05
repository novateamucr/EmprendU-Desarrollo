import vision from "../assets/vision_8440711.png";

interface CardLandingProps {
  title: string;
  imgUrl: string;
  description: string;
}

export function CardLanding(props: CardLandingProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 text-center hover:shadow-xl hover:scale-105 transition">
      <div className="flex justify-center mb-4">
        <img
          src={vision}
          alt={props.title}
          className="w-12 h-12 object-contain"
        />
      </div>
      <h3 className="font-semibold text-lg">{props.title}</h3>
      <p className="text-gray-600 mt-2">{props.description}</p>
    </div>
  );
}
//hola soy ericka
