import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'chat',
    pathMatch: 'full',
  },
  {
    path: 'chat',
    loadComponent: () =>
      import('./components/chat-layout/chat-layout.component').then(
        (m) => m.ChatLayoutComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/chat-room/chat-room.component').then(
            (m) => m.ChatRoomComponent
          ),
      },
      {
        path: ':roomId',
        loadComponent: () =>
          import('./components/chat-room/chat-room.component').then(
            (m) => m.ChatRoomComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'chat',
  },
];
