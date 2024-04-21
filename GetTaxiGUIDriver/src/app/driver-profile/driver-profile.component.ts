import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { DriverService } from '../driver.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NotificationService } from '../notification.service';

interface DriverFileForm {
  drivingPermit: File | null,
  transportPermit: File | null,
  taxiPermit: File | null,
  GrayCard: File | null,
  drivingPermitURL: string | undefined,
  transportPermitURL: string | undefined,
  taxiPermitURL: string | undefined,
  GrayCardURL: string | undefined
}

@Component({
  selector: 'app-driver-profile',
  templateUrl: './driver-profile.component.html',
  styleUrls: ['./driver-profile.component.scss']
})
export class DriverProfileComponent implements OnInit, OnDestroy {
  public driverId: string = "";
  public driver: any; //todo-P3 : use modals
  public zone: any; //todo-P3 : use modals
  public car: any; //todo-P3 : use modals

  carTypes: any[] = []; //todo-P3 : use modals
  zones: any[] = []; //todo-P3 : use modals

  public subs: Array<Subscription> = []; //todo-P3 : make sure to unsbscribe !

  public ready: boolean = false;
  public missingData: boolean = false;

  driverForm!: FormGroup;
  filesForm: DriverFileForm = {
    drivingPermit: null,
    transportPermit: null,
    taxiPermit: null,
    GrayCard: null,
    drivingPermitURL: undefined,
    transportPermitURL: undefined,
    taxiPermitURL: undefined,
    GrayCardURL: undefined
  };

  constructor(
    private authService: AuthService,
    public driverService: DriverService,
    public notificationService: NotificationService,
    private fb: FormBuilder,
    public activatedRoute: ActivatedRoute,
    public router: Router
  ) {
    this.driverForm = this.fb.group({
      name: ['', Validators.required],
      familyName: ['', Validators.required],
      phoneNbr: ['', [Validators.required, Validators.pattern(/^\+(?:[0-9] ?){6,14}[0-9]$/)]],
      carType: ['', Validators.required],
      carDescription: ['', Validators.required],
      zone: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.driverId = this.authService.getDriverIdFromToken();
    const toPush = this.driverService.getDriverById(this.driverId).subscribe({
      next: (val) => {
        if (val.type == "error") {
          //todo-P3 : this means a huge error to be fixed -> the driver itself doesnt exist
        }
        this.driver = val;
        if (!this.driver.zone) {
          this.ready = true;
          this.checkIfDataIsMissing();
          return;
        }
        const toPush = this.driverService.getZoneById(this.driver.zone).subscribe({
          next: (val) => {
            if (val.type == "error") {
              //todo-P3 : this means a huge error to be fixed -> the driver zone type doesnt exist
            }
            this.zone = val;
            if (!this.driver.carType) {
              this.ready = true;
              this.checkIfDataIsMissing();
              return;
            }
            const toPush = this.driverService.getCarByID(this.driver.carType).subscribe({
              next: (val) => {
                if (val.type == "error") {
                  //todo-P3 : this means a huge error to be fixed -> the driver car type doesnt exist
                }
                this.car = val;
              },
            });
            this.subs.push(toPush);
            this.ready = true;
            this.checkIfDataIsMissing();
          },
        });
        this.subs.push(toPush);
      },
    });
    this.initCarTypesList()
    this.subs.push(toPush);
  }

  initCarTypesList() {
    const toPush = this.driverService.getAllCarTypes().subscribe({
      next: (val: any) => {
        if (val.title != "error") {
          this.carTypes = val.carTypes;
        }
        this.initZonesList();
      },
      error: (error: any) => {
        //todo-p3 : treat all manual notifications - make it in french, and propose a better way to do it
        this.notificationService.showNotification({ type: 'error', title: 'error', body: 'Error fetching Car Types' })
        this.initZonesList();
      }
    });
    this.subs.push(toPush);
  }

  initZonesList() {
    const toPush = this.driverService.getAllZones().subscribe({
      next: (val: any) => {
        if (val.title != "error") {
          this.zones = val.zones;
        }
      },
      error: (error: any) => {
        this.notificationService.showNotification({ type: 'error', title: 'error', body: 'Error fetching Zones' })
      }
    })
    this.subs.push(toPush);
  }

  updateDriver(): void {
    this.markAllAsTouched(this.driverForm);
    if (this.driverForm.valid && this.driverId !== null) {
      const updatedDriver: any = {
        ...this.driverForm.value,
        isActive: this.driver.isActive
      };
      ["drivingPermit", "transportPermit", "taxiPermit", "GrayCard"].forEach((fileKey: string) => {
        if ((this.filesForm as any)[fileKey]) {
          const formData: FormData = new FormData();
          formData.append('file', (this.filesForm as any)[fileKey]);
          this.driverService.uploadDriversFiles(formData, fileKey, this.driverId).subscribe({
            next: (response) => {
              updatedDriver[fileKey] = response.fileName;
              this.notificationService.showNotification({ type: 'success', title: 'success', body: 'File uploaded successfully' });
            },
            error: (error) => {
              this.notificationService.showNotification({ type: 'error', title: 'error', body: 'Error uploading file' })
            }
          })
        }
      })
      this.driverService.updateDriver(updatedDriver, this.driverId).subscribe({
        next: (val) => {
          if (val.title != "error") {
            updatedDriver.id = this.driverId;
            this.driver = updatedDriver;
          }
        },
        error: (error) => {
          this.notificationService.showNotification({ type: 'error', title: 'error', body: 'Error Updating "Driver"' })
        }
      })
    }
  }

  private markAllAsTouched(form: FormGroup) {
    Object.values(form.controls).forEach((control: any) => {
      control.markAsTouched();
    });
  }

  checkIfDataIsMissing() {
    this.missingData = !this.driver.name
      || !this.driver.familyName
      || !this.driver.phoneNbr
      || !this.driver.carDescription
      || !this.driver.drivingPermit
      || !this.driver.transportPermit
      || !this.driver.taxiPermit
      || !this.driver.GrayCard;

    console.log(this.missingData)
  }

  onFileSelected(event: any, key: string): void {
    (this.filesForm as any)[key] = event.target.files[0] || null;
  }

  fetchFileAndRedirect(filePath: string) {
    this.driverService.readDriverFilesURLS(filePath, this.driverId).subscribe({
      next: (val) => {
        window.open(val.filePath, '_blank');
      },
      error: (error) => { }
    })
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => {
      sub.unsubscribe();
    })
  }

}
