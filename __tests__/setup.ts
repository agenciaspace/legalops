import '@testing-library/jest-dom'

import { vi } from 'vitest'
vi.mock('next/headers', () => ({ headers: () => new Headers(), cookies: () => ({ get: () => undefined }) }))
