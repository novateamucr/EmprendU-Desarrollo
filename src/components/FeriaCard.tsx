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
    <div className="max-w-sm p-4 3xl:p-5 bg-white dark:bg-cardDark rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition">
      
      <img
        className="w-full h-48 3xl:h-56 4xl:h-64  object-cover rounded-2xl"
        src={props.imgUrl}
        alt={props.title}
      />
      <div className="p-4 3xl:p-5 4xl:p-6">
       
        <h3 className="text-gray-900 dark:text-secondaryDark font-medium text-lg 3xl:text-xl 4xl:text-2xl mb-4 min-h-[56px] flex items-center">
          {props.title}
        </h3>

        <hr className="my-3 mb-4" />

        <div className="flex justify-between text-sm 3xl:text-base 4xl:text-lg text-gray-600 dark:text-secondaryDark mb-4">
          <span>{props.location}</span>
          <span>{props.time}</span>
          
        </div>

       
        <button
          onClick={props.onButtonClick}
          className="mt-4 w-full bg-brand hover:bg-brandDark text-white dark:bg-brandDark dark:hover:bg-brand py-2 3xl:py-2.5 rounded-full transition text-sm 3xl:text-base 4xl:text-lg"
        >
          {props.buttonText}
        </button>
      </div>
    </div>
  );
}
