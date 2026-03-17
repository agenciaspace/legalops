'use client'

import { useEffect } from 'react'

export function LocaleSync({ locale }: { locale: 'pt' | 'en' }) {
  useEffect(() => {
    localStorage.setItem('legalops-locale', locale)
  }, [locale])
  return null
}
