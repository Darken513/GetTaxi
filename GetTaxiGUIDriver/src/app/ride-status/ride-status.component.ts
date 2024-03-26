import { Component, OnInit } from '@angular/core';
import { RideStatusDataFetcher } from '../rideStatusDataFetcher';
import { ActivatedRoute, Router } from '@angular/router';
import { DriverService } from '../driver.service';
import { SocketService } from '../socket.service';

@Component({
  selector: 'app-ride-status',
  templateUrl: './ride-status.component.html',
  styleUrls: ['./ride-status.component.scss'],
})
export class RideStatusComponent extends RideStatusDataFetcher implements OnInit {
  constructor(
    public override socketService: SocketService,
    public override driverService: DriverService,
    public override activatedRoute: ActivatedRoute,
    public override router: Router
  ) {
    super(
      "ride-status",
      socketService,
      driverService,
      activatedRoute,
      router
    );
  }
}
