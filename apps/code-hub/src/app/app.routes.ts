import { Route } from '@angular/router';
import { ChatRoom } from './pages/chat-room/chat-room';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'chat',
    pathMatch: 'full',
  },
  {
    path: 'chat',
    component: ChatRoom,
  },
  {
    path: 'chat/:roomId',
    component: ChatRoom,
  },
  {
    path: '**',
    redirectTo: 'chat',
  },
];
