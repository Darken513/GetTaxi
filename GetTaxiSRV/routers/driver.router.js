const express = require('express');
const carType_controller = require('../controllers/carTypes.controller');
const carBrand_controller = require('../controllers/carBrands.controller');
const driver_controller = require('../controllers/drivers.controller');
const zone_controller = require('../controllers/zones.controller');
const rideStatus_controller = require('../controllers/rideStatus.controller');
const { upload } = require('../server');
const jwt = require('jsonwebtoken');

const router = express.Router();

const isValidRequester = (req, res, next) => {
    const driverId = req.params.driverId;
    const authorizationHeader = req.headers.authorization;
    const token = authorizationHeader.split(' ')[1];
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err || decoded.driverId !== driverId) {
            return res.status(400).json({ error: 'Forbidden - Unvalid request' });
        }
        next();
    });
};

//authentification
router.post('/login', driver_controller.login);
router.post('/signUp', driver_controller.signUp);

//Car Type section
router.get('/getCarByID/:carId', carType_controller.getCarByID);
router.get('/getCarBrandByID/:carBrandId', carBrand_controller.getCarBrandByID);

//Driver section
router.get('/getDriverByID/:driverId', driver_controller.getDriverByID);

//Zone section
router.get('/getZoneById/:zoneId', zone_controller.getZoneById);

//RideStatus section
router.get('/getRideById/:rideId', rideStatus_controller.getRideById);
router.get('/acceptRide/:rideId/:driverId', rideStatus_controller.acceptRide);
router.post('/cancelRide/:rideId', rideStatus_controller.cancelRide);

//Driver profile edition section
router.get('/getAllCarTypes', carType_controller.getAllCarTypes);
router.get('/getAllCarBrands', carBrand_controller.getAllCarBrands);
router.get('/getAllZones', zone_controller.getAllZones);
router.post('/updateDriver/:driverId', isValidRequester, driver_controller.updateDriver);
router.post('/uploadFile/:driverId/:fileId', isValidRequester, upload.single('file'), driver_controller.uploadFile);
router.get('/readFileURL/:driverId/:filePath', isValidRequester, driver_controller.readFileURL);
router.get('/sendSMSVerificationCode', driver_controller.sendSMSVerificationCode);
router.get('/verifySMSCode/:verifCode', driver_controller.verifySMSCode);

module.exports = router;