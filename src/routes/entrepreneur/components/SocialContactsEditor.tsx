import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Star, Trash2, Pencil, Check, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { channelService, type Channel, type CreateChannelDto, type UpdateChannelDto } from '../../../services/channelService';
import { PLATFORM_ICONS, PLATFORM_LABELS, type PlatformCode, buildWhatsAppUrl, parseWhatsAppUrl, sortChannels } from '../../../utils/social';

interface Props {
  entrepreneurshipId: number;
}

type SocialType = 'whatsapp' | 'phone' | 'facebook' | 'instagram';

const MANAGED_PLATFORMS: SocialType[] = ['whatsapp', 'phone', 'facebook', 'instagram'];

type LocalItem = {
  id?: number;
  type: SocialType;
  is_primary: boolean;
  is_public: boolean;
  display_order: number;
  waPhone?: string;
  waMessage?: string;
  phoneNumber?: string;
  phoneOwner?: string;
  link?: string;
  profileName?: string;
};

function normalizeLocalPhoneInput(raw: string): string {
  const digitsOnly = raw.replace(/[^\d]/g, '');
  return digitsOnly.slice(0, 8);
}

type DraftItem = {
  type: SocialType | '';
  waPhone?: string;
  waMessage?: string;
  phoneNumber?: string;
  phoneOwner?: string;
  link?: string;
  profileName?: string;
};

function nextNonPrimaryOrder(items: LocalItem[]): number {
  const others = items.filter((i) => !i.is_primary);
  if (others.length === 0) return 20;
  const max = Math.max(...others.map((i) => i.display_order || 0));
  return Math.max(20, max + 10);
}

function mapChannelToLocal(c: Channel): LocalItem | null {
  const code = (c.platform?.code || c.platform_code || '') as PlatformCode;
  if (!MANAGED_PLATFORMS.includes(code as SocialType)) return null;

  if (code === 'whatsapp') {
    const parsed = parseWhatsAppUrl(c.url);
    return {
      id: c.id,
      type: 'whatsapp',
      is_primary: !!c.is_primary,
      is_public: c.is_public !== false,
      display_order: c.display_order ?? 0,
      waPhone: parsed.phone || '',
      waMessage: parsed.message || '',
    };
  }

  if (code === 'phone') {
    return {
      id: c.id,
      type: 'phone',
      is_primary: !!c.is_primary,
      is_public: c.is_public !== false,
      display_order: c.display_order ?? 0,
      // número principal desde url (nuevo esquema), con fallback a handle por compatibilidad
      phoneNumber: (c.url || c.handle || '') as string,
      // nombre del propietario desde handle si existe
      phoneOwner: (c.handle || '') as string,
    };
  }

  if (code === 'facebook' || code === 'instagram') {
    return {
      id: c.id,
      type: code,
      is_primary: !!c.is_primary,
      is_public: c.is_public !== false,
      display_order: c.display_order ?? 0,
      link: c.url || '',
      profileName: c.handle || '',
    };
  }

  return null;
}

