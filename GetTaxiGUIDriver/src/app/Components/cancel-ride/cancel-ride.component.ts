import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-cancel-ride',
  templateUrl: './cancel-ride.component.html',
  styleUrls: ['./cancel-ride.component.scss']
})
export class CancelRideComponent {
  ready:boolean = false;
  @Output() update:EventEmitter<any> = new EventEmitter();
  reasons:any = [
    //change driver reasons
    {id: 1, name: 'Passager introuvable', icon: 'fa-solid fa-user-xmark'},
    {id: 2, name: 'Aucun lien d\'arrêt possible', icon: 'fa-solid fa-map-location'},
    {id: 3, name: 'Bagages du passager trop volumineux', icon: 'fa-solid fa-suitcase-rolling'},
    {id: 4, name: 'Passagers trop nombreux', icon: 'fa-solid fa-users-slash'},
    {id: 5, name: 'Mineur non accompagné', icon: 'fa-solid fa-children'},
    {id: 6, name: 'Pas de siège enfant', icon: 'fa-regular fa-circle-xmark'},
    {id: 7, name: 'Le passager poséde un animal', icon: 'fa-solid fa-paw'},
    {id: 8, name: 'Comportement du passager', icon: 'fa-solid fa-triangle-exclamation'},
    {id: 9, name: 'Problème de véhicule', icon: 'fa-solid fa-car-on'}
  ];
  constructor() { }
  ngOnInit(): void {
    setTimeout(() => {
      this.ready = true;
    }, 250);
  }
  cancel(): void {
    this.ready = false;
    setTimeout(() => {
      this.update.emit({ cancel: true });
    }, 250);
  }
  selectReason(reason: any): void {
    this.update.emit({ reason });
    this.cancel();
  }
}
