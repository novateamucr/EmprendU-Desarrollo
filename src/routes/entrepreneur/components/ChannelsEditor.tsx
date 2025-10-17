import { useEffect, useMemo, useRef, useState } from 'react';
import { useChannels } from '../../../hooks/useChannels';
import { Channel, CreateChannelDto, UpdateChannelDto } from '../../../services/channelService';
import { PLATFORM_LABELS, PLATFORM_ICONS, PlatformCode, buildWhatsAppUrl, parseWhatsAppUrl, sortChannels, buildMapsUrl, parseMapsUrl, parseEmailUrl } from '../../../utils/social';
import { Button } from '../../../components/ui/Button';
import MapsPicker from '../../../components/maps/MapsPicker';
import Input from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Star, Trash2, ArrowUp, ArrowDown, Loader2, Eye, EyeOff, Pencil, Check, X, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Props {
  entrepreneurshipId: number;
}

type Editable = {
  id?: number;
  platform_code: PlatformCode | '';
  url?: string | null;
  handle?: string | null;
  is_primary?: boolean;
  is_public?: boolean;
  display_order?: number;
  wa?: { phone?: string; message?: string };
  maps?: { query?: string };
};

const ALL_PLATFORMS: PlatformCode[] = [
  'whatsapp','instagram','facebook','linkedin','phone','linkhub','maps','website','youtube','pinterest','shop','tiktok','x','email','behance'
];

type Pending = { seconds: number; dto: UpdateChannelDto };

