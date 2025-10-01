import { X, UtensilsCrossed, Gem, Shirt, Paintbrush, Laptop, Dumbbell, Music, BookOpen } from 'lucide-react';

interface InterestCardProps {
  title: string;
  onRemove?: () => void;
  iconUrl?: string;
}

const iconMap = {
  'Comida': UtensilsCrossed,
  'Joyería': Gem,
  'Ropa': Shirt,
  'Arte': Paintbrush,
  'Tecnología': Laptop,
  'Deportes': Dumbbell,
  'Música': Music,
  'Libros': BookOpen,
};

export function InterestCard({ title, onRemove, iconUrl }: InterestCardProps) {
  const IconComponent = iconMap[title as keyof typeof iconMap] || UtensilsCrossed;

  return (
    <div className="relative group w-[136px] h-[96px] bg-white rounded-card border border-border shadow-soft flex flex-col items-center justify-center hover:shadow-lg transition-shadow">
      {iconUrl ? (
        <img src={iconUrl} alt={title} className="w-8 h-8 text-secondary mb-2" />
      ) : (
        <IconComponent className="w-8 h-8 text-secondary mb-2" />
      )}
      <span className="text-sm font-medium text-primary text-center px-2">
        {title}
      </span>
      
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
          aria-label={`Eliminar interés ${title}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
