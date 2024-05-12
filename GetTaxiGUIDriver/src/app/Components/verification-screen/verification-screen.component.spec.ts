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

  describe('setCharAt', () => {
    it('should replace the character at the given index with the given character when the index is within the string length', () => {
      const str = "Hello";
      const index = 2;
      const chr = "x";
      const result = component.setCharAt(str, index, chr);
      expect(result).toBe("Hexlo");
    });

    it('should return the original string if the given string is empty', () => {
      const str = "";
      const index = 2;
      const chr = "x";
      const result = component.setCharAt(str, index, chr);
      expect(result).toBe("");
    });
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });

});