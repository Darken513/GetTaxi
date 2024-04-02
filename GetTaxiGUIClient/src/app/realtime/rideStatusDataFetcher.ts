import { ActivatedRoute, Router } from "@angular/router";
import { DriverService } from "../driver.service";
import { SocketService } from "../socket.service";
import { Component, Inject } from "@angular/core";
import { Subscription, take } from "rxjs";

@Component({
    selector: 'app-BasicDataFetcher',
    template: '',
})
export class RideStatusDataFetcher {
    rideDoesntExist = false;
    public ready: boolean = false;
    public canceledRide: boolean = false;
    public connectionLost: boolean = false;

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
        let toPush = this.activatedRoute.params.subscribe((params) => {
            this.rideId = params['rideId'];
            let toPush = this.driverService.getRideById(this.rideId).subscribe({
                next: (val) => {
                    if (val.title == "error") {
                        this.rideDoesntExist = true;
                        return;
                    }
                    this.parseRideDetails(val);
                    if (!this.data.takenByDriver) {
                        this.canceledRide = true;
                        return;
                    }
                    let toPush = this.driverService.getDriverById(this.data.takenByDriver).subscribe({
                        next: (val) => {
                            if (val.title == "error") {
                                this.rideDoesntExist = true;
                            }
                            this.driver = val;
                            this.data.driverName = val.name + ' ' + val.familyName;
                            const toPush = this.driverService.getZoneById(this.driver.zone).subscribe({
                                next: (val) => {
                                    if (val.title == "error") {
                                        this.rideDoesntExist = true;
                                    }
                                    this.data.zone = val.name;
                                    this.zone = val;
                                    const toPush = this.driverService.getCarByID(this.driver.carType).subscribe({
                                        next: (val) => {
                                            if (val.title == "error") {
                                                this.rideDoesntExist = true;
                                            }
                                            this.data.carType = val.name;
                                            this.car = val;
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
        this.data.takenByDriver = val.takenByDriver;
        this.data.phoneNumber = val.phoneNumber;
        this.data.isDeferred = val.isDeferred;
        this.data.deferredDateTime = val.deferredDateTime;

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

    public cancelRide(reason:any) {
        this.driverService.cancelRide(this.rideId, reason).pipe(take(1)).subscribe({
            next: (value: any) => {
                if (!value.error) {
                    //toDo-P1 : ask for reason before canceling
                }
            },
        });
    }

    formatDate(inputDate: any) {
        // Parse the input date string
        const date = new Date(inputDate);

        // Extract date components
        const day = date.getDate();
        const month = date.getMonth() + 1; // Months are zero-indexed
        const year = date.getFullYear();
        const hours = date.getHours();
        const minutes = date.getMinutes();

        // Add leading zeros if necessary
        const formattedDay = day < 10 ? '0' + day : day;
        const formattedMonth = month < 10 ? '0' + month : month;

        // Construct the formatted date string
        const formattedDate = `${formattedDay}.${formattedMonth}.${year}, ${hours}:${minutes}`;

        return formattedDate;
    }
}