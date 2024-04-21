import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DriverService } from '../driver.service';
import { AuthService } from '../auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-driver-login',
  templateUrl: './driver-login.component.html',
  styleUrls: ['./driver-login.component.scss']
})
export class DriverLoginComponent implements OnInit{
  loginForm: FormGroup;
  signUpForm: FormGroup;

  signUpScreenOn: boolean = false;
  public subs: Array<Subscription> = []; //todo-P3 : make sure to unsbscribe !

  constructor(
    private formBuilder: FormBuilder,
    private driverService: DriverService,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
    this.signUpForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(5)]],
      retypedPassword: ['', Validators.required],
    }, { validator: this.passwordsMatchValidator });
  }

  ngOnInit(): void {
    const driverId = this.authService.getDriverIdFromToken();
    if(driverId)
      this.router.navigate(['/profile']);
  }

  passwordsMatchValidator(formGroup: FormGroup) {
    const password = formGroup!.get('password')!.value;
    const retypedPassword = formGroup!.get('retypedPassword')!.value;

    if (password == retypedPassword) {
      return null;
    } else {
      formGroup!.get('retypedPassword')!.setErrors({ mismatch: true });
      return { mismatch: true };
    }
  }

  login() {
    if (this.loginForm.invalid) {
      return;
    }
    this.authService.login(this.loginForm.value)
      .subscribe({
        next: (response) => {
          if (response.token) {
            localStorage.setItem('token', response.token);
            const currentPageUrl = sessionStorage.getItem('currentPageUrl');
            if (currentPageUrl) {
              window.location.href = currentPageUrl;
              sessionStorage.removeItem('currentPageUrl');
              return;
            }
            this.router.navigate(['/profile']);
          }
        },
        error: (error) => {
          console.log(error);
        }
      });
  }

  signUp() {
    if (this.signUpForm.invalid) {
      return;
    }
    this.authService.signUp(this.signUpForm.value)
      .subscribe({
        next: (response) => {
          if (response.type == 'success') {
            this.signUpScreenOn = false;
            this.resetForms();
          }
        },
        error: (error) => {
          console.log(error);
        }
      });
  }

  resetForms() {
    this.loginForm.reset({
      email: '',
      password: ''
    });
    this.markFormGroupAsUntouched(this.loginForm);

    this.signUpForm.reset({
      email: '',
      password: '',
      retypedPassword: ''
    });
    this.markFormGroupAsUntouched(this.signUpForm);
  }

  markFormGroupAsUntouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsUntouched();
    });
  }
}
