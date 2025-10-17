import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { channelService, CreateChannelDto, UpdateChannelDto } from '../services/channelService';

export function useChannels(entrepreneurshipId: number) {
  const qc = useQueryClient();
  const key = ['channels', entrepreneurshipId];

  const list = useQuery({
    queryKey: key,
    queryFn: () => channelService.list(entrepreneurshipId),
  });

  const create = useMutation({
    mutationFn: (dto: CreateChannelDto) => channelService.create(entrepreneurshipId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const update = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateChannelDto }) => channelService.update(entrepreneurshipId, id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => channelService.remove(entrepreneurshipId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { list, create, update, remove };
}
