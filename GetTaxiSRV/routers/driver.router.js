const express = require('express');
const carType_controller = require('../controllers/carTypes.controller');
const driver_controller = require('../controllers/drivers.controller');
const zone_controller = require('../controllers/zones.controller');
const rideStatus_controller = require('../controllers/rideStatus.controller');
const { upload } = require('../server');

const router = express.Router();

//authentification
router.post('/login', driver_controller.login);
router.post('/signUp', driver_controller.signUp);

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

//Driver profile edition section
router.get('/getAllCarTypes', carType_controller.getAllCarTypes); //todo-P1 : make sure that the sender is the owner !!!
router.get('/getAllZones', zone_controller.getAllZones); //same make sure that the sender is the owner !!!
router.post('/updateDriver/:driverId', driver_controller.updateDriver); //same make sure that the sender is the owner !!!
router.post('/uploadFile/:driverId/:fileId', upload.single('file'), driver_controller.uploadFile); //same make sure that the sender is the owner !!!
router.get('/readFileURL/:driverId/:filePath', driver_controller.readFileURL); //same make sure that the sender is the owner !!!

module.exports = router;