import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatRoomHeader } from './chat-room-header';

describe('ChatRoomHeader', () => {
  let component: ChatRoomHeader;
  let fixture: ComponentFixture<ChatRoomHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatRoomHeader],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatRoomHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