function buildDtoFromLocal(item: LocalItem): { create: CreateChannelDto; update: UpdateChannelDto } {
  const base: CreateChannelDto = {
    platform_code: item.type,
    is_primary: item.is_primary,
    is_public: item.is_public,
    display_order: item.display_order,
  };

  if (item.type === 'whatsapp') {
    const url = buildWhatsAppUrl({ countryCode: '506', phone: item.waPhone || '', message: item.waMessage || '' });
    return {
      create: { ...base, url, handle: null },
      update: { ...base, url, handle: null },
    };
  }

  if (item.type === 'phone') {
    const digits = (item.phoneNumber || '').replace(/[^\d]/g, '').slice(0, 8);
    const owner = (item.phoneOwner || '').trim() || null;
    return {
      // número en url, propietario en handle
      create: { ...base, url: digits, handle: owner },
      update: { ...base, url: digits, handle: owner },
    };
  }

  if (item.type === 'facebook' || item.type === 'instagram') {
    const raw = (item.link || '').trim();
    const url = raw ? (/^https?:\/\//i.test(raw) ? raw : `https://${raw}`) : null;
    const handle = (item.profileName || '').trim() || null;
    return {
      create: { ...base, url, handle },
      update: { ...base, url, handle },
    };
  }

  return { create: base, update: base };
}

export default function SocialContactsEditor({ entrepreneurshipId }: Props) {
  const [original, setOriginal] = useState<Channel[]>([]);
  const [items, setItems] = useState<LocalItem[]>([]);
  const [draft, setDraft] = useState<DraftItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!entrepreneurshipId) return;
    setLoading(true);
    channelService
      .list(entrepreneurshipId)
      .then((list) => {
        setOriginal(list || []);
        const managed = (list || [])
          .map(mapChannelToLocal)
          .filter((x): x is LocalItem => !!x);
        const sorted = sortChannels(managed);
        setItems(sorted);
      })
      .finally(() => setLoading(false));
  }, [entrepreneurshipId]);

  const hasChanges = useMemo(() => {
    const managedOriginal = (original || []).filter((c) => MANAGED_PLATFORMS.includes((c.platform?.code || c.platform_code || '') as SocialType));
    if (managedOriginal.length !== items.length) return true;
    const byId = new Map<number, Channel>();
    managedOriginal.forEach((c) => {
      if (typeof c.id === 'number') byId.set(c.id, c);
    });
    for (const item of items) {
      if (!item.id) return true;
      const orig = byId.get(item.id);
      if (!orig) return true;
      const { update } = buildDtoFromLocal(item);
      if (
        update.display_order !== (orig.display_order ?? 0) ||
        update.is_primary !== !!orig.is_primary ||
        update.is_public !== (orig.is_public !== false) ||
        (update.url ?? null) !== (orig.url ?? null) ||
        (update.handle ?? null) !== (orig.handle ?? null)
      ) {
        return true;
      }
    }
    return false;
  }, [items, original]);

  const startDraft = () => {
    setDraft({ type: '' });
  };

  const cancelDraft = () => {
    setDraft(null);
  };

  const addFromDraft = () => {
    if (!draft || !draft.type) return;
    const baseOrder = nextNonPrimaryOrder(items);
    const local: LocalItem = {
      type: draft.type,
      is_primary: false,
      is_public: true,
      display_order: baseOrder,
    };
    if (draft.type === 'whatsapp') {
      local.waPhone = draft.waPhone || '';
      local.waMessage = draft.waMessage || '';
    } else if (draft.type === 'phone') {
      local.phoneNumber = draft.phoneNumber || '';
      local.phoneOwner = draft.phoneOwner || '';
    } else {
      local.link = draft.link || '';
      local.profileName = draft.profileName || '';
    }
    setItems((prev) => sortChannels([...prev, local]));
    setDraft(null);
  };

  const setPrimary = (index: number) => {
    setItems((prev) => {
      const copy = [...prev];
      const target = copy[index];
      if (!target) return prev;
      const wasPrimary = target.is_primary;
      if (wasPrimary) {
        const normalized = copy.map((it) => ({ ...it, is_primary: false }));
        let order = 20;
        const updated = normalized
          .map((it) => ({ ...it, display_order: it.is_primary ? 10 : 0 }))
          .map((it) => {
            if (it.is_primary) return it;
            const updatedItem = { ...it, display_order: order };
            order += 10;
            return updatedItem;
          });
        return sortChannels(updated);
      }
      const updated = copy.map((it, i) => ({
        ...it,
        is_primary: i === index,
      }));
      let order = 20;
      const withOrder = updated.map((it, i) => {
        if (i === index) return { ...it, display_order: 10 };
        const updatedItem = { ...it, display_order: order };
        order += 10;
        return updatedItem;
      });
      return sortChannels(withOrder);
    });
  };

  const move = (index: number, dir: 'up' | 'down') => {
    setItems((prev) => {
      const nonPrimary = prev.filter((i) => !i.is_primary);
      const primary = prev.find((i) => i.is_primary) || null;
      const target = prev[index];
      if (!target || target.is_primary) return prev;
      const idx = nonPrimary.indexOf(target);
      if (idx === -1) return prev;
      const targetIdx = dir === 'up' ? Math.max(0, idx - 1) : Math.min(nonPrimary.length - 1, idx + 1);
      if (targetIdx === idx) return prev;
      const swapped = [...nonPrimary];
      const [item] = swapped.splice(idx, 1);
      swapped.splice(targetIdx, 0, item);
      let order = 20;
      const normalized = swapped.map((it) => {
        const updatedItem = { ...it, is_primary: false, display_order: order };
        order += 10;
        return updatedItem;
      });
      const merged = primary ? [primary, ...normalized] : normalized;
      return sortChannels(merged);
    });
  };

  const togglePublic = (index: number) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, is_public: !it.is_public } : it)));
  };

  const removeAt = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingDraft, setEditingDraft] = useState<DraftItem | null>(null);

  const startEdit = (index: number) => {
    const item = items[index];
    if (!item) return;
    setEditingIndex(index);
    if (item.type === 'whatsapp') {
      setEditingDraft({ type: 'whatsapp', waPhone: item.waPhone || '', waMessage: item.waMessage || '' });
    } else if (item.type === 'phone') {
      setEditingDraft({ type: 'phone', phoneNumber: item.phoneNumber || '', phoneOwner: item.phoneOwner || '' });
    } else {
      setEditingDraft({ type: item.type, link: item.link || '', profileName: item.profileName || '' });
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingDraft(null);
  };

  const applyEdit = () => {
    if (editingIndex == null || !editingDraft || !editingDraft.type) return;
    setItems((prev) => {
      const copy = [...prev];
      const existing = copy[editingIndex];
      if (!existing) return prev;
      const updated: LocalItem = { ...existing };
      if (editingDraft.type === 'whatsapp') {
        updated.waPhone = editingDraft.waPhone || '';
        updated.waMessage = editingDraft.waMessage || '';
      } else if (editingDraft.type === 'phone') {
        updated.phoneNumber = editingDraft.phoneNumber || '';
        updated.phoneOwner = editingDraft.phoneOwner || '';
      } else {
        updated.link = editingDraft.link || '';
        updated.profileName = editingDraft.profileName || '';
      }
      copy[editingIndex] = updated;
      return copy;
    });
    setEditingIndex(null);
    setEditingDraft(null);
  };

  const handleSave = async () => {
    if (!entrepreneurshipId || !hasChanges) return;
    setSaving(true);
    try {
      const managedOriginal = (original || []).filter((c) => MANAGED_PLATFORMS.includes((c.platform?.code || c.platform_code || '') as SocialType));
      const originalById = new Map<number, Channel>();
      managedOriginal.forEach((c) => {
        if (typeof c.id === 'number') originalById.set(c.id, c);
      });

      const toCreate: LocalItem[] = [];
      const toUpdate: { id: number; dto: UpdateChannelDto }[] = [];
      const currentIds = new Set<number>();

      for (const item of items) {
        if (!item.id) {
          toCreate.push(item);
        } else {
          currentIds.add(item.id);
          const orig = originalById.get(item.id);
          const { update } = buildDtoFromLocal(item);
          if (!orig) {
            toUpdate.push({ id: item.id, dto: update });
          } else {
            const changed =
              update.display_order !== (orig.display_order ?? 0) ||
              update.is_primary !== !!orig.is_primary ||
              update.is_public !== (orig.is_public !== false) ||
              (update.url ?? null) !== (orig.url ?? null) ||
              (update.handle ?? null) !== (orig.handle ?? null);
            if (changed) toUpdate.push({ id: item.id, dto: update });
          }
        }
      }

      const toDelete = managedOriginal
        .filter((c) => typeof c.id === 'number' && !currentIds.has(c.id as number))
        .map((c) => c.id as number);

      for (const id of toDelete) {
        await channelService.remove(entrepreneurshipId, id);
      }
      for (const item of toCreate) {
        const { create } = buildDtoFromLocal(item);
        await channelService.create(entrepreneurshipId, create);
      }
      for (const { id, dto } of toUpdate) {
        await channelService.update(entrepreneurshipId, id, dto);
      }

      const refreshed = await channelService.list(entrepreneurshipId);
      setOriginal(refreshed || []);
      const managed = (refreshed || [])
        .map(mapChannelToLocal)
        .filter((x): x is LocalItem => !!x);
      setItems(sortChannels(managed));
    } finally {
      setSaving(false);
    }
  };

  const renderRow = (item: LocalItem, index: number) => {
    const isEditing = editingIndex === index && editingDraft != null;
    const Icon = PLATFORM_ICONS[item.type] || PLATFORM_ICONS.website;
    const label = PLATFORM_LABELS[item.type as PlatformCode] || item.type;
    const nonPrimary = items.filter((i) => !i.is_primary);
    const isNonPrimary = !item.is_primary;
    const npIndex = isNonPrimary ? nonPrimary.indexOf(item) : -1;
    const canMoveUp = isNonPrimary && npIndex > 0;
    const canMoveDown = isNonPrimary && npIndex >= 0 && npIndex < nonPrimary.length - 1;

    return (
      <div key={item.id ?? `local-${index}`} className="flex flex-col gap-2 p-2 border rounded-lg bg-white">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-600" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{label}</div>
            {!isEditing && (
              <div className="text-xs text-gray-500 truncate">
                {item.type === 'whatsapp' && (item.waPhone || '—')}
                {item.type === 'phone' && (item.phoneNumber || '—')}
                {(item.type === 'facebook' || item.type === 'instagram') && (item.link || '—')}
              </div>
            )}
          </div>
          <button
            type="button"
            className={`p-2 rounded ${item.is_primary ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
            onClick={() => setPrimary(index)}
          >
            <Star className="w-4 h-4" fill={item.is_primary ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            className={`p-2 ${canMoveUp ? 'text-gray-500 hover:text-gray-700' : 'text-gray-300 cursor-not-allowed'}`}
            disabled={!canMoveUp}
            onClick={() => move(index, 'up')}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            className={`p-2 ${canMoveDown ? 'text-gray-500 hover:text-gray-700' : 'text-gray-300 cursor-not-allowed'}`}
            disabled={!canMoveDown}
            onClick={() => move(index, 'down')}
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            className={`p-2 ${item.is_public ? 'text-gray-500 hover:text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => togglePublic(index)}
          >
            {item.is_public ? '👁️' : '🚫'}
          </button>
          {!isEditing ? (
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-gray-700"
              onClick={() => startEdit(index)}
            >
              <Pencil className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="p-2 text-green-600 hover:text-green-700"
                onClick={applyEdit}
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-2 text-gray-500 hover:text-gray-700"
                onClick={cancelEdit}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <button
            type="button"
            className="p-2 text-red-500 hover:text-red-600"
            onClick={() => removeAt(index)}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

          {isEditing && editingDraft && (
            <>
              {/* WhatsApp */}
              {editingDraft.type === 'whatsapp' && (
                <div className="mt-2 flex flex-col md:flex-row gap-1">
                  <div className="flex flex-1 items-stretch">
                    <span className="inline-flex items-center px-2 rounded-l-md border border-r-0 bg-gray-100 text-sm text-gray-600">
                      (+506)
                    </span>
                    <Input
                      placeholder="Número de WhatsApp (CR)"
                      value={editingDraft.waPhone || ''}
                      onChange={(e) => {
                        const digits = normalizeLocalPhoneInput(e.target.value);
                        setEditingDraft((prev) => (prev ? { ...prev, waPhone: digits } : prev));
                      }}
                      inputMode="numeric"
                      className="flex-1 rounded-l-none"
                    />
                  </div>
                  <Input
                    placeholder="Mensaje opcional"
                    value={editingDraft.waMessage || ''}
                    onChange={(e) =>
                      setEditingDraft((prev) =>
                        prev ? { ...prev, waMessage: e.target.value } : prev,
                      )
                    }
                    className="flex-1"
                  />
                </div>
              )}

              {/* Teléfono */}
              {editingDraft.type === 'phone' && (
                <div className="mt-2 flex flex-col md:flex-row gap-1">
                  <div className="flex flex-1 items-stretch">
                    <span className="inline-flex items-center px-2 rounded-l-md border border-r-0 bg-gray-100 text-sm text-gray-600">
                      (+506)
                    </span>
                    <Input
                      placeholder="Número de teléfono (CR)"
                      value={editingDraft.phoneNumber || ''}
                      onChange={(e) => {
                        const digits = normalizeLocalPhoneInput(e.target.value);
                        setEditingDraft((prev) =>
                          prev ? { ...prev, phoneNumber: digits } : prev,
                        );
                      }}
                      inputMode="numeric"
                      className="flex-1 rounded-l-none"
                    />
                  </div>
                  <Input
                    placeholder="Nombre del propietario"
                    value={editingDraft.phoneOwner || ''}
                    onChange={(e) =>
                      setEditingDraft((prev) =>
                        prev ? { ...prev, phoneOwner: e.target.value } : prev,
                      )
                    }
                    className="flex-1"
                  />
                </div>
              )}

              {/* Facebook / Instagram */}
              {(editingDraft.type === 'facebook' || editingDraft.type === 'instagram') && (
                <div className="mt-2 flex flex-col md:flex-row gap-1">
                  <Input
                    placeholder="Link del perfil/página"
                    value={editingDraft.link || ''}
                    onChange={(e) =>
                      setEditingDraft((prev) => (prev ? { ...prev, link: e.target.value } : prev))
                    }
                    className="flex-1"
                  />
                  <Input
                    placeholder="Nombre del perfil o usuario"
                    value={editingDraft.profileName || ''}
                    onChange={(e) =>
                      setEditingDraft((prev) =>
                        prev ? { ...prev, profileName: e.target.value } : prev,
                      )
                    }
                    className="flex-1"
                  />
                </div>
              )}
          </>
        )}



      </div>
    );
  };

  const renderDraftForm = () => {
    if (!draft) return null;
    return (
      <div className="mt-3 p-3 border rounded-lg bg-gray-50 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Select
            value={draft.type}
            onChange={(e) => setDraft((prev) => (prev ? { ...prev, type: e.target.value as SocialType } : prev))}
          >
            <option value="">Selecciona un tipo</option>
            {MANAGED_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {PLATFORM_LABELS[p as PlatformCode]}
              </option>
            ))}
          </Select>
        </div>

                {/* WhatsApp al agregar */}
        {draft.type === 'whatsapp' && (
          <div className="flex flex-col md:flex-row gap-1">
            <div className="flex flex-1 items-stretch">
              <span className="inline-flex items-center px-2 rounded-l-md border border-r-0 bg-gray-100 text-sm text-gray-600">
                (+506)
              </span>
              <Input
                placeholder="Número de WhatsApp (CR)"
                value={draft.waPhone || ''}
                onChange={(e) => {
                  const digits = normalizeLocalPhoneInput(e.target.value);
                  setDraft((prev) => (prev ? { ...prev, waPhone: digits } : prev));
                }}
                inputMode="numeric"
                className="flex-1 rounded-l-none"
              />
            </div>
            <Input
              placeholder="Mensaje opcional"
              value={draft.waMessage || ''}
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, waMessage: e.target.value } : prev))
              }
              className="flex-1"
            />
          </div>
        )}

        {/* Teléfono al agregar */}
        {draft.type === 'phone' && (
          <div className="flex flex-col md:flex-row gap-1">
            <div className="flex flex-1 items-stretch">
              <span className="inline-flex items-center px-2 rounded-l-md border border-r-0 bg-gray-100 text-sm text-gray-600">
                (+506)
              </span>
              <Input
                placeholder="Número de teléfono (CR)"
                value={draft.phoneNumber || ''}
                onChange={(e) => {
                  const digits = normalizeLocalPhoneInput(e.target.value);
                  setDraft((prev) => (prev ? { ...prev, phoneNumber: digits } : prev));
                }}
                inputMode="numeric"
                className="flex-1 rounded-l-none"
              />
            </div>
            <Input
              placeholder="Nombre del propietario"
              value={draft.phoneOwner || ''}
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, phoneOwner: e.target.value } : prev))
              }
              className="flex-1"
            />
          </div>
        )}

        {/* Facebook / Instagram al agregar */}
        {(draft.type === 'facebook' || draft.type === 'instagram') && (
          <div className="flex flex-col md:flex-row gap-1">
            <Input
              placeholder="Link del perfil/página"
              value={draft.link || ''}
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, link: e.target.value } : prev))
              }
              className="flex-1"
            />
            <Input
              placeholder="Nombre del perfil o usuario"
              value={draft.profileName || ''}
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, profileName: e.target.value } : prev))
              }
              className="flex-1"
            />
          </div>
        )}        

        <div className="flex justify-end gap-2">
          <Button type="button" onClick={addFromDraft} disabled={!draft.type}>
            Agregar
          </Button>
          <Button type="button" variant="outline" onClick={cancelDraft}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Redes y contactos de tu emprendimiento</h2>
          <p className="text-sm text-muted-foreground">
            Administra WhatsApp, Teléfono, Facebook e Instagram. Los cambios se guardan solo cuando pulses el botón Guardar.
          </p>
        </div>
        <Button type="button" onClick={startDraft} className="w-full sm:w-auto mt-2 sm:mt-0 px-4 py-2">
          Agregar
        </Button>
      </div>

      {loading && <div className="text-sm text-gray-500">Cargando redes y contactos...</div>}

      {!loading && items.length === 0 && !draft && (
        <div className="text-sm text-gray-500">Aún no has agregado redes ni contactos.</div>
      )}

      <div className="space-y-2">
        {items.map((item, index) => renderRow(item, index))}
        {renderDraftForm()}
      </div>

      <div className="pt-3 flex justify-end">
        <Button type="button" onClick={handleSave} disabled={!hasChanges || saving}>
          {saving ? 'Guardando...' : 'Guardar redes y contactos'}
        </Button>
      </div>
    </div>
  );
}
