import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RideStatusComponent } from './ride-status/ride-status.component';
import { RealtimeShareComponent } from './realtime-share/realtime-share.component';
import { Error404Component } from './error404/error404.component';

const routes: Routes = [
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
