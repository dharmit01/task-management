'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function NavigationLoggerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    const timestamp = new Date().toISOString();
    
    // Log to console
    console.log(`[CLIENT NAV] ${timestamp} - Navigated to: ${url}`);
    
    // You can send this to an analytics endpoint
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   body: JSON.stringify({ url, timestamp, type: 'navigation' })
    // }).catch(console.error);
  }, [pathname, searchParams]);

  return null;
}

export function NavigationLogger() {
  return (
    <Suspense fallback={null}>
      <NavigationLoggerInner />
    </Suspense>
  );
}
