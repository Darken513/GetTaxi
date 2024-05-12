import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DriverService } from '../../Services/driver.service';
import { NotificationService } from '../../Services/notification.service';

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
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss']
})
export class EditProfileComponent {
  @Input() driverId: string = "";
  @Input() driver: any; //todo-P3 : use modals

  @Input() carTypes: any[] = []; //todo-P3 : use modals
  @Input() carBrands: any[] = []; //todo-P3 : use modals
  @Input() zones: any[] = []; //todo-P3 : use modals

  @Output() update: EventEmitter<any> = new EventEmitter();

  public prevSubmitted: boolean = false;
  public subs: Array<Subscription> = [];

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
    public driverService: DriverService,
    public notificationService: NotificationService,
    private fb: FormBuilder,
    public router: Router
  ) {
    this.driverForm = this.fb.group({
      name: ['', Validators.required],
      familyName: ['', Validators.required],
      phoneNbr: ['', [Validators.required, Validators.pattern(/^\+(?:[0-9] ?){6,14}[0-9]$/)]],
      carBrand: ['', Validators.required],
      carType: ['', Validators.required],
      carYear: ['', [Validators.required, Validators.pattern(/^(19|20)\d{2}$/)]],
      carColor: ['', Validators.required],
      carDescription: ['', Validators.required],
      expertiseVDate: ['', [Validators.required]],
      authorizationVDate: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.driverForm.setValue({
      name: this.driver.name ?? '',
      familyName: this.driver.familyName ?? '',
      phoneNbr: this.driver.phoneNbr ?? '',
      carType: this.driver.carType ?? '',
      carBrand: this.driver.carBrand ?? '',
      carYear: this.driver.carYear ?? '',
      carColor: this.driver.carColor ?? '',
      carDescription: this.driver.carDescription ?? '',
      expertiseVDate: this.driver.expertiseVDate ?? '',
      authorizationVDate: this.driver.authorizationVDate ?? '',
      //zone: this.driver.zone ?? ''
    });
    this.filesForm.GrayCardURL = this.driver.GrayCard;
    this.filesForm.taxiPermitURL = this.driver.taxiPermit;
    this.filesForm.drivingPermitURL = this.driver.drivingPermit;
    this.filesForm.transportPermitURL = this.driver.transportPermit;
  }

  updateDriver(): void {
    this.markAllAsTouched(this.driverForm);
    if (this.isFilesFormValid() && this.driverForm.valid && this.driverId !== null) {
      const updatedDriver: any = {
        ...this.driverForm.value,
        isActive: this.driver.isActive
      };
      ["drivingPermit", "transportPermit", "taxiPermit", "GrayCard"].forEach((fileKey: string) => {
        if ((this.filesForm as any)[fileKey]) {
          const formData: FormData = new FormData();
          formData.append('file', (this.filesForm as any)[fileKey]);
          const toPush = this.driverService.uploadDriversFiles(formData, fileKey, this.driverId).subscribe({
            next: (response) => {
              this.driver[fileKey] = response.fileName;
              (this.filesForm as any)[fileKey + 'URL'] = response.fileName;
              if (!this.hasMissingData()) {
                this.update.emit({ noMissingDataLeft: true })
              }
              this.notificationService.showNotification({ type: 'success', title: 'success', body: 'File uploaded successfully' });
            },
            error: (error) => {
              this.notificationService.showNotification({ type: 'error', title: 'error', body: 'Error uploading file' })
            }
          })
          this.subs.push(toPush);
        }
      })
      const toPush = this.driverService.updateDriver(updatedDriver, this.driverId).subscribe({
        next: (val) => {
          if (val.title != "error") {
            updatedDriver.id = this.driverId;
            Object.keys(updatedDriver).forEach(key => {
              this.driver[key] = updatedDriver[key];
            })
            if (!this.hasMissingData()) {
              this.update.emit({ noMissingDataLeft: true })
            }
          }
        },
        error: (error) => {
          this.notificationService.showNotification({ type: 'error', title: 'error', body: 'Error Updating "Driver"' })
        }
      })
      this.subs.push(toPush);
    }
  }

  private hasMissingData() {
    return !this.driver.name
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

  private markAllAsTouched(form: FormGroup) {
    Object.values(form.controls).forEach((control: any) => {
      control.markAsTouched();
    });
  }

  isFilesFormValid() {
    const unvalid = !this.filesForm.GrayCardURL && !this.filesForm.GrayCard ||
      !this.filesForm.taxiPermitURL && !this.filesForm.taxiPermit ||
      !this.filesForm.drivingPermitURL && !this.filesForm.drivingPermit ||
      !this.filesForm.transportPermitURL && !this.filesForm.transportPermit;

    if (unvalid) {
      this.prevSubmitted = true;
    }
    return !unvalid;
  }

  onFileSelected(event: any, key: string): void {
    (this.filesForm as any)[key] = event.target.files[0] || null;
  }

  fetchFileAndRedirect(filePath: string) {
    const toPush = this.driverService.readDriverFilesURLS(filePath, this.driverId).subscribe({
      next: (val) => {
        window.open(val.filePath, '_blank');
      },
      error: (error) => { }
    })
    this.subs.push(toPush);
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => {
      sub.unsubscribe();
    })
  }
}
