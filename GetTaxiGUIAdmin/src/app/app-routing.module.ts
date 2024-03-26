import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminHomeScreenComponent } from './home-screen/home-screen.component';
import { Error404Component } from './error404/error404.component';

const routes: Routes = [
  { path: 'admin', 
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'home', component: AdminHomeScreenComponent },
      { path: '**', component: Error404Component, data: { redirect: true }}
    ]
  },
  { path: '**', component: Error404Component, data: { redirect: false }}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
