import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DriverService } from '../../Services/driver.service';
import { NotificationService } from '../../Services/notification.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-driver-profile',
  templateUrl: './driver-profile.component.html',
  styleUrls: ['./driver-profile.component.scss']
})
export class DriverProfileComponent implements OnInit {
  @Input() driverId: string = "";
  @Input() driver: any; //todo-P3 : use modals

  @Input() carTypes: any[] = []; //todo-P3 : use modals
  @Input() carBrands: any[] = []; //todo-P3 : use modals
  @Input() zones: any[] = []; //todo-P3 : use modals

  @Output() update: EventEmitter<any> = new EventEmitter();

  chart: Chart | null = null;

  public subs: Array<Subscription> = []; //todo-P3 : make sure to unsbscribe !

  constructor(
    public driverService: DriverService,
    public notificationService: NotificationService,
    public router: Router
  ) {

  }
  ngOnInit() {
    let donutCtx = (document.getElementById('donut')! as any).getContext('2d');

    var data = {
      datasets: [
        {
          "data": [145.92, 6.29],   // Example data
          "backgroundColor": [
            "yellowgreen",
            "#cf4a95"
          ]
        }]
    };

    var chart = new Chart(
      donutCtx,
      {
        "type": 'doughnut',
        "data": data,
        "options": {
          "cutout": 30, // Adjust the cutout percentage as needed
          "animation": {
            "animateScale": true,
            "animateRotate": false
          },
          "elements": {
            "arc": {
              "borderWidth": 4,
              "borderColor": '#101725'
            }
          }
        }
      }
    );
  }
}