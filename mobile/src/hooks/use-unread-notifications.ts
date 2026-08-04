import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { getUnreadCount, subscribeNotifications } from '@/lib/notification';

export function useUnreadNotifications(userId: string | null): number {
  const [unread, setUnread] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!userId) {
        setUnread(0);
        return;
      }
      let active = true;
      getUnreadCount(userId).then((count) => {
        if (active) setUnread(count);
      });
      return () => {
        active = false;
      };
    }, [userId]),
  );

  useEffect(() => {
    if (!userId) return;
    return subscribeNotifications(userId, () => {
      getUnreadCount(userId).then(setUnread);
    });
  }, [userId]);

  return unread;
}
