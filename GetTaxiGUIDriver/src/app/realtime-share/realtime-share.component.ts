import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
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
  implements OnInit, OnDestroy, AfterViewInit {
  timeToReachClient: string = "";
  distanceLeft: string = "";
  currentState: rideState = rideState.goingToClient;
  map: L.Map | null = null;
  clientMarker: L.Marker | null = null;
  driverMarker: L.Marker | null = null;
  routeControl: L.Routing.Control | null = null;

  protected lastEmitTime: number = 0;
  protected lastLocationSent: { latitude: number; longitude: number } | null = null;
  protected idleTimer: ReturnType<typeof setTimeout> | null = null;
  protected navigatorWatch: ReturnType<typeof navigator.geolocation.watchPosition> | null = null;
  protected socketSub: Subscription | null = null;

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
      if (this.data.takenByDriver != this.driverId) {
        this.redirectToRideStatus();
      }
      this.socketService.initRoomJoin(data);
      this.socketSub = this.socketService.socketEvent.subscribe({
        next: (response: any) => {
          if (response.event == 'clientUpdate') {
            this.setUserLocation(response.data.position, false);
          }
        },
      });
    }
    super.ngOnInit(cb);
  }
  ngOnDestroy(): void {
    this.killTimersAndWatchers();
    this.subs.forEach(sub => {
      sub.unsubscribe();
    })
  }
  ngAfterViewInit(): void {
    this.initializeMap();
    this.setupLocationTracking();
    //this.setupOrientationTracking();
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
  protected initializeMap(): void {
    this.map = L.map('map').setView([0, 0], 2); // Set the initial map center and zoom level
    L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(this.map);
  }
  protected setUserLocation(position: any, isDriver?: boolean) {
    const userLocation: L.LatLngTuple = [position.latitude + (!isDriver ? 0.02 : 0), position.longitude + (!isDriver ? 0.02 : 0)];
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
        this.driverMarker.setLatLng(userLocation);
      }
    } else {
      if (!this.clientMarker) {
        this.clientMarker = L.marker(userLocation).addTo(this.map!);
      } else {
        this.clientMarker.setLatLng(userLocation);
      }
    }
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
    this.map!.fitBounds(toFit);
    if (this.driverMarker && this.clientMarker) {
      if (this.routeControl) {
        this.map?.removeControl(this.routeControl);
        this.routeControl.remove();
      }
      this.routeControl = L.Routing.control({
        waypoints: [
          this.driverMarker.getLatLng(),
          this.clientMarker.getLatLng()
        ],
        routeWhileDragging: true,
        addWaypoints: false,
        show: false,
        lineOptions: {
          styles: [
            { color: '#26f', opacity: 0.7, weight: 5 } // Customize color, opacity, and weight of the route
          ],
          extendToWaypoints: false,
          missingRouteTolerance: 0
        }
      }).addTo(this.map!);
      this.routeControl.hide()
      this.routeControl.on('routesfound', (event) => {
        const route = event.routes[0];
        this.timeToReachClient = this.formatSeconds(route.summary.totalTime);
        this.distanceLeft = this.formatDistance(route.summary.totalDistance)
      });
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
      },
      (error) => {
        console.error('Error getting user location:', error);
      }
    );
  }

  protected startIdleTimer(): void {
    this.idleTimer = setTimeout(() => {
      this.emitLastLocation();
    }, 5000);
  }

  protected resetIdleTimer(): void {
    clearTimeout(this.idleTimer!);
    this.startIdleTimer();
  }

  protected emitLastLocation(): void {
    if (this.lastLocationSent && this.rideId) {
      const currentTime = Date.now();
      if (currentTime - this.lastEmitTime >= 5000) {
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

  public killTimersAndWatchers() {
    clearTimeout(this.idleTimer!);
    navigator.geolocation.clearWatch(this.navigatorWatch!);
    this.socketSub?.unsubscribe();
  }

  /* protected setupOrientationTracking(): void {
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', event => {
        const alpha = event.alpha; // Yaw angle in degrees (0 to 360)
        this.socketService.emit("driverUpdate", { rotation: alpha, rideId: this.rideId, isDriver:true });
      }, false);
    } else {
      console.error('Device orientation events are not supported.');
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
