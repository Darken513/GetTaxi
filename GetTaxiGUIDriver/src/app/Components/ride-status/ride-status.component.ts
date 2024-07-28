import { Component, OnInit } from '@angular/core';
import { RideStatusDataFetcher } from '../rideStatusDataFetcher';
import { ActivatedRoute, Router } from '@angular/router';
import { DriverService } from '../../Services/driver.service';
import { SocketService } from '../../Services/socket.service';
import { NotificationService } from 'src/app/Services/notification.service';

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
    public override router: Router,
    public override notificationService: NotificationService
  ) {
    super(
      "ride-status",
      socketService,
      driverService,
      activatedRoute,
      router,
      notificationService
    );
  }
}
