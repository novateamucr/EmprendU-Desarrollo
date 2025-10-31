import { Pencil, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../domain/profile/types';

interface PanelPerfilProps {
  user: UserProfile;
  onContactInfoClick: () => void;
  onLocationInfoClick: () => void;
  hideEdit?: boolean;
}

export function PanelPerfil({ user, onContactInfoClick, onLocationInfoClick, hideEdit = false }: PanelPerfilProps) {
  const navigate = useNavigate();
  // Helper to derive initial for placeholder avatar
  const initial = (user.name || (user as any)?.email || 'U').trim().charAt(0).toUpperCase();
  // Derivar rol de manera robusta, priorizando id numérico si existe
  const rr: any = (user as any)?.role_relation;
  let displayedRole = '';
  if (rr?.id === 3) {
    displayedRole = 'Administrador';
  } else if (rr?.id === 2) {
    displayedRole = 'Emprendedor';
  } else if (rr?.id === 1) {
    displayedRole = 'Comprador';
  } else {
    const rawRole = (user as any)?.role || rr?.nombre || '';
    const normalizedRole = String(rawRole).toLowerCase();
    if (normalizedRole) {
      displayedRole = normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1);
    }
  }
  const isAdminRole = rr?.id === 3 || String(displayedRole).toLowerCase() === 'administrador';

  return (
    // Only apply the top offset on large screens so the panel doesn't visually
    // overlap the stacked content on small/mobile viewports.
    <div className="bg-white rounded-card shadow-soft border border-border p-6 relative lg:top-20">
    {!hideEdit && (
      <button
        onClick={() => navigate('/profile/edit')}
        className="absolute right-5 w-10 h-10 bg-brand text-white rounded-full flex items-center justify-center hover:bg-brandDark transition-colors focus-brand"
        aria-label="Editar perfil"
      >
        <Pencil className="w-5 h-5" />
      </button>
    )}

    {/* Avatar y información básica */}
    <div className="text-center mb-6">
      <div className="relative inline-block">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={`Avatar de ${user.name}`}
            className="w-32 h-32 rounded-full border-4 border-white shadow-soft mx-auto object-cover"
          />
        ) : (
          <div className="w-32 h-32 rounded-full border-4 border-white shadow-soft mx-auto bg-brand/20 flex items-center justify-center">
            <span className="text-brandDark text-4xl font-semibold select-none">{initial}</span>
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <p className={`inline-block px-2 py-0.5 rounded-full text-xs mb-2 ${isAdminRole ? 'bg-brand text-white' : 'bg-brand/5 text-secondary'}`}>
          {displayedRole}
        </p>
        <h1 className="text-xl font-semibold text-primary">{user.name}</h1>
        <p className="text-secondary">{user.username}</p>
      </div>
    </div>

      {/* Información de contacto */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-primary">Información de contacto</h3>
          <button
            onMouseEnter={onContactInfoClick}
            onFocus={onContactInfoClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onContactInfoClick(); }}
            className="p-1 hover:bg-brand/10 rounded-full transition-colors focus-brand"
            aria-label="Más información sobre contacto"
          >
            <Info className="w-4 h-4 text-secondary" />
          </button>
        </div>
        <div className="mt-1 h-0.5 w-12 bg-brand/40 rounded"></div>
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
            onMouseEnter={onLocationInfoClick}
            onFocus={onLocationInfoClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onLocationInfoClick(); }}
            className="p-1 hover:bg-brand/10 rounded-full transition-colors focus-brand"
            aria-label="Más información sobre ubicación"
          >
            <Info className="w-4 h-4 text-secondary" />
          </button>
        </div>
        <div className="mt-1 h-0.5 w-12 bg-brand/40 rounded"></div>
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
