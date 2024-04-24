import { Component, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth.service';
import { DriverService } from '../driver.service';
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
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss']
})
export class EditProfileComponent {
  @Input() driverId: string = "";
  @Input() driver: any; //todo-P3 : use modals

  @Input() carTypes: any[] = []; //todo-P3 : use modals
  @Input() zones: any[] = []; //todo-P3 : use modals

  public prevSubmitted: boolean = false;
  public subs: Array<Subscription> = []; //todo-P3 : make sure to unsbscribe !

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
    this.driverForm.setValue({
      name: this.driver.name ?? '',
      familyName: this.driver.familyName ?? '',
      phoneNbr: this.driver.phoneNbr ?? '',
      carType: this.driver.carType ?? '',
      carDescription: this.driver.carDescription ?? '',
      zone: this.driver.zone ?? ''
    });
    this.filesForm.GrayCardURL = this.driver.GrayCard;
    this.filesForm.taxiPermitURL = this.driver.taxiPermit;
    this.filesForm.drivingPermitURL = this.driver.drivingPermit;
    this.filesForm.transportPermitURL = this.driver.transportPermit;
  }

  updateDriver(): void {
    this.markAllAsTouched(this.driverForm);
    if (this.driverForm.valid && this.isFilesFormValid() && this.driverId !== null) {
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
              updatedDriver[fileKey] = response.fileName;
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
            this.driver = updatedDriver;
          }
        },
        error: (error) => {
          this.notificationService.showNotification({ type: 'error', title: 'error', body: 'Error Updating "Driver"' })
        }
      })
      this.subs.push(toPush);
    }
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
