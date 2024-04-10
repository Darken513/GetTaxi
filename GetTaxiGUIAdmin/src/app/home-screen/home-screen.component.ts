import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AdminService } from '../admin.service';
import { Zone } from '../models/Zone';
import { CarType } from '../models/carType';
import { NotificationService } from '../notification.service';
import { Router } from '@angular/router';
import { numberValidator } from '../validator';

@Component({
  selector: 'app-admin-home-screen',
  templateUrl: './home-screen.component.html',
  styleUrls: ['./home-screen.component.scss']
})
export class AdminHomeScreenComponent {
  customForm!: FormGroup;
  minDateTime: string;
  zones: Array<Zone> = []
  carTypes: Array<CarType> = []

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.minDateTime = new Date().toISOString().slice(0, 16);
  }

  ngOnInit(): void {
    this.adminService.getAllCarTypes().subscribe({
      next: (val) => {
        if (val.title != "error") {
          this.carTypes = val.carTypes;
        } else {
          this.notificationService.showNotification(val)
        }
      },
      error: (error) => {
        this.notificationService.showNotification({ title: 'error', body: 'Error fetching Car Types' })
      }
    })
    this.adminService.getAllZones().subscribe({
      next: (val) => {
        if (val.title != "error") {
          this.zones = val.zones;
        } else {
          this.notificationService.showNotification(val)
        }
      },
      error: (error) => {
        this.notificationService.showNotification({ title: 'error', body: 'Error fetching Zones' })
      }
    })
    //todo-P2 : shold estimated distance & price & calculated credits to consume
    //variable names used in backend : 
    // - estimatedDistance:number
    // - estimatedPrice:number
    // - creditsCost:number
    this.customForm = this.fb.group({
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\+(?:[0-9] ?){6,14}[0-9]$/)]],
      //todo-p3 : maybe add email/sms for defered case, to remind user
      isDeferred: [false],
      deferredDateTime: [''],
      current_roadName: ['', [Validators.required]],
      current_roadNbr: ['', [Validators.required]],
      current_postalCode: ['', [Validators.required]],
      current_city: ['', [Validators.required]],
      destination_roadName: ['', [Validators.required]],
      destination_roadNbr: ['', [Validators.required]],
      destination_postalCode: ['', [Validators.required]],
      destination_city: ['', [Validators.required]],
      zone: ['', [Validators.required]],
      carType: ['', [Validators.required]]
    });
  }

  isDeferredChecked(): boolean {
    return this.customForm?.get('isDeferred')?.value;
  }

  onDeferredChange(event: any) {
    if (event.target.checked) {
      this.customForm?.get('deferredDateTime')?.setValidators([
        Validators.required
      ]);
    } else {
      this.customForm?.get('deferredDateTime')?.clearValidators();
      this.customForm?.get('deferredDateTime')?.updateValueAndValidity();
    }
  }

  onSubmit() {
    // Mark all controls as touched to display error messages
    this.markAllAsTouched();
    if (this.customForm.valid) {
      this.adminService.initRideStatus(this.customForm.value).subscribe({
        next: (val) => {
          this.notificationService.showNotification(val)
        },
        error: (error) => {
          this.notificationService.showNotification({ title: 'error', body: 'Error initating Ride status' })
        }
      })
    }
  }

  private markAllAsTouched() {
    Object.values(this.customForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }
  navigateToConfig() {
    this.router.navigate(['/admin/dashboard']);
  }
}
