import { useCallback, useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { previousPage, visitPage } from './navigationHistory';

export type Page = 'welcome' | 'signin' | 'residence' | 'services' | 'home' | 'report' | 'inbox' | 'profile' | 'team';
const pages: Page[] = ['welcome', 'signin', 'residence', 'services', 'home', 'report', 'inbox', 'profile', 'team'];

// Keep the visit trail while the single-route prototype retains its form/session state.
export function usePageNavigation() {
  const { uiPage } = useLocalSearchParams<{ uiPage?: string }>();
  const page: Page = pages.includes(uiPage as Page) ? uiPage as Page : 'welcome';
  const history = useRef<Page[]>(page === 'welcome' ? ['welcome'] : ['welcome', page]);
  const pending = useRef<Page | null>(null);
  useEffect(() => {
    if (pending.current !== null) {
      if (pending.current === page) pending.current = null;
      return;
    }
    if (history.current.at(-1) !== page) history.current = visitPage(history.current, page, 'welcome');
  }, [page]);
  const setPage = useCallback((next: Page) => {
    const nextHistory = visitPage(history.current, next, 'welcome');
    if (nextHistory === history.current) return;
    history.current = nextHistory;
    pending.current = next;
    router.setParams({ uiPage: next });
  }, []);
  const goBack = useCallback(() => {
    if (pending.current !== null || history.current.length <= 1) return false;
    history.current = previousPage(history.current);
    const destination = history.current[history.current.length - 1];
    pending.current = destination;
    router.setParams({ uiPage: destination });
    return true;
  }, []);
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => pending.current !== null || goBack());
    return () => listener.remove();
  }, [goBack]);
  return { page, setPage, goBack };
}
