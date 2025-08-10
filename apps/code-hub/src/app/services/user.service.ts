import { Injectable, signal, computed } from '@angular/core';
import { User } from '@codehub/shared-models';

@Injectable({ providedIn: 'root' })
export class UserService {
  readonly currentUser = signal<User>(this.generateUser());

  updateUser(patch: Partial<User>) {
    this.currentUser.update((u) => ({ ...u, ...patch }));
  }

  private generateUser(): User {
    const id = crypto.randomUUID();
    const name = `user_${id.slice(0, 5)}`;
    const avatarUrl = `https://api.dicebear.com/9.x/thumbs/svg?seed=${name}`;
    return { id, name, avatarUrl };
  }
}
