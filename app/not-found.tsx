'use client';

import { useEffect } from 'react';

export default function NotFound() {
  useEffect(() => {
    window.location.replace('/');
  }, []);

  return null;
}
