import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Zone } from 'src/app/models/Zone';
import { CarType } from 'src/app/models/carType';
import { Driver } from 'src/app/models/driver';
import { AdminService } from '../admin.service';
import { NotificationService } from '../notification.service';
import { Router } from '@angular/router';

//todo-P2 : change style - use same colors as client & driver
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
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  drivers: Driver[] = [];
  carTypes: CarType[] = [];
  zones: Zone[] = [];

  driverForm: FormGroup;
  carTypeForm: FormGroup;
  zoneForm: FormGroup;

  editedDriverId: string | null = null;
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
  driverToSwitchStatus: Driver | null = null;

  isEditing = false;
  showModal = false;

  driverModal: boolean = false;
  carTypeModal: boolean = false;
  zoneModal: boolean = false;
  driverStatusModal: boolean = false;

  driversAccordianOn: boolean = false;
  carTypesAccordianOn: boolean = false;
  zonesAccordianOn: boolean = false;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    // Initialize the form with default values
    this.driverForm = this.fb.group({
      name: ['', Validators.required],
      familyName: ['', Validators.required],
      phoneNbr: ['', [Validators.required, Validators.pattern(/^\+(?:[0-9] ?){6,14}[0-9]$/)]],
      carType: ['', Validators.required],
      carDescription: ['', Validators.required],
      zone: ['', Validators.required]
    });
    this.carTypeForm = this.fb.group({
      name: ['', Validators.required],
    });
    this.zoneForm = this.fb.group({
      name: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.initDataLists()
  }
  initDataLists() {
    this.initCarTypesList() // this will call the rest but once a res is recieved ( ugly code )
  }

  initCarTypesList() {
    this.adminService.getAllCarTypes().subscribe({
      next: (val) => {
        if (val.title != "error") {
          this.carTypes = val.carTypes;
        }
        this.initZonesList();
      },
      error: (error) => {
        //todo-p3 : treat all manual notifications - make it in french, and propose a better way to do it
        this.notificationService.showNotification({ type: 'error', title: 'error', body: 'Error fetching Car Types' })
        this.initZonesList();
      }
    })
  }

  initZonesList() {
    this.adminService.getAllZones().subscribe({
      next: (val) => {
        if (val.title != "error") {
          this.zones = val.zones;
        }
        this.initDriversList();
      },
      error: (error) => {
        this.notificationService.showNotification({ type: 'error', title: 'error', body: 'Error fetching Zones' })
        this.initDriversList();
      }
    })
  }

  initDriversList() {
    this.adminService.getAllDrivers().subscribe({
      next: (val) => {
        if (val.title != "error") {
          this.drivers = val.drivers.map((driver: any) => {
            if (this.getZoneNameById(driver.zone) == 'NOK' || this.getCarTypeNameById(driver.carType) == 'NOK') {
              driver.confNok = true;
            }
            return driver;
          });
        }
      },
      error: (error) => {
        this.notificationService.showNotification({ type: 'error', title: 'error', body: 'Error fetching Drivers' })
      }
    })
  }

  openAccordian(accordianType: string): void {
    switch (accordianType) {
      case 'drivers':
        this.driversAccordianOn = !this.driversAccordianOn;
        break;
      case 'carTypes':
        this.carTypesAccordianOn = !this.carTypesAccordianOn;
        break;
      case 'zones':
        this.zonesAccordianOn = !this.zonesAccordianOn;
        break;
      default:
        break;
    }
  }

  openModal(modalType: string): void {
    this.showModal = true;
    switch (modalType) {
      case 'carTypes':
        this.carTypeModal = true;
        this.zoneModal = false;
        this.driverModal = false;
        break;
      case 'drivers':
        this.carTypeModal = false;
        this.zoneModal = false;
        this.driverModal = true;
        break;
      case 'zones':
        this.carTypeModal = false;
        this.zoneModal = true;
        this.driverModal = false;
        break;
      default:
        break;
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.driverModal = false;
    this.zoneModal = false;
    this.carTypeModal = false;
    this.driverStatusModal = false;
    this.resetForm();
  }
  private markAllAsTouched(form: FormGroup) {
    Object.values(form.controls).forEach((control: any) => {
      control.markAsTouched();
    });
  }
  addCarType(): void {
    this.markAllAsTouched(this.carTypeForm);
    if (this.carTypeForm.valid) {
      const newCarType: CarType = {
        ...this.carTypeForm.value
      };
      this.adminService.createCarType(newCarType).subscribe({
        next: (val) => {
          if (val.title != "error") {
            this.carTypes.push(val.new);
          }
        },
        error: (error) => {
          this.notificationService.showNotification({ type: 'error', title: 'error', body: 'Error creating new "Car Type"' })
        }
      })
      this.closeModal();
    }
  }

  addZone(): void {
    this.markAllAsTouched(this.zoneForm);
    if (this.zoneForm.valid) {
      const newZone: Zone = {
        ...this.zoneForm.value
      };
      this.adminService.createZone(newZone).subscribe({
        next: (val) => {
          if (val.title != "error") {
            this.zones.push(val.new);
          }
        },
        error: (error) => {
          this.notificationService.showNotification({ type: 'error', title: 'error', body: 'Error creating new "Zone"' })
        }
      })
      this.closeModal();
    }
  }

  addDriver(): void {
    this.markAllAsTouched(this.driverForm);
    if (this.driverForm.valid) {
      const newDriver: any = {
        ...this.driverForm.value,
        isActive: true
      };
      this.adminService.createDriver(newDriver).subscribe({
        next: (val) => {
          if (val.title != "error") {
            this.drivers.push(val.new);
          }
          const editedDriverIndex = this.drivers.findIndex(driver => driver.id === val.new.id);
          ["drivingPermit", "transportPermit", "taxiPermit", "GrayCard"].forEach((fileKey: string) => {
            if ((this.filesForm as any)[fileKey]) {
              const formData: FormData = new FormData();
              formData.append('file', (this.filesForm as any)[fileKey]);
              this.adminService.uploadDriversFiles(formData, fileKey, val.new.id).subscribe({
                next: (response) => {
                  (this.drivers[editedDriverIndex] as any)[fileKey] = response.fileName;
                  this.notificationService.showNotification({ type: 'success', title: 'success', body: 'File uploaded successfully' });
                },
                error: (error) => {
                  this.notificationService.showNotification({ type: 'error', title: 'error', body: 'Error uploading file' })
                }
              })
            }
          })
          this.closeModal();
        },
        error: (error) => {
          this.notificationService.showNotification({ type: 'error', title: 'error', body: 'Error creating new "Driver"' })
        }
      })
    }
  }

  editDriver(driver: Driver): void {
    this.isEditing = true;
    this.editedDriverId = driver.id;
    // Set the form values to the selected driver
    this.driverForm.setValue({
      name: driver.name,
      familyName: driver.familyName,
      phoneNbr: driver.phoneNbr,
      carType: driver.carType ?? '',
      carDescription: driver.carDescription,
      zone: driver.zone ?? ''
    });

    this.filesForm.GrayCardURL = driver.GrayCard;
    this.filesForm.taxiPermitURL = driver.taxiPermit;
    this.filesForm.drivingPermitURL = driver.drivingPermit;
    this.filesForm.transportPermitURL = driver.transportPermit;

    this.openModal('drivers');
  }

  updateDriver(): void {
    this.markAllAsTouched(this.driverForm);
    const editedDriverId = this.editedDriverId;
    if (this.driverForm.valid && editedDriverId !== null) {
      const editedDriverIndex = this.drivers.findIndex(driver => driver.id === editedDriverId);
      if (editedDriverIndex !== -1) {
        const updatedDriver: any = {
          ...this.driverForm.value,
          isActive: this.drivers[editedDriverIndex].isActive
        };
        ["drivingPermit", "transportPermit", "taxiPermit", "GrayCard"].forEach((fileKey: string) => {
          if ((this.filesForm as any)[fileKey]) {
            const formData: FormData = new FormData();
            formData.append('file', (this.filesForm as any)[fileKey]);
            this.adminService.uploadDriversFiles(formData, fileKey, editedDriverId).subscribe({
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
        this.adminService.updateDriver(updatedDriver, editedDriverId).subscribe({
          next: (val) => {
            if (val.title != "error") {
              updatedDriver.id = editedDriverId;
              this.drivers[editedDriverIndex] = updatedDriver;
            }
          },
          error: (error) => {
            this.notificationService.showNotification({ type: 'error', title: 'error', body: 'Error Updating "Driver"' })
          }
        })
      }
    }
    this.closeModal();
  }

  deleteZone(zoneId: string): void {
    this.adminService.deleteZoneById(zoneId).subscribe({
      next: (val) => {
        if (val.title != "error") {
          this.zones = this.zones.filter(zone => zone.id !== zoneId);
        }
      },
      error: (error) => {
        this.notificationService.showNotification({ type: 'error', title: 'error', body: 'Error deleting "Zone"' })
      }
    })
  }

  deleteCarType(carTypeID: string): void {
    this.adminService.deleteCarTypeById(carTypeID).subscribe({
      next: (val) => {
        if (val.title != "error") {
          this.carTypes = this.carTypes.filter(carType => carType.id !== carTypeID);
        }
      },
      error: (error) => {
        this.notificationService.showNotification({ type: 'error', title: 'error', body: 'Error deleting "Car Type"' })
      }
    })
  }

  deleteDriver(driverId: string): void {
    this.adminService.deleteDriverById(driverId).subscribe({
      next: (val) => {
        if (val.title != "error") {
          this.drivers = this.drivers.filter(driver => driver.id !== driverId);
        }
      },
      error: (error) => {
        this.notificationService.showNotification({ type: 'error', title: 'error', body: 'Error deleting "Driver"' })
      }
    })
  }

  initDriverSwitchStatus(driver: Driver): void {
    this.driverToSwitchStatus = driver;
    this.driverStatusModal = true;
    this.showModal = true;
  }

  toggleDriverStatus(driver: Driver): void {
    this.closeModal()
    this.adminService.changeDriverStatus(driver.id, !driver.isActive).subscribe({
      next: (val) => {
        if (val.title != "error") {
          driver.isActive = !driver.isActive;
        }
      },
      error: (error) => {
        this.notificationService.showNotification({ type: 'error', title: 'error', body: 'Error Switching status for "Driver"' })
      }
    })
  }

  private resetForm(): void {
    this.driverForm.reset();
    this.carTypeForm.reset();
    this.zoneForm.reset();
    this.isEditing = false;
    this.editedDriverId = null;
    this.driverToSwitchStatus = null;
    this.filesForm = {
      drivingPermit: null,
      transportPermit: null,
      taxiPermit: null,
      GrayCard: null,
      drivingPermitURL: undefined,
      transportPermitURL: undefined,
      taxiPermitURL: undefined,
      GrayCardURL: undefined
    };
  }

  public getZoneNameById(id: string) {
    let found: any = this.zones.find((zone: Zone) => zone.id == id);
    if (found) {
      return found.name
    }
    return 'NOK';
  }
  public getCarTypeNameById(id: string) {
    let found: any = this.carTypes.find((carType: CarType) => carType.id == id);
    if (found) {
      return found.name
    }
    return 'NOK';
  }

  onFileSelected(event: any, key: string): void {
    (this.filesForm as any)[key] = event.target.files[0] || null;
  }
  fetchFileAndRedirect(filePath: string) {
    this.adminService.readDriverFilesURLS(filePath, this.editedDriverId).subscribe({
      next: (val) => {
        window.open(val.filePath, '_blank');
      },
      error: (error) => { }
    })
  }
  navigateToNoitifier() {
    this.router.navigate(['/admin/home']);
  }
}