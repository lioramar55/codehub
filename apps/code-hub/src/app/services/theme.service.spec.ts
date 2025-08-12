import { TestBed } from '@angular/core/testing';
import { ThemeService, ThemeMode } from './theme.service';

// Mock console.error to reduce noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ThemeService],
    });

    service = TestBed.inject(ThemeService);

    // Clear all mocks before each test
    jest.clearAllMocks();

    // Reset document classList
    document.documentElement.classList.remove('dark');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default theme mode', () => {
    expect(service.theme()).toBeDefined();
    expect(['light', 'dark']).toContain(service.theme());
  });

  it('should compute isDark correctly', () => {
    expect(typeof service.isDark()).toBe('boolean');
  });

  describe('toggle', () => {
    it('should toggle from light to dark', () => {
      // Set initial theme to light
      (service as any).themeInternal.set('light');
      document.documentElement.classList.remove('dark');

      service.toggle();

      expect(service.theme()).toBe('dark');
      expect(service.isDark()).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should toggle from dark to light', () => {
      // Set initial theme to dark
      (service as any).themeInternal.set('dark');
      document.documentElement.classList.add('dark');

      service.toggle();

      expect(service.theme()).toBe('light');
      expect(service.isDark()).toBe(false);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should persist theme after toggle', () => {
      (service as any).themeInternal.set('light');

      service.toggle();

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'codehub.theme',
        'dark'
      );
    });
  });

  describe('setTheme', () => {
    it('should set theme to light', () => {
      service.setTheme('light');

      expect(service.theme()).toBe('light');
      expect(service.isDark()).toBe(false);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should set theme to dark', () => {
      service.setTheme('dark');

      expect(service.theme()).toBe('dark');
      expect(service.isDark()).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should persist theme when set', () => {
      service.setTheme('dark');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'codehub.theme',
        'dark'
      );
    });

    it('should apply theme class to document', () => {
      service.setTheme('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      service.setTheme('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('loadInitial', () => {
    it('should load light theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('light');

      // Create new service instance to trigger loadInitial
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [ThemeService],
      });

      const newService = TestBed.inject(ThemeService);
      expect(newService.theme()).toBe('light');
    });

    it('should load dark theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('dark');

      // Create new service instance to trigger loadInitial
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [ThemeService],
      });

      const newService = TestBed.inject(ThemeService);
      expect(newService.theme()).toBe('dark');
    });

    it('should use system preference when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);
      (window.matchMedia as jest.Mock).mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      // Create new service instance to trigger loadInitial
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [ThemeService],
      });

      const newService = TestBed.inject(ThemeService);
      expect(newService.theme()).toBe('dark');
    });

    it('should use light theme when system preference is light', () => {
      localStorageMock.getItem.mockReturnValue(null);
      (window.matchMedia as jest.Mock).mockImplementation((query) => ({
        matches: false, // prefers light
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      // Create new service instance to trigger loadInitial
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [ThemeService],
      });

      const newService = TestBed.inject(ThemeService);
      expect(newService.theme()).toBe('light');
    });

    it('should ignore invalid localStorage values', () => {
      localStorageMock.getItem.mockReturnValue('invalid-theme');

      // Create new service instance to trigger loadInitial
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [ThemeService],
      });

      const newService = TestBed.inject(ThemeService);
      expect(['light', 'dark']).toContain(newService.theme());
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Create new service instance to trigger loadInitial
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [ThemeService],
      });

      const newService = TestBed.inject(ThemeService);
      expect(['light', 'dark']).toContain(newService.theme());
    });

    it('should handle missing matchMedia gracefully', () => {
      localStorageMock.getItem.mockReturnValue(null);
      Object.defineProperty(window, 'matchMedia', {
        value: undefined,
      });

      // Create new service instance to trigger loadInitial
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [ThemeService],
      });

      const newService = TestBed.inject(ThemeService);
      expect(newService.theme()).toBe('light'); // default fallback
    });
  });

  describe('persist', () => {
    it('should save theme to localStorage', () => {
      (service as any).persist('dark');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'codehub.theme',
        'dark'
      );
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage setItem error');
      });

      // Should not throw error
      expect(() => {
        (service as any).persist('dark');
      }).not.toThrow();
    });
  });

  describe('applyThemeClass', () => {
    it('should add dark class for dark theme', () => {
      (service as any).applyThemeClass('dark');

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should remove dark class for light theme', () => {
      // First add the class
      document.documentElement.classList.add('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      // Then remove it
      (service as any).applyThemeClass('light');

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should handle multiple theme changes', () => {
      (service as any).applyThemeClass('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      (service as any).applyThemeClass('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);

      (service as any).applyThemeClass('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('theme mode types', () => {
    it('should accept valid theme modes', () => {
      expect(() => service.setTheme('light')).not.toThrow();
      expect(() => service.setTheme('dark')).not.toThrow();
    });

    it('should have correct theme mode type', () => {
      const theme: ThemeMode = service.theme();
      expect(['light', 'dark']).toContain(theme);
    });
  });
});
