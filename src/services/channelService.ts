import { api } from '../lib/api';

export type Channel = {
  id?: number;
  entrepreneurship_id?: number;
  platform: { code: string; label?: string | null };
  platform_code?: string; // for POST/PUT
  url?: string | null;
  handle?: string | null;
  is_primary?: boolean;
  is_public?: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
};

export type CreateChannelDto = {
  platform_code: string;
  url?: string | null;
  handle?: string | null;
  is_primary?: boolean;
  is_public?: boolean;
  display_order?: number;
};

export type UpdateChannelDto = Partial<CreateChannelDto>;

export const channelService = {
  async list(entrepreneurshipId: number): Promise<Channel[]> {
    const { data } = await api.get(`/entrepreneurships/${entrepreneurshipId}/channels`);
    if (Array.isArray(data)) return data;
    if (data && Array.isArray((data as any).data)) return (data as any).data;
    return [];
  },

  async create(entrepreneurshipId: number, dto: CreateChannelDto): Promise<Channel> {
    const { data } = await api.post(`/entrepreneurships/${entrepreneurshipId}/channels`, dto);
    return data;
  },

  async update(entrepreneurshipId: number, channelId: number, dto: UpdateChannelDto): Promise<Channel> {
    const { data } = await api.put(`/entrepreneurships/${entrepreneurshipId}/channels/${channelId}`, dto);
    return data;
  },

  async remove(entrepreneurshipId: number, channelId: number): Promise<void> {
    await api.delete(`/entrepreneurships/${entrepreneurshipId}/channels/${channelId}`);
  },
};
