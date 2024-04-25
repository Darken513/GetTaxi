import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RideStatusComponent } from './ride-status/ride-status.component';
import { RealtimeShareComponent } from './realtime-share/realtime-share.component';
import { Error404Component } from './error404/error404.component';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule, HttpHandler } from '@angular/common/http';
import { LoadingInterceptor } from './loading.interceptor';
import { CancelRideComponent } from './cancel-ride/cancel-ride.component';
import { DriverLoginComponent } from './driver-login/driver-login.component';
import { DriverComponent } from './driver-profile/driver.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TokenInterceptor } from './tokenIterceptor';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { DriverProfileComponent } from './driver-profile/driver-profile.component';
import { VerificationScreenComponent } from './verification-screen/verification-screen.component';

@NgModule({
  declarations: [
    AppComponent,
    RideStatusComponent,
    RealtimeShareComponent,
    Error404Component,
    CancelRideComponent,
    DriverLoginComponent,
    DriverComponent,
    EditProfileComponent,
    DriverProfileComponent,
    VerificationScreenComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
