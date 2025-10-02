
interface FavoriteCardProps {
  title: string;
  imgUrl: string;
  onRemove?: () => void;
  loading?: boolean;
}

export function FavoriteCard({ title, imgUrl, onRemove, loading = false }: FavoriteCardProps) {
  return (
    <div className="flex flex-col items-center group">
      <div className="relative w-[160px] h-[160px] rounded-full overflow-hidden border-2 border-border shadow-soft transition-transform group-hover:-translate-y-1">
        <img
          src={imgUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
        {onRemove && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
            disabled={loading}
            className="absolute -top-2 -right-2 z-10 bg-white shadow-lg ring-1 ring-border hover:bg-white text-[#0A5B7A] rounded-full p-1.5 disabled:opacity-60"
            aria-label="Quitar de favoritos"
            title="Quitar de favoritos"
          >
            {/* Corazón relleno para indicar que ya es favorito */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.203 3 12.882 3 10.25 3 7.322 5.322 5 8.25 5c1.61 0 3.152.76 4.125 1.943A5.373 5.373 0 0116.5 5C19.478 5 21.75 7.272 21.75 10.25c0 2.632-1.688 4.953-3.989 7.257a25.18 25.18 0 01-4.244 3.17 15.247 15.247 0 01-.383.218l-.022.012-.007.003-.003.002a.75.75 0 01-.686 0l-.003-.002z" />
            </svg>
          </button>
        )}
      </div>
      <span className="mt-3 text-sm font-medium text-primary text-center">
        {title}
      </span>
    </div>
  );
}
