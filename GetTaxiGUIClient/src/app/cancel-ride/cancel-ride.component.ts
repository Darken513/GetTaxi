import { NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-cancel-ride',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './cancel-ride.component.html',
  styleUrl: './cancel-ride.component.scss'
})
export class CancelRideComponent implements OnInit{
  ready:boolean = false;
  @Output() update:EventEmitter<any> = new EventEmitter();
  reasons:any = [
    {id: 1, name: 'Temps d\'attente trop long', icon: 'fa-regular fa-hourglass-half'},
    {id: 2, name: 'Le chauffeur était introuvable', icon: 'fa-solid fa-user-xmark'},
    {id: 3, name: 'Le chauffeur ne se rapprochait pas', icon: 'fa-solid fa-map-location'},
    {id: 4, name: 'Le chauffeur m\'a demandé d\'annuler', icon: 'fa-solid fa-user-xmark'},
    {id: 5, name: 'Le chauffeur est arrivé en avance', icon: 'fa-regular fa-clock'},
    {id: 6, name: 'Autre', icon: 'fa-regular fa-question-circle'}
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

