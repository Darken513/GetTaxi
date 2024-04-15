import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DriverService } from '../driver.service';

@Component({
  selector: 'app-driver-login',
  templateUrl: './driver-login.component.html',
  styleUrls: ['./driver-login.component.scss']
})
export class DriverLoginComponent {
  loginForm: FormGroup;
  signUpForm: FormGroup;

  signUpScreenOn: boolean = false;

  constructor(private formBuilder: FormBuilder, private driverService: DriverService, private router: Router) {
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
    this.driverService.login(this.loginForm.value)
      .subscribe({
        next: (response) => {
          localStorage.setItem('token', response.token);
          this.router.navigate(['/profile']);
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
    this.driverService.signUp(this.signUpForm.value)
      .subscribe({
        next: (response) => {
          //todo-p1 : display notification saying succesfuly signed in
          this.signUpScreenOn = false
        },
        error: (error) => {
          console.log(error);
        }
      });
  }
}
