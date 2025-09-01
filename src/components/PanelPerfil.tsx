import { Pencil, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../domain/profile/types';

interface PanelPerfilProps {
  user: UserProfile;
  onContactInfoClick: () => void;
  onLocationInfoClick: () => void;
}

export function PanelPerfil({ user, onContactInfoClick, onLocationInfoClick }: PanelPerfilProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-card shadow-soft border border-border p-6 sticky top-20 ">
      {/* Avatar y información básica */}
      <div className="text-center mb-6">
        <div className="relative inline-block">
          <img
            src={user.avatarUrl}
            alt={`Avatar de ${user.name}`}
            className="w-32 h-32 rounded-full border-4 border-white shadow-soft mx-auto"
          />
          <button
            onClick={() => navigate('/perfil/editar')}
            className="absolute -bottom-1 -right-1 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
            aria-label="Editar perfil"
          >
            <Pencil className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mt-4">
          <span className="inline-block px-3 py-1 bg-background text-secondary text-xs font-medium rounded-full mb-2">
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </span>
          <h1 className="text-xl font-semibold text-primary">{user.name}</h1>
          <p className="text-secondary">@{user.username}</p>
        </div>
      </div>

      {/* Información de contacto */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-primary">Información de contacto</h3>
          <button
            onClick={onContactInfoClick}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Más información sobre contacto"
          >
            <Info className="w-4 h-4 text-secondary" />
          </button>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-secondary">
            <span className="font-medium">Email:</span> {user.email}
          </p>
          {user.phone && (
            <p className="text-secondary">
              <span className="font-medium">Teléfono:</span> {user.phone}
            </p>
          )}
        </div>
      </div>

      {/* Ubicación */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-primary">Ubicación</h3>
          <button
            onClick={onLocationInfoClick}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Más información sobre ubicación"
          >
            <Info className="w-4 h-4 text-secondary" />
          </button>
        </div>
        <div className="space-y-1 text-sm text-secondary">
          {user.location.province && (
            <p>{user.location.province}</p>
          )}
          {user.location.canton && (
            <p>{user.location.canton}</p>
          )}
          {user.location.district && (
            <p>{user.location.district}</p>
          )}
          {user.location.address && (
            <p className="text-xs mt-2">{user.location.address}</p>
          )}
        </div>
      </div>
    </div>
  );
}
