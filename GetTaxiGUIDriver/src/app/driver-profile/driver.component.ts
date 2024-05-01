import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { DriverService } from '../driver.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-driver',
  templateUrl: './driver.component.html',
  styleUrls: ['./driver.component.scss']
})
export class DriverComponent implements OnInit, OnDestroy {
  public driverId: string = "";
  public driver: any; //todo-P3 : use modals
  public zone: any; //todo-P3 : use modals
  public carType: any; //todo-P3 : use modals
  public carBrand: any; //todo-P3 : use modals

  carTypes: any[] = []; //todo-P3 : use modals
  carBrands: any[] = []; //todo-P3 : use modals
  zones: any[] = []; //todo-P3 : use modals

  public subs: Array<Subscription> = [];

  public ready: boolean = false;
  //todo-p1 : once driver fills in with all details, he should have access to two options, validate email & validate phone nbr
  //todo-p1 : once both or at least (phone nbr) is validated & all files are uploaded the driver is immediatly activated
  public editingProfile: boolean = false;

  constructor(
    private authService: AuthService,
    public driverService: DriverService,
    public notificationService: NotificationService,
    public activatedRoute: ActivatedRoute,
    public router: Router
  ) {
  }

  ngOnInit(): void {
    this.initDriverDetails();
  }

  initDriverDetails() {
    this.driverId = this.authService.getDriverIdFromToken();
    const toPush = this.driverService.getDriverById(this.driverId).subscribe({
      next: (val) => {
        if (val.type == "error") {
          //todo-P3 : this means a huge error to be fixed -> the driver itself doesnt exist
        }
        this.driver = val;
        this.initCarTypesList();
      },
    });
    this.subs.push(toPush);
  }

  initCarTypesList() {
    const toPush = this.driverService.getAllCarTypes().subscribe({
      next: (val: any) => {
        if (val.title != "error") {
          this.carTypes = val.carTypes;
          this.carType = this.carTypes.find(val => val.id == this.driver.carType);
          this.initCarBrandsList();
        }
      },
      error: (error: any) => {
        //todo-p3 : treat all manual notifications - make it in french, and propose a better way to do it
        this.notificationService.showNotification({ type: 'error', title: 'error', body: 'Error fetching Car Types' })
      }
    });
    this.subs.push(toPush);
  }

  initCarBrandsList() {
    const toPush = this.driverService.getAllCarBrands().subscribe({
      next: (val: any) => {
        if (val.title != "error") {
          this.carBrands = val.carBrands;
          this.carBrand = this.carBrands.find(val => val.id == this.driver.CarBrand);
          this.initZonesList();
        }
      },
      error: (error: any) => {
        //todo-p3 : treat all manual notifications - make it in french, and propose a better way to do it
        this.notificationService.showNotification({ type: 'error', title: 'error', body: 'Error fetching Car Brands' })
      }
    });
    this.subs.push(toPush);
  }

  initZonesList() {
    const toPush = this.driverService.getAllZones().subscribe({
      next: (val: any) => {
        if (val.title != "error") {
          this.zones = val.zones;
          this.zone = this.zones.find(val => val.id == this.driver.zone);
          this.ready = true;
          this.checkIfDataIsMissing();
        }
      },
      error: (error: any) => {
        this.notificationService.showNotification({ type: 'error', title: 'error', body: 'Error fetching Zones' })
      }
    })
    this.subs.push(toPush);
  }

  checkIfDataIsMissing() {
    this.editingProfile = !this.driver.name
      || !this.driver.familyName
      || !this.driver.phoneNbr
      || !this.driver.carBrand
      || !this.driver.carType
      || !this.driver.carDescription
      || !this.driver.carYear
      || !this.driver.carColor
      || !this.driver.authorizationVDate
      || !this.driver.expertiseVDate
      || !this.driver.drivingPermit
      || !this.driver.transportPermit
      || !this.driver.taxiPermit
      || !this.driver.GrayCard;
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => {
      sub.unsubscribe();
    })
  }

  onProfileEditAction(event: any) {
    if (event.noMissingDataLeft) {
      this.editingProfile = false;
    }
  }

}
