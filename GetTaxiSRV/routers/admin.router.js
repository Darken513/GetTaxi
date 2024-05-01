const express = require('express');
const carType_controller = require('../controllers/carTypes.controller');
const carBrand_controller = require('../controllers/carBrands.controller');
const driver_controller = require('../controllers/drivers.controller');
const zone_controller = require('../controllers/zones.controller');
const rideStatus_controller = require('../controllers/rideStatus.controller');
const { upload } = require('../server');

const router = express.Router();

//Car Type section
router.get('/getAllCarTypes', carType_controller.getAllCarTypes);
router.post('/createCarType', carType_controller.createCarType);
router.get('/deleteCarTypeById/:carTypeId', carType_controller.deleteCarTypeById);

//Car Brand section
router.get('/getAllCarBrands', carBrand_controller.getAllCarBrands);
router.post('/createCarBrand', carBrand_controller.createCarBrand);
router.get('/deleteCarBrandById/:carBrandId', carBrand_controller.deleteCarBrandById);

//Driver section
router.get('/getAllDrivers', driver_controller.getAllDrivers);
router.post('/createDriver', driver_controller.createDriver);
router.post('/updateDriver/:driverId', driver_controller.updateDriver);
router.get('/changeDriverStatus/:driverId/:status', driver_controller.changeDriverStatus);
router.get('/deleteDriverById/:driverId', driver_controller.deleteDriverById);
router.post('/uploadFile/:driverId/:fileId', upload.single('file'), driver_controller.uploadFile);
router.get('/readFileURL/:driverId/:filePath', driver_controller.readFileURL);

//Zone section
router.get('/getAllZones', zone_controller.getAllZones);
router.post('/createZone', zone_controller.createZone);
router.get('/deleteZoneById/:zoneId', zone_controller.deleteZoneById);

//RideStatus section
router.post('/initRideStatus', rideStatus_controller.initRideStatus);

module.exports = router;