'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AirtimeRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/payments'); }, [router]);
  return null;
}
