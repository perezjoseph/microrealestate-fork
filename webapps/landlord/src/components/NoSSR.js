import { useEffect, useState } from 'react';

/**
 * NoSSR component to prevent hydration mismatches
 * Use this wrapper for components that behave differently on server vs client
 */
export default function NoSSR({ children, fallback = null }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return fallback;
  }

  return <>{children}</>;
}
