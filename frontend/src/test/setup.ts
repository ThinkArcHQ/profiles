// Test setup file
import '@testing-library/jest-dom';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_URL = 'http://localhost:3000';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: process.env.VERBOSE_TESTS ? console.log : () => {},
  warn: console.warn,
  error: console.error,
};

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock WorkOS AuthKit
vi.mock('@workos-inc/authkit-nextjs', () => ({
  withAuth: vi.fn(),
  getUser: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Global test helpers
export const createMockRequest = (url: string, options: RequestInit = {}) => {
  return new Request(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
};

export const createMockProfile = (overrides: any = {}) => ({
  id: 1,
  workosUserId: 'user_123',
  slug: 'test-user',
  name: 'Test User',
  email: 'test@example.com',
  bio: 'Test bio',
  skills: ['JavaScript', 'TypeScript'],
  availableFor: ['meetings'],
  isPublic: true,
  isActive: true,
  linkedinUrl: null,
  otherLinks: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockUser = (overrides: any = {}) => ({
  id: 'user_123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  ...overrides,
});