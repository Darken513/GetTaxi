import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AdminHomeScreenComponent } from './home-screen/home-screen.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import { Error404Component } from './error404/error404.component';
import { AddressAutocompleteComponent } from './address-autocomplete/address-autocomplete.component';

@NgModule({
  declarations: [
    AppComponent,
    AdminHomeScreenComponent,
    DashboardComponent,
    Error404Component,
    AddressAutocompleteComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule, 
    FormsModule, 
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
