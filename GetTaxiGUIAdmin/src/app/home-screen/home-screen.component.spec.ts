import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminHomeScreenComponent } from './home-screen.component';

describe('HomeScreenComponent', () => {
  let component: AdminHomeScreenComponent;
  let fixture: ComponentFixture<AdminHomeScreenComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminHomeScreenComponent]
    });
    fixture = TestBed.createComponent(AdminHomeScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
