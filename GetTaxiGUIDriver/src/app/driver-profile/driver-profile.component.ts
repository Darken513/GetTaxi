import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DriverService } from '../driver.service';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-driver-profile',
  templateUrl: './driver-profile.component.html',
  styleUrls: ['./driver-profile.component.scss']
})
export class DriverProfileComponent {
  @Input() driverId: string = "";
  @Input() driver: any; //todo-P3 : use modals

  @Input() carTypes: any[] = []; //todo-P3 : use modals
  @Input() carBrands: any[] = []; //todo-P3 : use modals
  @Input() zones: any[] = []; //todo-P3 : use modals

  @Output() update: EventEmitter<any> = new EventEmitter();

  public subs: Array<Subscription> = []; //todo-P3 : make sure to unsbscribe !

  constructor(
    public driverService: DriverService,
    public notificationService: NotificationService,
    public router: Router
  ) {

  }
}
