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
    public isCanceledByDriver: boolean = false;
    public isCanceledByClient: boolean = false;
    public connectionLost: boolean = false;

    public data: any = {
        phoneNumber: '...', //'+123 456 789',
        isDeferred: false,
        deferredDateTime: '...', //'yyyy-mm-ddThh:mm',
        created_at: '...', //'yyyy-mm-ddThh:mm',
        current_roadNbr: '...', //'Numéro du Rue',
        current_Addressformatted: '...', //'Ville',
        destination_roadNbr: '...', //'Numéro du Rue ( dest )',
        destination_Addressformatted: '...', //'Ville',
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
                        this.isCanceledByDriver = true;
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
        this.data.isCanceled = val.isCanceled;
        this.isCanceledByClient = val.isCanceled;
        this.data.deferredDateTime = val.deferredDateTime;

        this.data.currentLocation = val.currentLocation;
        //todo-P1 : sometimes it doesnt have the _seconds prop instead it passes a date as a string
        this.data.created_at = this.formatDate(
            val.created_at._seconds * 1000
        );
        this.data.current_roadNbr = val.current_roadNbr;
        this.data.current_Addressformatted = val.current_Addressformatted;
        this.data.destination_roadNbr = val.destination_roadNbr;
        this.data.destination_Addressformatted = val.destination_Addressformatted;
    }

    public cancelRide(reason: any) {
        let toSend = { id: reason.id, name: reason.name }
        this.driverService.cancelRide(this.rideId, toSend).pipe(take(1)).subscribe({
            next: (value: any) => {
                if (!value.error) {
                    this.socketService.cancelRide({ rideId: this.rideId });
                    this.isCanceledByClient = true;
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