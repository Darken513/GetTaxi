import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerificationScreenComponent } from './verification-screen.component';

describe('VerificationScreenComponent', () => {
  let component: VerificationScreenComponent;
  let fixture: ComponentFixture<VerificationScreenComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VerificationScreenComponent]
    });
    fixture = TestBed.createComponent(VerificationScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
