import { ActivatedRoute, Router } from "@angular/router";
import { DriverService } from "./driver.service";
import { SocketService } from "./socket.service";
import { Component, Inject } from "@angular/core";
import { Subscription, take } from "rxjs";

@Component({
    selector: 'app-BasicDataFetcher',
    template: '',
})
export class RideStatusDataFetcher {
    rideDoesntExist = false;
    public data: any = {
        phoneNumber: '...', //'+123 456 789',
        isDeferred: false,
        deferredDateTime: '...', //'yyyy-mm-ddThh:mm',
        created_at: '...', //'yyyy-mm-ddThh:mm',
        current_roadName: '...', //'Nom du Rue',
        current_roadNbr: '...', //'Numéro du Rue',
        current_postalCode: '...', //'Code postal',
        current_city: '...', //'Ville',
        destination_roadName: '...', //'Nom du Rue ( dest )',
        destination_roadNbr: '...', //'Numéro du Rue ( dest )',
        destination_postalCode: '...', //'Code postal ( dest )',
        destination_city: '...', //'Ville ( dest )',
        zone: '...', //'zone_id',
        carType: '...', //'car_id',
        driverName: '...',
        takenByDriver: '...',
    };
    public driverId: string = '';
    public rideId: string = '';

    public driver: any; //todo : use modals
    public ride: any; //todo : use modals
    public zone: any; //todo : use modals
    public car: any; //todo : use modals

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
                    if (val.title == "error") {
                        this.rideDoesntExist = true;
                    }
                    this.parseRideDetails(val);
                    const toPush = this.driverService.getDriverById(this.driverId).subscribe({
                        next: (val) => {
                            if (val.title == "error") {
                                this.rideDoesntExist = true;
                            }
                            this.driver = val; //todo if error redirect to 404
                            this.data.driverName = val.name + ' ' + val.familyName;
                            if (cb) cb(this);

                            const toPush0 = this.driverService.getZoneById(this.driver.zone).subscribe({
                                next: (val) => {
                                    if (val.title == "error") {
                                        this.rideDoesntExist = true;
                                    }
                                    this.data.zone = val.name;
                                    this.zone = val;
                                },
                            });
                            const toPush1 = this.driverService.getCarByID(this.driver.carType).subscribe({
                                next: (val) => {
                                    if (val.title == "error") {
                                        this.rideDoesntExist = true;
                                    }
                                    this.data.carType = val.name;
                                    this.car = val;
                                },
                            });
                            this.subs.push(toPush0, toPush1);
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
        this.data.takenByDriver = val.takenByDriver;
        this.data.phoneNumber = val.phoneNumber;
        this.data.isDeferred = val.isDeferred;
        this.data.deferredDateTime = val.deferredDateTime;
        // toDo: change this using new format
        this.data.currentLocation = val.currentLocation;
        this.data.created_at = this.formatDate(
            val.created_at._seconds * 1000
        );
        this.data.current_roadName = val.current_roadName;
        this.data.current_roadNbr = val.current_roadNbr;
        this.data.current_postalCode = val.current_postalCode;
        this.data.current_city = val.current_city;
        this.data.destination_roadName = val.destination_roadName;
        this.data.destination_roadNbr = val.destination_roadNbr;
        this.data.destination_postalCode = val.destination_postalCode;
        this.data.destination_city = val.destination_city;
    }

    public acceptRide() {
        this.driverService.changeRideStatus(this.rideId, this.driverId).pipe(take(1)).subscribe({
            next: (value) => {
                if (value.error) {
                    this.data.takenByDriver = 'other';
                } else {
                    this.data.takenByDriver = this.driverId;
                }
            },
        });
    }

    public cancelRide() {
        //toDo : should probably display a modal saying this ride will no longer be available if canceled 
        this.driverService.changeRideStatus(this.rideId, this.driverId).pipe(take(1)).subscribe({
            next: (value) => {
                if (!value.error) {
                    this.data.takenByDriver = undefined;
                    //to-do : ask for reason before canceling
                    this.redirectToRideStatus();
                }
            },
        });
    }

    public redirectToRealTime() {
        this.router.navigate([`driver/realtime/${this.rideId}/${this.driverId}`]);
    }
    public redirectToRideStatus() {
        this.socketService.canceledRide(this.data);
        this.router.navigate([`driver/ride-status/${this.rideId}/${this.driverId}`]);
    }

    public ignoreRide() { }

    formatDate(inputDate: any) {
        const date = new Date(inputDate);

        const day = date.getDate();
        const month = date.getMonth() + 1; // Months are zero-indexed
        const year = date.getFullYear();
        const hours = date.getHours();
        const minutes = date.getMinutes();

        const formattedDay = day < 10 ? '0' + day : day;
        const formattedMonth = month < 10 ? '0' + month : month;

        const formattedDate = `${formattedDay}.${formattedMonth}.${year}, ${hours}:${minutes}`;

        return formattedDate;
    }

    getDestination() {
        let toret = '';
        if (this.data.takenByDriver && this.data.takenByDriver == this.driverId) {
            toret += this.data.current_roadNbr + ' ';
        }
        toret +=
            this.data.current_roadName.toString().trim() +
            ' ' +
            this.data.current_postalCode.toString().trim() +
            ' ' +
            this.data.current_city.toString().trim();
        return toret;
    }
}