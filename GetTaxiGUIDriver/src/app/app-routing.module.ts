import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RideStatusComponent } from './ride-status/ride-status.component';
import { RealtimeShareComponent } from './realtime-share/realtime-share.component';
import { Error404Component } from './error404/error404.component';
import { DriverComponent } from './driver-profile/driver.component';
import { DriverLoginComponent } from './driver-login/driver-login.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: '', component: DriverLoginComponent },
      { path: 'profile', component: DriverComponent },
    ]
  },
  {
    path: 'driver',
    children: [
      { path: 'ride-status/:rideId/:driverId', component: RideStatusComponent },
      { path: 'realtime/:rideId/:driverId', component: RealtimeShareComponent },
      { path: '**', component: Error404Component }
    ]
  },
  { path: '**', component: Error404Component }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
