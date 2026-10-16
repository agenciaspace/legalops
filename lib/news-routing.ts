export function newsPublicPath(pathname: string, newsDomain: boolean): string | null {
  if (/^\/news(?:\/(?:escritorios|departamentos-juridicos|prestadores|sobre|privacidade|feed\.xml|sitemap\.xml|robots\.txt)|\/noticias\/[a-z0-9-]+)?$/.test(pathname)) return pathname
  if (!newsDomain) return null
  if (pathname === '/') return '/news'
  if (/^\/(?:escritorios|departamentos-juridicos|prestadores|sobre|privacidade|feed\.xml|sitemap\.xml|robots\.txt)$/.test(pathname) || /^\/noticias\/[a-z0-9-]+$/.test(pathname)) return `/news${pathname}`
  return null
}
