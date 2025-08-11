import { Injectable, signal } from '@angular/core';
import { User } from '@codehub/shared-models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private storageKey = 'codehub.currentUser';
  readonly currentUser = signal<User>(this.loadOrGenerateUser());

  updateUser(patch: Partial<User>) {
    this.currentUser.update((u) => {
      const updated = { ...u, ...patch } as User;
      this.persist(updated);
      return updated;
    });
  }

  private loadOrGenerateUser(): User {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) return JSON.parse(raw) as User;
    } catch {
      console.error('Error loading user from localStorage');
    }
    const user = this.generateUser();
    this.persist(user);
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
}
