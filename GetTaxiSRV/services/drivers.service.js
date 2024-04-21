const bcrypt = require('bcrypt');
const secretKey = 'GetTaxiSecretCH!';
const jwt = require('jsonwebtoken');

const { db, storage } = require("../server");
const driversRef = db.collection("Drivers");

const cacheService = require("./cache.service");
const cachePath = ["drivers", "values"];

const DEAFULT_CREDITS = 10; //todo-p2 make the const values in an env file

function createToken(data) {
  const token = jwt.sign(data, secretKey, {
    algorithm: 'HS256'
  });
  return token;
}

exports.login = async (req) => {
  try {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;

    let userCredentials = req.body;
    const combinedPassword = userCredentials.password + secretKey;
    const querySnapshot = await driversRef
      .where('email', '==', userCredentials.email)
      .limit(1)
      .get();

    if (!querySnapshot.empty) {
      const driverRecord = querySnapshot.docs[0].data();

      let samePassword = await bcrypt.compare(combinedPassword, driverRecord.password);
      if (!samePassword) {
        return -1;
      }

      const driverId = querySnapshot.docs[0].id;
      const tokenPayload = {
        driverId,
        userAgent,
        ipAddress
      };
      delete tokenPayload.password;
      const token = createToken(tokenPayload);
      return token;
    }
    return -2;
  } catch (error) {
    return -2;
  }
}
exports.signUp = async (userData) => {
  try {
    const combinedPassword = userData.password + secretKey;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(combinedPassword, salt);

    const existingUserSnapshot = await driversRef.where('email', '==', userData.email).limit(1).get();

    if (!existingUserSnapshot.empty) {
      return -1;
    }
    await driversRef.add({
      email: userData.email,
      password: hashedPassword,
      isActive: false,
      credits: DEAFULT_CREDITS,
      created_at: new Date()
    });
    return 0;
  } catch (error) {
    return -2;
  }
};

exports.getAllDrivers = async () => {
  const cachedResult = cacheService.getArrayOfDefs(cachePath[0])
  if (cachedResult) {
    return cachedResult;
  }
  try {
    const snapshot = await driversRef.get();
    const drivers = snapshot.docs.map((doc) => {
      return { id: doc.id, ...doc.data() };
    });
    cacheService.storeOrUpdateArrayofDefs(cachePath[0], drivers);
    return drivers;
  } catch (error) {
    return -1; //error case "-1"
  }
};

exports.getDriverByID = async (driverId) => {
  const cachedResult = cacheService.getByPath([...cachePath, driverId])
  if (cachedResult) {
    return cachedResult;
  }
  try {
    const docRef = driversRef.doc(driverId);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      throw Error('Driver with id : ' + driverId + ' Doesnt exist')
    }
    //todo-P2 : should store def in cache
    return { id: snapshot.id, ...snapshot.data() };
  } catch (error) {
    return -1; //error case "-1"
  }
};

exports.createDriver = async (data) => {
  try {
    const docRef = await driversRef.add(data);
    const toret = { id: docRef.id, ...data };
    cacheService.storeOrUpdateDef([...cachePath, docRef.id], toret)
    return toret;
  } catch (error) {
    return -1;
  }
};

exports.updateDriver = async (driverId, updatedData) => {
  try {
    const docRef = driversRef.doc(driverId);
    await docRef.update(updatedData);
    const toSaveCache = { id: driverId, ...updatedData }
    cacheService.storeOrUpdateDef([...cachePath, driverId], toSaveCache);
    return 0;
  } catch (error) {
    return -1;
  }
};
exports.updateDriversCredit = async (driverId, updatedData) => {
  try {
    const docRef = driversRef.doc(driverId);
    await docRef.update(updatedData);
    cacheService.updateDefSpecificProp([...cachePath, driverId, 'value', updatedData], updatedData.credits);
    return 0;
  } catch (error) {
    return -1;
  }
};

exports.changeDriverStatus = async (driverId, updatedData, res) => {
  try {
    const docRef = driversRef.doc(driverId);
    await docRef.update(updatedData);
    cacheService.updateDefSpecificProp([...cachePath, driverId, 'value', 'isActive'], updatedData.isActive);
    return 0;
  } catch (error) {
    return -1;
  }
};

exports.deleteDriverById = async (driverId) => {
  try {
    const docRef = driversRef.doc(driverId);
    await docRef.delete();
    cacheService.deleteByPath([...cachePath, driverId])
    return 0;
  } catch (error) {
    return -1;
  }
};

exports.uploadFile = (file, driverId, fileId) => {
  const bucket = storage.bucket();
  const folderName = driverId;
  const fileExtension = file.originalname.split('.').pop();
  const fileName = fileId + (fileExtension ? '.' + fileExtension : '');

  const blob = bucket.file(`${folderName}/${fileName}`);

  const blobStream = blob.createWriteStream();

  blobStream.on('finish', async () => {
    const updatedData = {};
    updatedData[fileId] = fileName;
    await exports.updateDriver(driverId, updatedData);
  });

  blobStream.end(file.buffer);

  return fileName;
}

exports.readFileURL = async (driverId, fileId) => {
  const bucket = storage.bucket();
  const folderName = driverId; // Replace with the folder containing your image
  const fileName = fileId; // Replace with the actual image file name
  const filePath = `${folderName}/${fileName}`;
  try {
    // Get a signed URL for the file
    const [signedUrl] = await bucket.file(filePath).getSignedUrl({
      action: 'read',
      expires: Date.now() + 120 * 1000
    });
    return signedUrl;
  } catch (error) {
    return -1;
  }
}