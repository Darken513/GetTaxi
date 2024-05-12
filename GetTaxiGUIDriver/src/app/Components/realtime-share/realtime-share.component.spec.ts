import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RealtimeShareComponent } from './realtime-share.component';

describe('RealtimeShareComponent', () => {
  let component: RealtimeShareComponent;
  let fixture: ComponentFixture<RealtimeShareComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RealtimeShareComponent]
    });
    fixture = TestBed.createComponent(RealtimeShareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
