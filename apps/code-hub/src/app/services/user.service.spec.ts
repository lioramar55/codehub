import { TestBed } from '@angular/core/testing';
import { UserService } from './user.service';
import { RealtimeGatewayService } from './realtime-gateway.service';
import { User } from '@codehub/shared-models';

// Mock console.error to reduce noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'test-uuid-12345-67890'),
  },
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

describe('UserService', () => {
  let service: UserService;
  let realtimeService: jest.Mocked<RealtimeGatewayService>;

  beforeEach(() => {
    const realtimeSpy = {
      createOrUpdateUser: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: RealtimeGatewayService, useValue: realtimeSpy },
      ],
    });

    service = TestBed.inject(UserService);
    realtimeService = TestBed.inject(
      RealtimeGatewayService
    ) as jest.Mocked<RealtimeGatewayService>;

    // Reset localStorage mock
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should save user to database on initialization', () => {
    // Don't clear mocks for this test since we need to check the constructor call
    expect(realtimeService.createOrUpdateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.stringMatching(/^user_/),
        avatarUrl: expect.stringContaining('dicebear.com'),
      })
    );
  });

  describe('updateUser', () => {
    beforeEach(() => {
      // Clear mocks for subsequent tests
      jest.clearAllMocks();
    });

    it('should update user with partial data', () => {
      const initialUser = service.currentUser();
      const update = { name: 'Updated Name' };

      service.updateUser(update);

      const updatedUser = service.currentUser();
      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.id).toBe(initialUser.id);
      expect(updatedUser.avatarUrl).toBe(initialUser.avatarUrl);
    });

    it('should persist updated user to localStorage', () => {
      const update = { name: 'New Name' };

      service.updateUser(update);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'codehub.currentUser',
        expect.stringContaining('"name":"New Name"')
      );
    });

    it('should save updated user to database', () => {
      const update = { name: 'Database User' };

      service.updateUser(update);

      expect(realtimeService.createOrUpdateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Database User',
        })
      );
    });

    it('should update multiple properties', () => {
      const update = {
        name: 'Multi Update',
        avatarUrl: 'https://example.com/new-avatar.jpg',
      };

      service.updateUser(update);

      const updatedUser = service.currentUser();
      expect(updatedUser.name).toBe('Multi Update');
      expect(updatedUser.avatarUrl).toBe('https://example.com/new-avatar.jpg');
    });
  });

  describe('loadOrGenerateUser', () => {
    it('should load user from localStorage when available', () => {
      const storedUser = {
        id: 'stored-user-id',
        name: 'Stored User',
        avatarUrl: 'https://example.com/stored.jpg',
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedUser));

      // Create new service instance to trigger loadOrGenerateUser
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          UserService,
          { provide: RealtimeGatewayService, useValue: realtimeService },
        ],
      });

      const newService = TestBed.inject(UserService);
      const loadedUser = newService.currentUser();

      expect(loadedUser).toEqual(storedUser);
      expect(realtimeService.createOrUpdateUser).toHaveBeenCalledWith(
        storedUser
      );
    });

    it('should generate new user when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);

      // Create new service instance to trigger loadOrGenerateUser
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          UserService,
          { provide: RealtimeGatewayService, useValue: realtimeService },
        ],
      });

      const newService = TestBed.inject(UserService);
      const generatedUser = newService.currentUser();

      expect(generatedUser.id).toBe('test-uuid-12345-67890');
      expect(generatedUser.name).toBe('user_test-');
      expect(generatedUser.avatarUrl).toContain('dicebear.com');
      expect(generatedUser.avatarUrl).toContain('user_test-');
    });

    it('should generate new user when localStorage has invalid JSON', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      // Create new service instance to trigger loadOrGenerateUser
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          UserService,
          { provide: RealtimeGatewayService, useValue: realtimeService },
        ],
      });

      const newService = TestBed.inject(UserService);
      const generatedUser = newService.currentUser();

      expect(generatedUser.id).toBe('test-uuid-12345-67890');
      expect(generatedUser.name).toBe('user_test-');
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Create new service instance to trigger loadOrGenerateUser
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          UserService,
          { provide: RealtimeGatewayService, useValue: realtimeService },
        ],
      });

      const newService = TestBed.inject(UserService);
      const generatedUser = newService.currentUser();

      expect(generatedUser.id).toBe('test-uuid-12345-67890');
      expect(generatedUser.name).toBe('user_test-');
    });
  });

  describe('persist', () => {
    it('should save user to localStorage', () => {
      const user = {
        id: 'persist-test-id',
        name: 'Persist Test User',
        avatarUrl: 'https://example.com/persist.jpg',
      };

      // Access private method through service instance
      (service as any).persist(user);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'codehub.currentUser',
        JSON.stringify(user)
      );
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage setItem error');
      });

      const user = {
        id: 'error-test-id',
        name: 'Error Test User',
        avatarUrl: 'https://example.com/error.jpg',
      };

      // Should not throw error
      expect(() => {
        (service as any).persist(user);
      }).not.toThrow();
    });
  });

  describe('generateUser', () => {
    it('should generate user with correct format', () => {
      const generatedUser = (service as any).generateUser();

      expect(generatedUser.id).toBe('test-uuid-12345-67890');
      expect(generatedUser.name).toBe('user_test-');
      expect(generatedUser.avatarUrl).toBe(
        'https://api.dicebear.com/9.x/thumbs/svg?seed=user_test-'
      );
    });

    it('should use first 5 characters of UUID for name', () => {
      // Mock different UUID
      (crypto.randomUUID as jest.Mock).mockReturnValue('abcdef-12345-67890');

      const generatedUser = (service as any).generateUser();

      expect(generatedUser.name).toBe('user_abcde');
    });
  });

  describe('saveUserToDatabase', () => {
    it('should call realtime service with user data', () => {
      const user = {
        id: 'db-test-id',
        name: 'Database Test User',
        avatarUrl: 'https://example.com/db.jpg',
      };

      (service as any).saveUserToDatabase(user);

      expect(realtimeService.createOrUpdateUser).toHaveBeenCalledWith(user);
    });
  });
});
