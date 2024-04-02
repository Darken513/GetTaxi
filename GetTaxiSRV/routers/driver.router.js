const express = require('express');
const carType_controller = require('../controllers/carTypes.controller');
const driver_controller = require('../controllers/drivers.controller');
const zone_controller = require('../controllers/zones.controller');
const rideStatus_controller = require('../controllers/rideStatus.controller');

const router = express.Router();

//Car Type section
router.get('/getCarByID/:carId', carType_controller.getCarByID);

//Driver section
router.get('/getDriverByID/:driverId', driver_controller.getDriverByID);

//Zone section
router.get('/getZoneById/:zoneId', zone_controller.getZoneById);

//RideStatus section
router.get('/getRideById/:rideId', rideStatus_controller.getRideById);
router.get('/acceptRide/:rideId/:driverId', rideStatus_controller.acceptRide);
router.post('/cancelRide/:rideId', rideStatus_controller.cancelRide);

module.exports = router;