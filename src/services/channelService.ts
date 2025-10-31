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
    const { data } = await api.get<{ data: Channel[] }>(`/api/entrepreneurships/${entrepreneurshipId}/channels`);
    return data.data || [];
  },

  async create(entrepreneurshipId: number, dto: CreateChannelDto): Promise<Channel> {
    const { data } = await api.post<{ data: Channel }>(
      `/api/entrepreneurships/${entrepreneurshipId}/channels`,
      dto
    );
    return data.data;
  },

  async update(entrepreneurshipId: number, channelId: number, dto: UpdateChannelDto): Promise<Channel> {
    const { data } = await api.post<{ data: Channel }>(
      `/api/entrepreneurships/${entrepreneurshipId}/channels/${channelId}`,
      {
        ...dto,
        _method: 'PUT' // Laravel way to handle PUT with FormData
      }
    );
    return data.data;
  },

  async remove(entrepreneurshipId: number, channelId: number): Promise<void> {
    await api.delete(`/api/entrepreneurships/${entrepreneurshipId}/channels/${channelId}`);
  },
};
