import { useEffect, useState } from 'react';
import { channelService, type Channel } from '../services/channelService';
import { PLATFORM_ICONS, PLATFORM_LABELS, type PlatformCode } from '../utils/social';
import { toast } from 'react-toastify';

interface Props {
  entrepreneurshipId: number;
}

////holis

export default function BusinessChannels({ entrepreneurshipId }: Props) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entrepreneurshipId) return;
    setLoading(true);
    channelService
      .list(entrepreneurshipId)
      .then((list) => {
        const onlyPublic = (list || []).filter((c) => c.is_public !== false);
        setChannels(onlyPublic);
      })
      .catch(() => setChannels([]))
      .finally(() => setLoading(false));
  }, [entrepreneurshipId]);

  if (loading) return null;
  if (!channels || channels.length === 0) return null;

  const primary = channels.find((c) => c.is_primary);
  const others = channels.filter((c) => !c.is_primary);

  const renderBtn = (c: Channel, variant: 'primary' | 'icon' = 'icon') => {
    const code = (c.platform?.code || 'website') as PlatformCode;
    const Icon = PLATFORM_ICONS[code] || PLATFORM_ICONS.website;
    const label = PLATFORM_LABELS[code] || c.platform?.label || code;

    const onClick = async () => {
      if (code === 'phone') {
        const num = (c.handle || '').toString();
        if (!num) return;
        try {
          await navigator.clipboard.writeText(num);
          toast.success('Número copiado');
        } catch {
          toast.error('No se pudo copiar');
        }
        return;
      }
      const url = c.url || '';
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    };

    if (variant === 'primary') {
      return (
        <button
          key={`ch-${c.id}`}
          onClick={onClick}
          className="px-4 py-2 rounded-full inline-flex items-center gap-2 bg-[#0A5B7A] text-white hover:opacity-90"
          title={label}
        >
          <Icon className="w-4 h-4" />
          <span className="text-sm">{label}</span>
        </button>
      );
    }

    return (
      <button
        key={`ch-${c.id}`}
        onClick={onClick}
        className="w-9 h-9 rounded-full inline-flex items-center justify-center bg-gray-100 hover:bg-gray-200"
        title={label}
      >
        <Icon className="w-4 h-4 text-gray-700" />
      </button>
    );
  };

  return (
    <div className="flex items-center gap-2">
      {primary ? renderBtn(primary, 'primary') : null}
      {others.map((c) => renderBtn(c, 'icon'))}
    </div>
  );
}
