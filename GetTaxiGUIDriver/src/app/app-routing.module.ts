import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RideStatusComponent } from './Components/ride-status/ride-status.component';
import { RealtimeShareComponent } from './Components/realtime-share/realtime-share.component';
import { Error404Component } from './Components/error404/error404.component';
import { DriverComponent } from './Components/driver-profile/driver.component';
import { DriverLoginComponent } from './Components/driver-login/driver-login.component';
import { PaymentComponent } from './Components/payment/payment.component'

const routes: Routes = [
  {
    path: 'driver',
    children: [
      { path: '', component: DriverLoginComponent },
      { path: 'profile', component: DriverComponent },
      { path: 'ride-status/:rideId/:driverId', component: RideStatusComponent },
      { path: 'realtime/:rideId/:driverId', component: RealtimeShareComponent },
      { path: 'payment', component: PaymentComponent },
      { path: '**', component: Error404Component }
    ]
  },
  { path: '**', component: DriverLoginComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
