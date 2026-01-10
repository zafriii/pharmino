import { useRouter } from 'next/navigation';
import { useCallback, useTransition } from 'react';

export const useOptimizedNavigation = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback((path: string) => {
    startTransition(() => {
      router.push(path);
    });
  }, [router]);

  const prefetch = useCallback((path: string) => {
    router.prefetch(path);
  }, [router]);

  return {
    navigate,
    prefetch,
    isPending,
  };
};