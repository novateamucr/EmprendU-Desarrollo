
interface FavoriteCardProps {
  title: string;
  imgUrl: string;
}

export function FavoriteCard({ title, imgUrl }: FavoriteCardProps) {
  return (
    <div className="flex flex-col items-center group cursor-pointer">
      <div className="w-[160px] h-[160px] rounded-full overflow-hidden border-2 border-border shadow-soft transition-transform group-hover:-translate-y-1">
        <img
          src={imgUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
      <span className="mt-3 text-sm font-medium text-primary text-center">
        {title}
      </span>
    </div>
    //hola soy ericka
  );
}
