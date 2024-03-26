const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

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
app.use('/driver', driverRouter);
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