import { Routes } from '@angular/router';
import { Error404Component } from './error404/error404.component';
import { RealtimeComponent } from './realtime/realtime.component';

export const routes: Routes = [
    {
        path: 'client',
        children: [
            { path: 'realtime/:rideId', component: RealtimeComponent },
            { path: '**', component: Error404Component }
        ]
    },
    { path: '**', component: Error404Component }
];
