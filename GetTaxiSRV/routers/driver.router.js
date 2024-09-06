const express = require('express');
const carType_controller = require('../controllers/carTypes.controller');
const carBrand_controller = require('../controllers/carBrands.controller');
const driver_controller = require('../controllers/drivers.controller');
const paymentService = require('../services/paymentService');
const zone_controller = require('../controllers/zones.controller');
const rideStatus_controller = require('../controllers/rideStatus.controller');
const { upload } = require('../server');
const jwt = require('jsonwebtoken');

//-----------------------------------------------
// Middleware to verify JWT token and check user agent and IP address
function verifyToken(req, res, next) {
    if (
        req.path === '/login' ||
        req.path === '/signUp'
    ) {
        next();
        return;
    }
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        return res.json({ tokenError: 'Unauthorized - No token provided' });
    }
    const token = authorizationHeader.split(' ')[1];
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.json({ tokenError: 'Unauthorized - Invalid token' });
        }
        const userAgent = req.headers['user-agent'];
        const ipAddress = req.ip;
        if (decoded.userAgent !== userAgent || decoded.ipAddress !== ipAddress) {
            return res.json({ tokenError: 'Forbidden - User agent or IP address mismatch' });
        }
        req.decoded = decoded;
        next();
    });
}
//-----------------------------------------------

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
router.post('/login', verifyToken, driver_controller.login);
router.post('/signUp', verifyToken, driver_controller.signUp);

//Car Type section
router.get('/getCarByID/:carId', verifyToken, carType_controller.getCarByID);
router.get('/getCarBrandByID/:carBrandId', verifyToken, carBrand_controller.getCarBrandByID);

//Driver section
router.get('/getDriverByID/:driverId', verifyToken, driver_controller.getDriverByID);
router.get('/getDriverBehaviorsById/:driverId/:nbr', verifyToken, driver_controller.getDriverBehaviorsById);
//Zone section
router.get('/getZoneById/:zoneId', verifyToken, zone_controller.getZoneById);

//RideStatus section
router.get('/getRideById/:rideId', verifyToken, rideStatus_controller.getRideById);
router.get('/acceptRide/:rideId/:driverId/:latitude/:longitude', verifyToken, rideStatus_controller.acceptRide);
router.post('/cancelRide/:rideId', verifyToken, rideStatus_controller.cancelRide);
router.get('/changeRideStatus/:driverId/:rideId/:currentState', verifyToken, isValidRequester, rideStatus_controller.changeRideStatus);

//Driver profile edition section
router.get('/getAllCarTypes', verifyToken, carType_controller.getAllCarTypes);
router.get('/getAllCarBrands', verifyToken, carBrand_controller.getAllCarBrands);
router.get('/getAllZones', verifyToken, zone_controller.getAllZones);
router.post('/updateDriver/:driverId', verifyToken, isValidRequester, driver_controller.updateDriver);
router.post('/uploadFile/:driverId/:fileId', verifyToken, isValidRequester, upload.single('file'), driver_controller.uploadFile);
router.get('/readFileURL/:driverId/:filePath', verifyToken, isValidRequester, driver_controller.readFileURL);
router.get('/sendSMSVerificationCode', verifyToken, driver_controller.sendSMSVerificationCode);
router.get('/verifySMSCode/:verifCode', verifyToken, driver_controller.verifySMSCode);

router.post('/payment/:driverId', verifyToken, verifyToken, isValidRequester, paymentService.initPayment);
router.post('/confirm-payment/:driverId', verifyToken, verifyToken, isValidRequester, paymentService.confirmPayment);

module.exports = router;