export default function ChannelsEditor({ entrepreneurshipId }: Props) {
  const { list, create, update, remove } = useChannels(entrepreneurshipId);
  const [drafts, setDrafts] = useState<Editable[]>([]);

  // Local optimistic copy of channels
  const [local, setLocal] = useState<Channel[]>([]);
  // Per-channel countdown timers and latest DTO to send
  const [pending, setPending] = useState<Record<number, Pending>>({});
  const timers = useRef<Record<number, any>>({});
  // Inline editing state per channel
  type EditingRow = { url: string; handle: string; wa?: { countryCode?: string; phone?: string; message?: string }; maps?: { query?: string } };
  const [editing, setEditing] = useState<Record<number, EditingRow>>({});
  // (tooltip de WhatsApp ahora aparece por hover, no requiere estado)

  // Sync local list when server data changes (only if nothing pending)
  useEffect(() => {
    const data = Array.isArray(list.data) ? list.data : [];
    // If there are no pending updates, sync; otherwise keep local edits
    if (Object.keys(pending).length === 0) setLocal(sortChannels(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.data]);

  const channels = useMemo(() => sortChannels(local), [local]);

  const addDraft = () => {
    setDrafts((d) => {
      const nonPrimaryCount = (local || []).filter((x) => !x.is_primary).length + d.length;
      const order = 20 + nonPrimaryCount * 10; // siempre inicia en 20
      return [
        ...d,
        { platform_code: '', is_public: true, is_primary: false, display_order: order },
      ];
    });
  };

  const commitDraft = async (idx: number) => {
    const d = drafts[idx];
    if (!d.platform_code) return toast.error('Selecciona una plataforma');

    // Build DTO with possible WhatsApp URL using CR code 506
    let dto: CreateChannelDto = {
      platform_code: d.platform_code,
      url: d.url || null,
      handle: d.handle || null,
      is_primary: !!d.is_primary,
      is_public: d.is_public !== false,
      display_order: d.display_order ?? 10,
    };

    if (d.platform_code === 'whatsapp') {
      const phone = d.wa?.phone || '';
      const message = d.wa?.message || '';
      const url = buildWhatsAppUrl({ countryCode: '506', phone, message });
      dto = { ...dto, url };
    } else if (d.platform_code === 'maps') {
      const query = d.maps?.query || '';
      const url = buildMapsUrl({ query });
      dto = { ...dto, url };
    } else if (d.platform_code === 'phone') {
      // Guardar número en handle (8 dígitos) y nombre del propietario en url (texto)
      const digits = (d.handle || '').replace(/[^\d]/g, '').slice(0, 8);
      dto = { ...dto, handle: digits, url: d.url || '' };
    } else if (d.platform_code === 'email') {
      const to = (d.handle || '').trim();
      const body = (d.url || '').trim();
      const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}${body ? `&body=${encodeURIComponent(body)}` : ''}`;
      dto = { ...dto, url: gmail, handle: to };
    }

    try {
      const created = await create.mutateAsync(dto);
      setDrafts((arr) => arr.filter((_, i) => i !== idx));
      setLocal((arr) => sortChannels([...(arr || []), created] as Channel[]));
      toast.success('Canal agregado');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'No se pudo crear el canal');
    }
  };

  // Helper: schedule an update with countdown; resets on subsequent presses
  const scheduleUpdate = (id: number, dto: UpdateChannelDto, seconds = 2) => {
    // Merge with any existing pending dto and reset timer seconds
    setPending((prev) => {
      const existing = prev[id];
      const merged: UpdateChannelDto = existing ? { ...existing.dto, ...dto } : dto;
      return { ...prev, [id]: { seconds, dto: merged } };
    });
    // Clear previous timer
    if (timers.current[id]) clearInterval(timers.current[id]);
    // Start countdown
    timers.current[id] = setInterval(async () => {
      setPending((prev) => {
        const p = prev[id];
        if (!p) return prev;
        const next = p.seconds - 1;
        if (next > 0) {
          return { ...prev, [id]: { ...p, seconds: next } };
        }
        // Time to send
        clearInterval(timers.current[id]);
        delete timers.current[id];
        const { dto: latest } = p;
        // Fire and forget; React Query invalidates list on success
        update.mutate({ id, dto: latest });
        const { [id]: _, ...rest } = prev;
        return rest as Record<number, Pending>;
      });
    }, 1000);
  };

  const makePrimary = (c: Channel | Editable, isDraft = false, index = -1) => {
    if (isDraft) {
      setDrafts((arr) => arr.map((it, i) => i === index ? { ...it, is_primary: true, display_order: 10 } : { ...it, is_primary: false }));
      return;
    }
    if (!('id' in c) || !c.id) return;
    // Si ya es primary: deshabilitar destacado y colocarlo como primer no-destacado (orden 20), empujando los demás +10
    if ((c as Channel).is_primary) {
      const currentId = c.id;
      // cancelar timer si existe
      if (timers.current[currentId]) { clearInterval(timers.current[currentId]); delete timers.current[currentId]; }
      setPending((p) => { const { [currentId]: _, ...rest } = p as any; return rest as Record<number, Pending>; });

      // Construir nuevos arreglos
      const others = sortChannels(local.filter((x) => !x.is_primary || x.id === currentId));
      // quitar el primary actual de others si estuviera marcado
      const nonPrimary = others.filter((x) => x.id !== currentId);
      // insertar el que fue primary al inicio como no-destacado
      const reinserted = [{ ...(c as Channel), is_primary: false }, ...nonPrimary];
      // normalizar órdenes 20,30,40...
      const normalized = reinserted.map((it, i) => ({ ...it, display_order: 20 + i * 10 }));
      setLocal(normalized);

      // Programar actualizaciones: el actual pierde primary y recibe 20; los demás desplazan +10 según corresponda
      scheduleUpdate(currentId, { is_primary: false, display_order: 20 });
      normalized.forEach((it, i) => {
        if (it.id && it.id !== currentId) {
          // calcular su orden esperado
          const expected = 20 + i * 10;
          if (it.display_order !== expected) scheduleUpdate(it.id, { display_order: expected });
        }
      });
      return;
    }

    // Si no es primary: aplicar destacado con SWAP de posiciones con el primary actual (si existe)
    const currentPrimary = local.find((x) => x.is_primary) || null;
    const clickedId = c.id;

    // Calcular el orden anterior del clicado dentro de los no-destacados
    const others = sortChannels(local.filter((x) => !x.is_primary));
    const idx = others.findIndex((x) => x.id === clickedId);
    const clickedPrevOrder = idx >= 0 ? (20 + idx * 10) : ((c as Channel).display_order ?? 20);

    // Actualizar estado local: clicado pasa a primary (10); el primary anterior (si existe) toma clickedPrevOrder y deja de ser primary
    setLocal((arr) => arr.map((it) => {
      if (it.id === clickedId) return { ...it, is_primary: true, display_order: 10 };
      if (currentPrimary && it.id === currentPrimary.id) return { ...it, is_primary: false, display_order: clickedPrevOrder };
      return { ...it, is_primary: false };
    }));

    // Si había primary anterior, cancelar su timer y desmarcarlo inmediatamente en backend con su nuevo orden para evitar conflicto de 2 primarios
    if (currentPrimary && currentPrimary.id) {
      if (timers.current[currentPrimary.id]) { clearInterval(timers.current[currentPrimary.id]); delete timers.current[currentPrimary.id]; }
      setPending((p) => { const { [currentPrimary.id!]: _, ...rest } = p as any; return rest as Record<number, Pending>; });
      update.mutate({ id: currentPrimary.id, dto: { is_primary: false, display_order: clickedPrevOrder } });
    }

    // Programar marcado del seleccionado con debounce
    scheduleUpdate(clickedId, { is_primary: true, display_order: 10 });
  };

  const move = (c: Channel, dir: 'up'|'down') => {
    if (!c.id) return;
    // Construir listas primaria y no primarias ordenadas por display_order
    const primary = local.find((x) => x.is_primary) || null;
    const others = sortChannels(local.filter((x) => !x.is_primary));
    const idx = others.findIndex((x) => x.id === c.id);
    if (idx === -1) return;

    // Límites: nunca menos de índice 0 (orden 20) y nunca más del último
    const targetIdx = dir === 'up' ? Math.max(0, idx - 1) : Math.min(others.length - 1, idx + 1);
    if (targetIdx === idx) return;

    // Intercambiar posiciones
    const swapped = [...others];
    const [item] = swapped.splice(idx, 1);
    swapped.splice(targetIdx, 0, item);

    // Normalizar órdenes: 20, 30, 40, ...
    const prevMap = new Map<number, number>();
    local.forEach((it) => { if (typeof it.id === 'number') prevMap.set(it.id, it.display_order ?? 0); });

    const normalized = swapped.map((it, i) => ({ ...it, is_primary: false, display_order: 20 + i * 10 }));
    const newLocal = primary ? [primary, ...normalized] : [...normalized];
    setLocal(sortChannels(newLocal));

    // Programar actualizaciones para items cuyo order cambió
    normalized.forEach((it) => {
      if (typeof it.id === 'number') {
        const prev = prevMap.get(it.id);
        if (prev !== it.display_order) scheduleUpdate(it.id, { display_order: it.display_order });
      }
    });
  };

  const togglePublic = (c: Channel) => {
    if (!c.id) return;
    setLocal((arr) => arr.map((it) => it.id === c.id ? { ...it, is_public: !it.is_public } : it));
    scheduleUpdate(c.id, { is_public: !c.is_public });
  };

  const removeChannel = async (c: Channel) => {
    if (!c.id) return;
    const idNum = c.id as number;
    try {
      // Cancel any pending timer
      if (timers.current[idNum]) { clearInterval(timers.current[idNum]); delete timers.current[idNum]; }
      setPending((p) => { const { [idNum]: _, ...rest } = p as any; return rest as Record<number, Pending>; });
      setLocal((arr) => arr.filter((it) => it.id !== c.id));
      await remove.mutateAsync(idNum);
      toast.success('Canal eliminado');
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  const renderRow = (c: Channel) => {
    const Icon = PLATFORM_ICONS[(c.platform?.code || 'website') as PlatformCode] || PLATFORM_ICONS.website;
    const nonPrimary = channels.filter((x) => !x.is_primary);
    const idx = nonPrimary.findIndex((it) => it.id === c.id);
    const canMoveUp = idx > 0;
    const canMoveDown = idx >= 0 && idx < nonPrimary.length - 1;
    const code = (c.platform?.code || '') as PlatformCode;
    const isWhatsapp = code === 'whatsapp';
    const isMaps = code === 'maps';
    const isPhone = code === 'phone';
    const isWebsite = code === 'website';
    const isShop = code === 'shop';
    const isEmail = code === 'email';
    const isEditing = !!(c.id && editing[c.id]);
    return (
      <div key={c.id} className="flex items-center gap-2 p-2 border rounded-lg bg-white">
        <Icon className="w-4 h-4 text-gray-600" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{PLATFORM_LABELS[(c.platform?.code || 'website') as PlatformCode] || c.platform?.label}</div>
          {!isEditing ? (
            <div className="text-xs text-gray-500 truncate">{c.url || c.handle || '—'}</div>
          ) : (
            <div className="flex flex-col gap-2">
              {isWhatsapp ? (
                <div className="grid grid-cols-2 gap-2 items-center">
                  <div className="relative">
                    <Input
                      value={editing[c.id!]?.wa?.phone || ''}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/[^\d]/g, '').slice(0, 8);
                        setEditing((m) => ({
                          ...m,
                          [c.id!]: { ...m[c.id!], wa: { ...m[c.id!]?.wa, phone: digits } }
                        }));
                      }}
                      placeholder="Teléfono (CR)"
                      className="pr-10"
                      inputMode="numeric"
                      maxLength={8}
                    />
                    <div className="absolute inset-y-0 right-3 my-auto h-6 w-6 flex items-center justify-center">
                      <div
                        className="relative group text-gray-500 hover:text-gray-700 select-none"
                        aria-hidden="true"
                      >
                        <Info className="w-4 h-4" />
                        <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 z-20 hidden group-hover:block bg-sky-700 text-white text-xs px-2 py-1 rounded shadow whitespace-nowrap">
                          Recuerda: número costarricense (506). Solo 8 dígitos.
                        </div>
                      </div>
                    </div>
                  </div>
                  <Input
                    value={editing[c.id!]?.wa?.message || ''}
                    onChange={(e) => setEditing((m) => ({
                      ...m,
                      [c.id!]: { ...m[c.id!], wa: { ...m[c.id!]?.wa, message: e.target.value } }
                    }))}
                    placeholder="Mensaje (opcional)"
                  />
                </div>
              ) : isPhone ? (
                <div className="grid grid-cols-2 gap-2 items-center">
                  <div className="relative">
                    <Input
                      value={editing[c.id!]?.handle || ''}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/[^\d]/g, '').slice(0, 8);
                        setEditing((m) => ({ ...m, [c.id!]: { ...m[c.id!], handle: digits } }));
                      }}
                      placeholder="Teléfono (CR)"
                      className="pr-10"
                      inputMode="numeric"
                      maxLength={8}
                    />
                    <div className="absolute inset-y-0 right-2 my-auto h-6 w-6 flex items-center justify-center">
                      <div className="relative group text-gray-500 hover:text-gray-700 select-none" aria-hidden="true">
                        <Info className="w-4 h-4" />
                        <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 z-20 hidden group-hover:block bg-sky-700 text-white text-xs px-2 py-1 rounded shadow whitespace-nowrap">
                          Recuerda: número costarricense (506). Solo 8 dígitos.
                        </div>
                      </div>
                    </div>
                  </div>
                  <Input
                    value={editing[c.id!]?.url || ''}
                    onChange={(e) => setEditing((m) => ({ ...m, [c.id!]: { ...m[c.id!], url: e.target.value } }))}
                    placeholder="Nombre del propietario"
                  />
                </div>
              ) : isEmail ? (
                (() => {
                  const parsed = parseEmailUrl(c.url);
                  const emailVal = editing[c.id!]?.handle ?? parsed.to ?? '';
                  const bodyVal = editing[c.id!]?.url ?? parsed.body ?? '';
                  return (
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <Input
                        value={emailVal}
                        onChange={(e) => setEditing((m) => ({ ...m, [c.id!]: { ...m[c.id!], handle: e.target.value } }))}
                        placeholder="Email de contacto"
                        type="email"
                      />
                      <Input
                        value={bodyVal}
                        onChange={(e) => setEditing((m) => ({ ...m, [c.id!]: { ...m[c.id!], url: e.target.value } }))}
                        placeholder="Mensaje (opcional)"
                      />
                    </div>
                  );
                })()
              ) : isMaps ? (
                <div className="grid grid-cols-1 gap-2">
                  <MapsPicker
                    initialAddress={editing[c.id!]?.maps?.query || parseMapsUrl(c.url).query || ''}
                    onConfirm={(picked) => {
                      const query = picked.address || '';
                      const url = buildMapsUrl({ query });
                      setEditing((m)=> ({ ...m, [c.id!]: { ...m[c.id!], maps: { query } } }));
                      const id = c.id!;
                      setLocal((arr) => arr.map((it) => it.id === id ? { ...it, url } : it));
                      // Persist immediately to avoid confusion (no debounce here)
                      update.mutate({ id, dto: { url } });
                      toast.success('Ubicación guardada');
                    }}
                  />
                  {editing[c.id!]?.maps?.query && (
                    <div className="text-xs text-gray-600 truncate">
                      Dirección seleccionada: {editing[c.id!]?.maps?.query}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={editing[c.id!]?.url}
                    onChange={(e) => setEditing((m) => ({ ...m, [c.id!]: { ...m[c.id!], url: e.target.value } }))}
                    placeholder="URL"
                  />
                  <Input
                    value={editing[c.id!]?.handle}
                    onChange={(e) => setEditing((m) => ({ ...m, [c.id!]: { ...m[c.id!], handle: e.target.value } }))}
                    placeholder={isWebsite ? 'Nombre de la página web' : isShop ? 'Nombre de la tienda online' : 'Usuario/Handle'}
                  />
                </div>
              )}
            </div>
          )}
        </div>
        <button className={`p-2 rounded ${c.is_primary ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`} title="Destacar" onClick={() => makePrimary(c)}>
          <Star fill={c.is_primary ? 'currentColor' : 'none'} className="w-4 h-4" />
        </button>
        <button className={`p-2 ${canMoveUp ? 'text-gray-500 hover:text-gray-700' : 'text-gray-300 cursor-not-allowed'}`} title="Subir" onClick={() => canMoveUp && move(c,'up')} disabled={!canMoveUp}>
          <ArrowUp className="w-4 h-4" />
        </button>
        <button className={`p-2 ${canMoveDown ? 'text-gray-500 hover:text-gray-700' : 'text-gray-300 cursor-not-allowed'}`} title="Bajar" onClick={() => canMoveDown && move(c,'down')} disabled={!canMoveDown}>
          <ArrowDown className="w-4 h-4" />
        </button>
        <button className="p-2 text-gray-500 hover:text-gray-700" title={c.is_public ? 'Ocultar' : 'Mostrar'} onClick={() => togglePublic(c)}>
          {c.is_public ? <Eye className="w-4 h-4"/> : <EyeOff className="w-4 h-4"/>}
        </button>
        {!isEditing ? (
          <button className="p-2 text-gray-500 hover:text-gray-700" title="Editar" onClick={() => {
            if (!c.id) return;
            const wa = isWhatsapp ? parseWhatsAppUrl(c.url) : undefined;
            const mp = isMaps ? parseMapsUrl(c.url) : undefined;
            const ep = isEmail ? parseEmailUrl(c.url) : undefined;
            setEditing((m) => ({
              ...m,
              [c.id!]: {
                url: isEmail ? (ep?.body || '') : (c.url || ''),
                handle: isEmail ? (ep?.to || c.handle || '') : (c.handle || ''),
                wa,
                maps: mp ? { query: mp.query || (typeof mp.lat === 'number' && typeof mp.lng === 'number' ? `${mp.lat},${mp.lng}` : '') } : undefined
              }
            }));
          }}>
            <Pencil className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button className="p-2 text-green-600 hover:text-green-700" title="Guardar" onClick={() => {
              const id = c.id!;
              const row = editing[id];
              if (!row) return;
              if (isWhatsapp) {
                const url = buildWhatsAppUrl({
                  countryCode: '506',
                  phone: row.wa?.phone,
                  message: row.wa?.message,
                });
                setLocal((arr) => arr.map((it) => it.id === id ? { ...it, url } : it));
                scheduleUpdate(id, { url });
              } else if (isPhone) {
                // Guardar número en handle (8 dígitos) y nombre del propietario en url (texto)
                setLocal((arr) => arr.map((it) => it.id === id ? { ...it, handle: row.handle, url: row.url } : it));
                scheduleUpdate(id, { handle: row.handle, url: row.url });
              } else if (isEmail) {
                const to = (row.handle || '').trim();
                const body = (row.url || '').trim();
                const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}${body ? `&body=${encodeURIComponent(body)}` : ''}`;
                setLocal((arr) => arr.map((it) => it.id === id ? { ...it, url: gmail, handle: to } : it));
                scheduleUpdate(id, { url: gmail, handle: to });
              } else if (isMaps) {
                const url = buildMapsUrl({ query: row.maps?.query || '' });
                setLocal((arr) => arr.map((it) => it.id === id ? { ...it, url } : it));
                scheduleUpdate(id, { url });
              } else {
                setLocal((arr) => arr.map((it) => it.id === id ? { ...it, url: row.url, handle: row.handle } : it));
                scheduleUpdate(id, { url: row.url, handle: row.handle });
              }
              setEditing((m) => { const { [id]: _, ...rest } = m; return rest; });
            }}>
              <Check className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700" title="Cancelar" onClick={() => {
              const id = c.id!;
              setEditing((m) => { const { [id]: _, ...rest } = m; return rest; });
            }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <button className="p-2 text-red-500 hover:text-red-600" title="Eliminar" onClick={() => removeChannel(c)}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const renderDraft = (d: Editable, idx: number) => {
    const PlatformIcon = d.platform_code && PLATFORM_ICONS[d.platform_code as PlatformCode];

    const isWhatsApp = d.platform_code === 'whatsapp';
    const isMaps = d.platform_code === 'maps';
    const isPhone = d.platform_code === 'phone';
    const isEmail = d.platform_code === 'email';
    const isWebsite = d.platform_code === 'website';
    const isShop = d.platform_code === 'shop';

    return (
      <div key={`draft-${idx}`} className="flex flex-col gap-2 p-3 border rounded-lg bg-gray-50">
        <div className="flex items-center gap-2">
          <Select value={d.platform_code} onChange={(e) => setDrafts(arr => arr.map((it,i)=> i===idx ? { ...it, platform_code: e.target.value as PlatformCode } : it))}>
            <option value="">Plataforma</option>
            {ALL_PLATFORMS.map((p) => (
              <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
            ))}
          </Select>
          {PlatformIcon ? <PlatformIcon className="w-4 h-4 text-gray-600"/> : null}
          <button className={`p-2 rounded ${d.is_primary ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`} title="Destacar" onClick={() => makePrimary(d, true, idx)}>
            <Star fill={d.is_primary ? 'currentColor' : 'none'} className="w-4 h-4" />
          </button>
        </div>

        {isWhatsApp ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
            <div className="relative">
              <Input
                placeholder="Teléfono (CR)"
                value={d.wa?.phone || ''}
                onChange={(e)=>{
                  const digits = e.target.value.replace(/[^\d]/g, '').slice(0, 8);
                  setDrafts(arr=>arr.map((it,i)=> i===idx? { ...it, wa: { ...(it.wa||{}), phone: digits }, url: buildWhatsAppUrl({ countryCode: '506', phone: digits, message: it.wa?.message || '' }) } : it));
                }}
                className="pr-12"
                inputMode="numeric"
                maxLength={8}
              />
              <div className="absolute inset-y-0 right-2 my-auto h-6 w-6 flex items-center justify-center">
                <div className="relative group text-gray-500 hover:text-gray-700 select-none" aria-hidden="true">
                  <Info className="w-4 h-4" />
                  <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 z-20 hidden group-hover:block bg-sky-700 text-white text-xs px-2 py-1 rounded shadow whitespace-nowrap">
                    Recuerda: número costarricense (506). Solo 8 dígitos.
                  </div>
                </div>
              </div>
            </div>
            <Input
              placeholder="Mensaje (opcional)"
              value={d.wa?.message || ''}
              className="md:col-span-2"
            />
          </div>
        ) : isPhone ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
            <div className="relative">
              <Input
                placeholder="Teléfono (CR)"
                value={d.handle || ''}
                onChange={(e)=>{
                  const digits = e.target.value.replace(/[^\d]/g, '').slice(0, 8);
                  setDrafts(arr=>arr.map((it,i)=> i===idx? { ...it, handle: digits } : it));
                }}
                className="pr-10"
                inputMode="numeric"
                maxLength={8}
              />
              <div className="absolute inset-y-0 right-2 my-auto h-6 w-6 flex items-center justify-center">
                <div className="relative group text-gray-500 hover:text-gray-700 select-none" aria-hidden="true">
                  <Info className="w-4 h-4" />
                  <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 z-20 hidden group-hover:block bg-sky-700 text-white text-xs px-2 py-1 rounded shadow whitespace-nowrap">
                    Recuerda: número costarricense (506). Solo 8 dígitos.
                  </div>
                </div>
              </div>
            </div>
            <Input
              placeholder="Nombre del propietario"
              value={d.url || ''}
              onChange={(e)=> setDrafts(arr=>arr.map((it,i)=> i===idx? { ...it, url: e.target.value } : it))}
              className="md:col-span-2"
            />
          </div>
        ) : isMaps ? (
          <div className="grid grid-cols-1 gap-2">
            <MapsPicker
              initialAddress={d.maps?.query || ''}
              onConfirm={(picked)=> {
                const query = picked.address || '';
                const url = buildMapsUrl({ query });
                setDrafts(arr=>arr.map((it,i)=> i===idx? { ...it, maps: { ...(it.maps||{}), query }, url } : it));
                toast.success('Ubicación seleccionada. Pulsa Agregar para guardar.');
              }}
            />
            {d.maps?.query && (
              <div className="text-xs text-gray-600 truncate">
                Dirección seleccionada: {d.maps?.query}
              </div>
            )}
          </div>
        ) : isEmail ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
            <Input
              placeholder="Email de contacto"
              type="email"
              value={d.handle || ''}
              onChange={(e)=> setDrafts(arr=>arr.map((it,i)=> i===idx? { ...it, handle: e.target.value } : it))}
            />
            <Input
              placeholder="Mensaje (opcional)"
              value={d.url || ''}
              onChange={(e)=> setDrafts(arr=>arr.map((it,i)=> i===idx? { ...it, url: e.target.value } : it))}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Input placeholder="URL" value={d.url || ''} onChange={(e)=> setDrafts(arr=>arr.map((it,i)=> i===idx? { ...it, url: e.target.value } : it))} />
            <Input placeholder={(isWebsite ? 'Nombre de la página web' : (isShop ? 'Nombre de la tienda online' : 'Handle/Usuario (opcional)'))} value={d.handle || ''} onChange={(e)=> setDrafts(arr=>arr.map((it,i)=> i===idx? { ...it, handle: e.target.value } : it))} />
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button type="button" onClick={() => commitDraft(idx)} disabled={create.isPending}>
            {create.isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Agregar'}
          </Button>
          <Button type="button" variant="outline" onClick={() => setDrafts((arr) => arr.filter((_, i) => i !== idx))}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Redes y contactos de tu emprendimiento</h2>
          <p className="text-sm text-muted-foreground">Administra tus canales, elige un destacado y controla qué es público u oculto.</p>
        </div>
        <Button type="button" onClick={addDraft}>Agregar red</Button>
      </div>

      {list.isLoading && (
        <div className="text-sm text-gray-500">Cargando...</div>
      )}

      <div className="space-y-2">
        {channels.map(renderRow)}
        {drafts.map(renderDraft)}
      </div>
    </div>
  );
}
