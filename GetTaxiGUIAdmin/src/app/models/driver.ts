import { Zone } from "./Zone";
import { CarType } from "./carType";

export interface Driver {
    confNok: boolean;
    id: string;
    name: string;
    familyName: string;
    phoneNbr: string;
    carType: string;
    carDescription: string;
    zone: string;
    isActive:boolean;
    drivingPermit: string;
    transportPermit: string;
    taxiPermit: string;
    GrayCard: string;
}