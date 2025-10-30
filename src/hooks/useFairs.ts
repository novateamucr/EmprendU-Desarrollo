import { useEffect, useMemo, useState } from 'react';
import { Fair, fairApi } from '../services/fairService';
import { userApi, User } from '../services/userService';

interface UseFairsOptions {
  page?: number; // reserved for future pagination support
}

interface OwnerMap { [userId: number]: string }

export default function useFairs(_opts: UseFairsOptions = {}) {
  const [fairs, setFairs] = useState<Fair[]>([]);
  const [owners, setOwners] = useState<OwnerMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const fairsList = await fairApi.getAll();
      setFairs(fairsList || []);

      // Try to use owner if included by API, else fetch distinct user_ids
      const map: OwnerMap = {};
      const missingUserIds = new Set<number>();

      (fairsList || []).forEach((f: any) => {
        // If backend included owner object
        if (f.owner && typeof f.owner === 'object' && f.owner.name) {
          map[f.user_id] = f.owner.name;
        } else if (typeof f.user_id === 'number') {
          missingUserIds.add(f.user_id);
        }
      });

      // Only fetch users we still don't have in map
      const toFetch = Array.from(missingUserIds).filter((id) => map[id] === undefined);
      if (toFetch.length > 0) {
        const fetched = await Promise.allSettled(toFetch.map((id) => userApi.getById(id)));
        fetched.forEach((res, i) => {
          const uid = toFetch[i];
          if (res.status === 'fulfilled' && res.value) {
            map[uid] = (res.value as User).name;
          } else {
            // fallback placeholder
            map[uid] = `#${uid}`;
          }
        });
      }

      setOwners(map);
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const fairsWithOwner = useMemo(() => {
    return fairs.map(f => ({
      ...f,
      owner_name: owners[f.user_id] || `#${f.user_id}`,
    }));
  }, [fairs, owners]);

  return { fairs: fairsWithOwner, rawFairs: fairs, owners, loading, error, refetch: fetchAll };
}
