const express = require('express');
const carType_controller = require('../controllers/carTypes.controller');
const carBrand_controller = require('../controllers/carBrands.controller');
const driver_controller = require('../controllers/drivers.controller');
const zone_controller = require('../controllers/zones.controller');
const rideStatus_controller = require('../controllers/rideStatus.controller');

const router = express.Router();

//Car Type section
router.get('/getCarByID/:carId', carType_controller.getCarByID);
router.get('/getCarBrandByID/:carBrandId', carBrand_controller.getCarBrandByID);

//Driver section
router.get('/getDriverByID/:driverId', driver_controller.getDriverByID);

//Zone section
router.get('/getZoneById/:zoneId', zone_controller.getZoneById);

//RideStatus section
router.get('/getRideById/:rideId', rideStatus_controller.getRideById);
router.post('/cancelRide/:rideId', rideStatus_controller.cancelRide);

//Driver profile edition section
router.get('/getAllCarTypes', carType_controller.getAllCarTypes);
router.get('/getAllCarBrands', carBrand_controller.getAllCarBrands);
router.get('/getAllZones', zone_controller.getAllZones);

module.exports = router;