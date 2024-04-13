import { Component, EventEmitter, Input, OnInit, Output, AfterViewInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

declare var google: any;

@Component({
  selector: 'app-address-autocomplete',
  templateUrl: './address-autocomplete.component.html',
  styleUrls: ['./address-autocomplete.component.scss'],
})
export class AddressAutocompleteComponent implements OnInit, AfterViewInit {
  @Input() customForm!: FormGroup;
  @Input() isCurrent: boolean = false;
  @Output() update: EventEmitter<any> = new EventEmitter();

  autocompleteInput: string = "";
  autocomplete: any;

  constructor() { }

  ngAfterViewInit(): void {
    this.initAutocomplete();
  }

  ngOnInit(): void {
  }

  initAutocomplete() {
    this.autocomplete = new google.maps.places.Autocomplete(
      document.getElementById(this.isCurrent ? "current_Addressformatted" : "destination_Addressformatted"),
      { types: ['geocode'] }
    );

    this.autocomplete.addListener('place_changed', () => {
      const place = this.autocomplete.getPlace();
      this.customForm.get((this.isCurrent ? "current_Addressformatted" : "destination_Addressformatted"))?.setValue(place.formatted_address);
      const roadNbr = place.address_components.find((col: any) => { return col.types && col.types.includes("street_number") })
      if (roadNbr) {
        this.customForm.get((this.isCurrent ? "current_roadNbr" : "destination_roadNbr"))?.setValue(roadNbr.short_name);
      }
    });
  }
}