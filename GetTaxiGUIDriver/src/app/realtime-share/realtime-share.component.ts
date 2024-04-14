import { Component, OnDestroy, OnInit } from '@angular/core';
import { RideStatusDataFetcher } from '../rideStatusDataFetcher';
import { ActivatedRoute, Router } from '@angular/router';
import { DriverService } from '../driver.service';
import { SocketService } from '../socket.service';
import * as L from 'leaflet';
import 'leaflet-rotatedmarker';
import 'leaflet-routing-machine';
import { Subscription } from 'rxjs';

enum rideState {
  goingToClient,
  reachedClient,
  goingToDestination,
  rideEnded,
}

@Component({
  selector: 'app-realtime-share',
  templateUrl: './realtime-share.component.html',
  styleUrls: ['./realtime-share.component.scss'],
})
export class RealtimeShareComponent
  extends RideStatusDataFetcher
  implements OnInit, OnDestroy {

  timeToReachClient: string = "";
  distanceLeft: string = "";
  currentState: rideState = rideState.goingToClient;

  map: L.Map | null = null;
  clientMarker: L.Marker | null = null;
  clientPosition: L.LatLngExpression = [0, 0];
  driverMarker: L.Marker | null = null;
  driverPosition: L.LatLngExpression = [0, 0];
  routeControl: L.Routing.Control | null = null;

  protected lastEmitTime: number = 0;
  protected lastLocationSent: { latitude: number; longitude: number } | null = null;
  protected idleTimer: ReturnType<typeof setTimeout> | null = null;
  protected navigatorWatch: ReturnType<typeof navigator.geolocation.watchPosition> | null = null;
  protected socketSub: Subscription | null = null;

  lastClientUpdateTime: number | null = null;
  protected clientIdleTimer: ReturnType<typeof setInterval> | null = null;

  cancelingRideInProgress: boolean = false;

  constructor(
    public override socketService: SocketService,
    public override driverService: DriverService,
    public override activatedRoute: ActivatedRoute,
    public override router: Router
  ) {
    super('real-time', socketService, driverService, activatedRoute, router);
  }

  callUser() {
    window.open('tel:' + this.data.phoneNumber);
  }

  override ngOnInit(): void {
    const cb = (data: any) => {
      setTimeout(() => {
        this.cbOnceReady();
        this.socketService.initRoomJoin(data);
        this.socketSub = this.socketService.socketEvent.subscribe({
          next: (response: any) => {
            if (response.event == 'clientUpdate') {
              this.setUserLocation(response.data.position, false);
              this.handleCaseConnectionLost();
            }
            if (response.event == 'canceledRide') {
              this.data.isCanceledRide = true;
              this.isCanceledRide = true;
            }
          },
        });
      }, 500);
    }
    super.ngOnInit(cb);
  }

  ngOnDestroy(): void {
    this.killTimersAndWatchers();
  }

  cbOnceReady(): void {
    if(this.data.isCanceledRide){
      this.isCanceledRide = true;
      return;
    }
    if (this.data.takenByDriver != this.driverId) {
      this.redirectToRideStatus();
    }
    this.initializeMap();
    this.setupLocationTracking();
    this.startIdleCheck();
    //this.setupOrientationTracking();
  }

  handleCaseConnectionLost() {
    this.lastClientUpdateTime = Date.now();
    if (this.connectionLost) {
      this.connectionLost = false;
      setTimeout(() => {
        this.reInitilizeComponent();
      }, 500);
    }
  }

  protected initializeMap(): void {
    this.map = L.map('map').setView([0, 0], 2); // Set the initial map center and zoom level
    L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(this.map);
  }

  protected setUserLocation(position: any, isDriver?: boolean) {
    const randomNumber = 0.01 // Math.random() * (0.02 - 0.01) + 0.01;
    const userLocation: L.LatLngTuple = [
      position.latitude + (!isDriver ? randomNumber : 0),
      position.longitude + (!isDriver ? randomNumber : 0)
    ];
    if (isDriver) {
      if (!this.driverMarker) {
        const taxiIcon = L.icon({
          iconUrl: '../../assets/taxi-icon.png', // Path to the taxi icon image
          iconSize: [35, 50], // Size of the icon
          iconAnchor: [17.5, 50], // Anchor point of the icon
          popupAnchor: [0, -48], // Popup offset
        });
        this.driverMarker = L.marker(userLocation, { icon: taxiIcon }).addTo(
          this.map!
        );
      } else {
        this.driverPosition = userLocation;
      }
    } else {
      if (!this.clientMarker) {
        this.clientMarker = L.marker(userLocation).addTo(this.map!);
      } else {
        this.clientPosition = userLocation;
      }
    }
    if (this.driverMarker && this.clientMarker) {
      if (this.routeControl) {
        this.routeControl.setWaypoints([
          (this.driverPosition as L.LatLng),
          (this.clientPosition as L.LatLng),
        ]);
      } else {
        this.routeControl = L.Routing.control({
          waypoints: [
            (this.driverPosition as L.LatLng),
            (this.clientPosition as L.LatLng),
          ],
          addWaypoints: false,
          show: false,
          lineOptions: {
            styles: [
              { color: '#26f', opacity: 0.7, weight: 5 }, // Customize color, opacity, and weight of the route
            ],
            extendToWaypoints: false,
            missingRouteTolerance: 0,
          },
        }).addTo(this.map!);
        this.routeControl.hide();
        this.routeControl.on('routesfound', (event) => {
          const route = event.routes[0];
          this.timeToReachClient = this.formatSeconds(route.summary.totalTime);
          this.distanceLeft = this.formatDistance(route.summary.totalDistance);
          if(this.driverMarker)
            this.driverMarker!.setLatLng(this.driverPosition);
          if(this.clientMarker)
            this.clientMarker!.setLatLng(this.clientPosition);
          let toFit: any = [];
          if (this.driverMarker) {
            toFit.push([
              this.driverMarker!.getLatLng().lat,
              this.driverMarker!.getLatLng().lng,
            ]);
          }
          if (this.clientMarker) {
            toFit.push([
              this.clientMarker!.getLatLng().lat,
              this.clientMarker!.getLatLng().lng,
            ]);
          }
          this.map!.fitBounds(toFit, { padding: [50, 50] });
        });
      }
    }
  }

  protected setupLocationTracking(): void {
    this.navigatorWatch = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const currentTime = Date.now();
        this.lastLocationSent = { latitude, longitude };
        this.emitLocation();
        if (!this.idleTimer) {
          this.startIdleTimer();
        } else {
          this.resetIdleTimer();
        }
        this.lastEmitTime = currentTime;
      }
    );
  }

  protected startIdleTimer(): void {
    this.idleTimer = setTimeout(() => {
      this.emitLastLocation();
    }, 3000);
  }

  protected resetIdleTimer(): void {
    clearTimeout(this.idleTimer!);
    this.startIdleTimer();
  }

  protected emitLastLocation(): void {
    if (this.lastLocationSent && this.rideId) {
      const currentTime = Date.now();
      if (currentTime - this.lastEmitTime >= 3000) {
        this.emitLocation();
        this.resetIdleTimer();
      }
    }
  }

  protected emitLocation(): void {
    if (this.lastLocationSent && this.rideId) {
      const toemit = {
        position: this.lastLocationSent,
        rideId: this.rideId,
        isDriver: true,
      };
      this.setUserLocation(toemit.position, true);
      this.socketService.emit('driverUpdate', toemit);
    }
  }

  startIdleCheck() {
    this.clientIdleTimer = setInterval(() => {
      if (this.lastClientUpdateTime && Date.now() - this.lastClientUpdateTime >= 6000) {
        this.connectionLost = true;
      }
    }, 6000);
  }

  public killTimersAndWatchers() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }
    if (this.clientIdleTimer) {
      clearInterval(this.clientIdleTimer);
    }
    if (this.navigatorWatch) {
      navigator.geolocation.clearWatch(this.navigatorWatch);
    }
    if (this.socketSub) {
      this.socketSub?.unsubscribe();
    }
    this.subs.forEach(sub => {
      sub.unsubscribe();
    })
  }

  protected onCancelReasonEvent(event: any): void {
    if (event && event.cancel) {
      this.cancelingRideInProgress = false;
      return;
    }
    if (event && event.reason) {
      this.cancelRide(event.reason);
    }
  }

  protected reInitilizeComponent(): void {
    this.ngOnDestroy();
    this.resetAllProperties();
    this.ngOnInit();
  }

  protected resetAllProperties(): void {
    this.timeToReachClient = '';
    this.distanceLeft = '';
    this.currentState = rideState.goingToClient;
    this.map = null;
    this.clientMarker = null;
    this.driverMarker = null;
    this.routeControl = null;
    this.lastEmitTime = 0;
    this.lastLocationSent = null;
    this.idleTimer = null;
    this.navigatorWatch = null;
    this.socketSub = null;
    this.lastClientUpdateTime = null;
    this.isCanceledRide = false;
    this.connectionLost = false;
    this.data = {
      phoneNumber: '...',
      isDeferred: false,
      deferredDateTime: '...',
      created_at: '...',
      current_roadNbr: '...',
      current_Addressformatted: '...',
      destination_roadNbr: '...',
      destination_Addressformatted: '...',
      zone: '...',
      carType: '...',
      driverName: '...',
      takenByDriver: '...',
    };
    this.rideId = '';
    this.driverId = '';
  }

  formatDistance(distance: number) {
    if (distance >= 1000) {
      return (distance / 1000).toFixed(1) + ' km';
    } else {
      return distance + ' m';
    }
  }

  formatSeconds(seconds: number) {
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var remainingSeconds = Math.floor(seconds % 60);

    var result = '';
    if (hours > 0) {
      result += hours + 'h ';
    }
    if (minutes > 0 || hours > 0) {
      result += minutes + 'min ';
    }
    result += remainingSeconds + 'sec';

    return result;
  }
  /* protected setupOrientationTracking(): void {
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', event => {
        const alpha = event.alpha; // Yaw angle in degrees (0 to 360)
        this.socketService.emit("driverUpdate", { rotation: alpha, rideId: this.rideId, isDriver:true });
      }, false);
    }
  } 
  protected setUserRotation(rotation: any, isDriver?: boolean) {
    if (isDriver) {
      if (this.driverMarker) {
        this.driverMarker.setRotationAngle(rotation || 0);
      }
    } else {
      if (this.clientMarker) {
        this.clientMarker.setRotationAngle(rotation || 0);
      }
    }
  } */
}
