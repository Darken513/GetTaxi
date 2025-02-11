import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DriverService } from '../../Services/driver.service';
import { NotificationService } from '../../Services/notification.service';
import Chart from 'chart.js/auto';
import { formatDate } from '../../utilities';

@Component({
  selector: 'app-driver-profile',
  templateUrl: './driver-profile.component.html',
  styleUrls: ['./driver-profile.component.scss']
})
export class DriverProfileComponent implements OnInit, OnDestroy {
  @Input() driverId: string = "";
  @Input() driver: any; //todo-P3 : use modals

  @Input() carTypes: any[] = []; //todo-P3 : use modals
  @Input() carBrands: any[] = []; //todo-P3 : use modals
  @Input() zones: any[] = []; //todo-P3 : use modals

  @Output() update: EventEmitter<any> = new EventEmitter();

  //todo-p2 : add socket here, if client is sending stuff, add a hint to the display that this ride client is connected to the app
  behaviors: Array<any> = [];
  chart: Chart | null = null;

  public subs: Array<Subscription> = [];

  constructor(
    public driverService: DriverService,
    public notificationService: NotificationService,
    public router: Router
  ) {

  }

  ngOnInit() {
    this.initChart();
    this.initBehaviors(5);
  }

  initBehaviors(nbr: number) {
    this.driverService.getDriverBehaviorsById(this.driverId, nbr).subscribe({
      next: (val) => {
        this.behaviors = val.behaviors;
      }
    })
  }
  initChart() {
    let donutCtx = (document.getElementById('donut')! as any).getContext('2d');
    let isEmpty = this.driver.totalIncome === 0 && this.driver.totalSpent === 0;

    let data = {
      datasets: [
        {
          "data": isEmpty ? [1] : [this.driver.totalIncome, this.driver.totalSpent],
          "backgroundColor": isEmpty ? ['#585f6d'] : [
            "yellowgreen",
            "#cf4a95"
          ]
        }]
    };

    let chart = new Chart(
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
  public formatDate_ = formatDate;

  public getBehaviorColor(behavior: any) {
    switch (behavior.behaviorType) {
      case this.driverService.env.RIDE_ACCEPTED:
        return 'rgb(154, 205, 50)';
      case this.driverService.env.RIDE_CANCELED_CLIENT:
        return 'rgb(250, 61, 61)';
      case this.driverService.env.RIDE_CANCELED_DRIVER:
        return 'rgb(237 134 60)';
      case this.driverService.env.RIDE_ENDED:
        return 'rgb(207 74 149)';
      default:
        return 'rgb(250, 61, 61)';
    }
  }

  public isBehaviorRideEnded(behavior: any){
    return behavior.behaviorType == this.driverService.env.RIDE_ENDED
  }

  public getBehaviorLabel(behavior: any) {
    switch (behavior.behaviorType) {
      case this.driverService.env.RIDE_ACCEPTED:
        return 'Course acceptée';
      case this.driverService.env.RIDE_CANCELED_CLIENT:
        return 'Annulée par le client';
      case this.driverService.env.RIDE_CANCELED_DRIVER:
        return 'Annulée par vous';
      case this.driverService.env.RIDE_ENDED:
        return 'Course terminée';
      default:
        return 'Unkown';
    }
  }

  public navigateToRideStatus(behavior: any) {
    this.router.navigate(['/driver/ride-status/', behavior.rideId, behavior.driverId]);
  }

  public initPaymentScreen(){
    this.router.navigate(['/driver/payment/']);
  }
  logout() {
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['/driver']);
  }

  public goToEditProfile() {
    this.update.emit({ editProfile: true });
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => {
      sub.unsubscribe();
    })
  }
}