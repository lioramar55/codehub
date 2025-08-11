import { inject, Injectable, signal } from '@angular/core';
import { User } from '@codehub/shared-models';
import { RealtimeGatewayService } from './realtime-gateway.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly realtime = inject(RealtimeGatewayService);
  private storageKey = 'codehub.currentUser';
  readonly currentUser = signal<User>(this.loadOrGenerateUser());

  constructor() {
    // Save the user to database when service initializes
    this.saveUserToDatabase(this.currentUser());
  }

  updateUser(patch: Partial<User>) {
    this.currentUser.update((u) => {
      const updated = { ...u, ...patch } as User;
      this.persist(updated);
      this.saveUserToDatabase(updated);
      return updated;
    });
  }

  private loadOrGenerateUser(): User {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const user = JSON.parse(raw) as User;
        // Save to database when loading from localStorage
        this.saveUserToDatabase(user);
        return user;
      }
    } catch {
      console.error('Error loading user from localStorage');
    }
    const user = this.generateUser();
    this.persist(user);
    this.saveUserToDatabase(user);
    return user;
  }

  private persist(user: User) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(user));
    } catch {
      console.error('Error persisting user to localStorage');
    }
  }

  private generateUser(): User {
    const id = crypto.randomUUID();
    const name = `user_${id.slice(0, 5)}`;
    const avatarUrl = `https://api.dicebear.com/9.x/thumbs/svg?seed=${name}`;
    return { id, name, avatarUrl };
  }

  private saveUserToDatabase(user: User) {
    this.realtime.createOrUpdateUser(user);
  }
}
