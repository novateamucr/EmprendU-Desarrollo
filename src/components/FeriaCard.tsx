interface FeriaCardProps {
  title: string;
  imgUrl: string;
  location: string;
  time: string;
  buttonText?: string; 
  onButtonClick?: () => void;
  link?: string;
}

export function FeriaCard(props: FeriaCardProps) {
  return (
    <div className="max-w-sm p-4 bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition">
      
      <img
        className="w-full h-48 object-cover rounded-2xl"
        src={props.imgUrl}
        alt={props.title}
      />

     
      <div className="p-4">
       
        <h3 className="text-gray-900 font-medium text-lg mb-4 min-h-[56px] flex items-center">
          {props.title}
        </h3>

        <hr className="my-3 mb-4" />

        <div className="flex justify-between text-sm text-gray-600 mb-4">
          <span>{props.location}</span>
          <span>{props.time}</span>
          
        </div>

       
        <button
          onClick={props.onButtonClick}
          className="mt-4 w-full bg-brandLight text-white py-2 rounded-full hover:bg-brand transition"
        >
          {props.buttonText}
        </button>
      </div>
    </div>
  );
}
