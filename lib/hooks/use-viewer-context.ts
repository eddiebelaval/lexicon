'use client';

import { useEffect, useState } from 'react';
import {
  getCurrentUser,
  getPublicUniverses,
  getUserUniverses,
} from '@/lib/supabase';
import type { Universe } from '@/types';

interface ViewerContextState {
  userId: string | null;
  universes: Universe[];
  primaryUniverse: Universe | null;
  isAuthenticated: boolean;
  loading: boolean;
  source: 'user' | 'public';
}

const INITIAL_STATE: ViewerContextState = {
  userId: null,
  universes: [],
  primaryUniverse: null,
  isAuthenticated: false,
  loading: true,
  source: 'public',
};

export function useViewerContext(): ViewerContextState {
  const [state, setState] = useState<ViewerContextState>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;

    async function loadViewerContext() {
      try {
        const user = await getCurrentUser();

        let universes: Universe[] = [];
        let source: ViewerContextState['source'] = 'public';

        if (user) {
          universes = (await getUserUniverses(user.id)) ?? [];
          source = 'user';
        }

        if (universes.length === 0) {
          universes = (await getPublicUniverses()) ?? [];
          if (!user) {
            source = 'public';
          }
        }

        if (!cancelled) {
          setState({
            userId: user?.id ?? null,
            universes,
            primaryUniverse: universes[0] ?? null,
            isAuthenticated: Boolean(user),
            loading: false,
            source,
          });
        }
      } catch (error) {
        console.error('Failed to load viewer context:', error);

        if (!cancelled) {
          setState({
            ...INITIAL_STATE,
            loading: false,
          });
        }
      }
    }

    loadViewerContext();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
