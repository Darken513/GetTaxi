import { ActivatedRoute, Router } from "@angular/router";
import { DriverService } from "../Services/driver.service";
import { SocketService } from "../Services/socket.service";
import { Component, Inject } from "@angular/core";
import { Subscription, take } from "rxjs";
import { formatDate } from "../utilities";

@Component({
    selector: 'app-BasicDataFetcher',
    template: '',
})
export class RideStatusDataFetcher {
    rideDoesntExist = false;
    public ready: boolean = false;
    public isCanceledRide: boolean = false;
    public connectionLost: boolean = false;

    public data: any = {
        phoneNumber: '...', //'+123 456 789',
        isDeferred: false,
        deferredDateTime: '...', //'yyyy-mm-ddThh:mm',
        created_at: '...', //'yyyy-mm-ddThh:mm',
        current_roadNbr: '...',
        current_Addressformatted: '...',
        destination_roadNbr: '...',
        destination_Addressformatted: '...',
        zone: '...', //'zone_id',
        carType: '...', //'cartype_id',
        carBrand: '...', //'carbrand_id',
        driverName: '...',
        takenByDriver: '...',
    };

    public driverId: string = '';
    public rideId: string = '';

    public driver: any; //todo-P3 : use modals
    public ride: any; //todo-P3 : use modals
    public zone: any; //todo-P3 : use modals
    public car: any; //todo-P3 : use modals

    public subs: Array<Subscription> = [];

    constructor(
        @Inject(String) public type: string,
        public socketService: SocketService,
        public driverService: DriverService,
        public activatedRoute: ActivatedRoute,
        public router: Router
    ) {
        socketService.initSocket();
    }

    ngOnInit(cb?: Function) {
        const toPush = this.activatedRoute.params.subscribe((params) => {
            this.driverId = params['driverId'];
            this.rideId = params['rideId'];
            const toPush = this.driverService.getRideById(this.rideId).subscribe({
                next: (val) => {
                    if (val.type == "error") {
                        this.rideDoesntExist = true;
                    }
                    this.parseRideDetails(val);
                    const toPush = this.driverService.getDriverById(this.driverId).subscribe({
                        next: (val) => {
                            if (val.type == "error") {
                                this.rideDoesntExist = true;
                            }
                            this.driver = val;
                            this.data.driverName = val.name + ' ' + val.familyName;
                            const toPush = this.driverService.getZoneById(this.driver.zone).subscribe({
                                next: (val) => {
                                    if (val.type == "error") {
                                        this.rideDoesntExist = true;
                                    }
                                    this.data.zone = val.name;
                                    this.zone = val;
                                    const toPush = this.driverService.getCarByID(this.driver.carType).subscribe({
                                        next: (val) => {
                                            if (val.type == "error") {
                                                this.rideDoesntExist = true;
                                            }
                                            this.data.carType = val.name;
                                            this.car = val;
                                            const toPush = this.driverService.getCarBrandByID(this.driver.carBrand).subscribe({
                                                next: (val) => {
                                                    if (val.type == "error") {
                                                        this.rideDoesntExist = true;
                                                    }
                                                    this.data.carBrand = val.name;
                                                    this.car = val;
                                                },
                                            });
                                            this.subs.push(toPush);
                                        },
                                    });
                                    this.subs.push(toPush);
                                    this.ready = true;
                                    if (cb) cb(this);
                                },
                            });
                            this.subs.push(toPush);
                        },
                    });
                    this.subs.push(toPush);
                },
            });
            this.subs.push(toPush);
        });
        this.subs.push(toPush);
    }

    parseRideDetails(val: any) {
        this.ride = val;
        this.data.isCanceledRide = val.isCanceled;
        this.isCanceledRide = val.isCanceled;
        this.data.takenByDriver = val.takenByDriver;
        this.data.phoneNumber = val.phoneNumber;
        this.data.isDeferred = val.isDeferred;
        this.data.deferredDateTime = val.deferredDateTime;

        this.data.currentLocation = val.currentLocation;
        this.data.created_at = formatDate(val.created_at);
        this.data.current_roadNbr = val.current_roadNbr;
        this.data.current_Addressformatted = val.current_Addressformatted;
        this.data.destination_roadNbr = val.destination_roadNbr;
        this.data.destination_Addressformatted = val.destination_Addressformatted;
    }

    public acceptRide() {
        this.driverService.acceptRide(this.rideId, this.driverId).pipe(take(1)).subscribe({
            next: (value) => {
                if (value.error) {
                    this.data.takenByDriver = 'other';
                } else {
                    this.data.takenByDriver = this.driverId;
                }
            },
        });
    }

    public cancelRide(reason: any) {
        this.driverService.cancelRide(this.rideId, this.driverId, reason).pipe(take(1)).subscribe({
            next: (value: any) => {
                if (!value.error) {
                    this.data.takenByDriver = undefined;
                    this.socketService.cancelRide(this.rideId);
                    this.redirectToRideStatus();
                }
            },
        });
    }

    public redirectToRealTime() {
        this.router.navigate([`driver/realtime/${this.rideId}/${this.driverId}`]);
    }
    public redirectToRideStatus() {
        this.router.navigate([`driver/ride-status/${this.rideId}/${this.driverId}`]);
    }
    public redirectToProfile(){
        this.router.navigate([`profile/`]);
    }

    public ignoreRide() { }

    getDestination(): string {
        if (this.data.takenByDriver && this.data.takenByDriver == this.driverId) {
            return this.data.current_Addressformatted;
        }
        return this.deleteFirstOccurrence(this.data.current_Addressformatted, this.data.current_roadNbr);
    }

    public formatDate_ = formatDate;

    deleteFirstOccurrence(mainString: string, subString: string): string {
        if (!subString)
            return mainString;
        if (!mainString)
            return '';
        const index = mainString.indexOf(subString);
        if (index === -1)
            return mainString;
        return mainString.slice(0, index) + mainString.slice(index + subString.length);
    }
}