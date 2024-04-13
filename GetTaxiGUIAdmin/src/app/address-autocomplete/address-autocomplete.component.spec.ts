import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddressAutocompleteComponent } from './address-autocomplete.component';

describe('AddressAutocompleteComponent', () => {
  let component: AddressAutocompleteComponent;
  let fixture: ComponentFixture<AddressAutocompleteComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddressAutocompleteComponent]
    });
    fixture = TestBed.createComponent(AddressAutocompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
