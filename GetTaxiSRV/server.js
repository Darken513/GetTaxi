const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const secretKey = 'GetTaxiSecretCH!'; //todo-P3 : keep it all in one file

const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const cacheService = require("./services/cache.service")
const multer = require('multer');

const accountSid = 'AC27734e295c97599812c0e02becdfe9de';
const authToken = 'c02795cb4139eb248ea48f4a48961fd2';
exports.twilioClient = require('twilio')(accountSid, authToken);

const port = process.env.PORT || 8080;
require('dotenv').config({ path: __dirname + '/prod.env' });

//initilize firestore database
const admin = require('firebase-admin');
var serviceAccount = require(__dirname + "/gettaxi-4c85a-firebase-adminsdk-8e866-0356bdf9cc.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://gettaxi-4c85a.firebaseio.com',
  storageBucket: 'gs://gettaxi-4c85a.appspot.com',
});
exports.storage = admin.storage();
exports.db = admin.firestore();

//-----------------------------------------------
// Middleware to verify JWT token and check user agent and IP address
function verifyToken(req, res, next) {
  console.log(req.path);
  if (
    req.path === '/login' ||
    req.path === '/signUp' ||
    req.path.startsWith('/getRideById') ||
    req.path.startsWith('/getDriverById') ||
    req.path.startsWith('/getZoneById') ||
    req.path.startsWith('/getCarByID') ||
    req.path.startsWith('/getCarBrandByID')
  ) {
    next();
    return;
  }
  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return res.json({ tokenError: 'Unauthorized - No token provided' });
  }
  const token = authorizationHeader.split(' ')[1];
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.json({ tokenError: 'Unauthorized - Invalid token' });
    }
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;
    if (decoded.userAgent !== userAgent || decoded.ipAddress !== ipAddress) {
      return res.json({ tokenError: 'Forbidden - User agent or IP address mismatch' });
    }
    next();
  });
}
//-----------------------------------------------

const app = express();
const server = http.createServer(app);

exports.io = socketIO(server);
const socketService = require('./services/socket.service');
socketService.initSocketSystem();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
exports.upload = upload;

cacheService.startCacheCleaner();

app.use(express.static(path.join(__dirname, "/public/adminGUI")));
app.use(express.static(path.join(__dirname, "/public/driverGUI")));
app.use(cors(
  {
    origin: '*',
    credentials: true,
  }
));
app.use(bodyParser.json());


const adminRouter = require('./routers/admin.router');
app.use('/admin', adminRouter);
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/adminGUI/index.html'));
});
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/adminGUI/index.html'));
});


const driverRouter = require('./routers/driver.router');
app.use('/driver', verifyToken, driverRouter);
app.get('/driver', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/driverGUI/index.html'));
});
app.get('/driver/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/driverGUI/index.html'));
});


server.listen(port, () => { console.log(`Server started on port ${port}`); });

//in case failed dont crash server, just throw error & continue
process.on('uncaughtException', (error) => {
  console.error('Error: ', error);
}); 