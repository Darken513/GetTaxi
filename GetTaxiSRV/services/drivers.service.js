const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { db, storage, twilioClient } = require("../server");
const driversRef = db.collection("Drivers");
const driverBehaviorRef = db.collection("DriverBehavior");

const cacheService = require("./cache.service");
const driver_cachePath = ["drivers", "values"];
const DBH_cachepath = ["driverBehavior", "values"];

verificationCodes = {}; //driverId : generated code

function createToken(data) {
  const token = jwt.sign(data, process.env.SECRET_KEY, {
    algorithm: "HS256",
  });
  return token;
}
function generateVerifCode() {
  const max = 9999;
  const randomNum = Math.floor(Math.random() * max);
  return String(randomNum).padStart(4, "0");
}

exports.login = async (req) => {
  try {
    const userAgent = req.headers["user-agent"];
    const ipAddress = req.ip;

    let userCredentials = req.body;
    const combinedPassword = userCredentials.password + process.env.SECRET_KEY;
    const querySnapshot = await driversRef
      .where("email", "==", userCredentials.email)
      .limit(1)
      .get();

    if (!querySnapshot.empty) {
      const driverRecord = querySnapshot.docs[0].data();

      let samePassword = await bcrypt.compare(
        combinedPassword,
        driverRecord.password
      );
      if (!samePassword) {
        return -1;
      }

      const driverId = querySnapshot.docs[0].id;
      const tokenPayload = {
        driverId,
        userAgent,
        ipAddress,
      };
      delete tokenPayload.password;
      const token = createToken(tokenPayload);

      const toSaveCache = { id: driverId, ...driverRecord };
      cacheService.storeOrUpdateDef([...driver_cachePath, driverId], toSaveCache)
      return token;
    }
    return -2;
  } catch (error) {
    return -2;
  }
};
exports.signUp = async (userData) => {
  try {
    const combinedPassword = userData.password + process.env.SECRET_KEY;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(combinedPassword, salt);

    const existingUserSnapshot = await driversRef
      .where("email", "==", userData.email)
      .limit(1)
      .get();

    if (!existingUserSnapshot.empty) {
      return -1;
    }
    await driversRef.add({
      email: userData.email,
      password: hashedPassword,
      isActive: false,
      credits: process.env.DRIVER_DEAFULT_CREDITS,
      totalIncome: 0,
      totalSpent: 0,
      created_at: new Date(),
    });
    return 0;
  } catch (error) {
    return -2;
  }
};

exports.getAllDrivers = async () => {
  const cachedResult = cacheService.getArrayOfDefs(driver_cachePath[0]);
  if (cachedResult) {
    return cachedResult;
  }
  try {
    const snapshot = await driversRef.get();
    const drivers = snapshot.docs.map((doc) => {
      return { id: doc.id, ...doc.data() };
    });
    cacheService.storeOrUpdateArrayofDefs(driver_cachePath[0], drivers);
    return drivers;
  } catch (error) {
    return -1; //error case "-1"
  }
};

exports.getDriverByID = async (driverId) => {
  const cachedResult = cacheService.getByPath([...driver_cachePath, driverId]);
  if (cachedResult) {
    return cachedResult;
  }
  try {
    const docRef = driversRef.doc(driverId);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      throw Error("Driver with id : " + driverId + " Doesnt exist");
    }
    const toSaveCache = { id: driverId, ...snapshot.data() };
    cacheService.storeOrUpdateDef([...driver_cachePath, driverId], toSaveCache)
    return { id: snapshot.id, ...snapshot.data() };
  } catch (error) {
    return -1; //error case "-1"
  }
};

exports.getDriverBehaviorsById = async (driverId, nbr) => {
  const cachedResult = cacheService.getByPath([...DBH_cachepath, driverId]);
  if (cachedResult && Object.values(cachedResult).length >= parseInt(nbr)) {
    return { behaviors: Object.values(cachedResult).map(val => val.value).slice(0, parseInt(nbr)) };
  }
  try {
    const querySnapshot = await driverBehaviorRef
      .where("driverId", "==", driverId)
      .orderBy("created_at", "desc")
      .limit(parseInt(nbr))
      .get();
    if (!querySnapshot.empty) {
      const behaviors = querySnapshot.docs.map(val => val.data());
      Object.values(behaviors).forEach((behaviorIstance, index) => {
        cacheService.storeOrUpdateDef(
          [...DBH_cachepath, driverId, "value", index],
          behaviorIstance
        );
      });
      return { behaviors };
    }
    return { behaviors: [] };
  } catch (error) {
    console.log(error);
    return -1; //error case "-1"
  }
};

exports.createDriver = async (data) => {
  try {
    const docRef = await driversRef.add(data);
    const toret = { id: docRef.id, ...data };
    cacheService.storeOrUpdateDef([...driver_cachePath, docRef.id], toret);
    return toret;
  } catch (error) {
    return -1;
  }
};

exports.updateDriver = async (driverId, updatedData) => {
  try {
    const docRef = driversRef.doc(driverId);
    await docRef.update(updatedData);
    const toSaveCache = { id: driverId, ...updatedData };
    Object.keys(toSaveCache).forEach((key) => {
      cacheService.updateDefSpecificProp(
        [...driver_cachePath, driverId, "value", key],
        toSaveCache[key]
      );
    });
    return 0;
  } catch (error) {
    return -1;
  }
};
exports.updateDriversSpecificProp = async (driverId, key, updatedData) => {
  try {
    const docRef = driversRef.doc(driverId);
    await docRef.update(updatedData);
    cacheService.updateDefSpecificProp(
      [...driver_cachePath, driverId, "value", key],
      updatedData[key]
    );
    return 0;
  } catch (error) {
    return -1;
  }
};

exports.changeDriverStatus = async (driverId, updatedData, res) => {
  try {
    const docRef = driversRef.doc(driverId);
    await docRef.update(updatedData);
    cacheService.updateDefSpecificProp(
      [...driver_cachePath, driverId, "value", "isActive"],
      updatedData.isActive
    );
    return 0;
  } catch (error) {
    return -1;
  }
};

exports.deleteDriverById = async (driverId) => {
  try {
    const docRef = driversRef.doc(driverId);
    await docRef.delete();
    cacheService.deleteByPath([...driver_cachePath, driverId]);
    return 0;
  } catch (error) {
    return -1;
  }
};

exports.uploadFile = (file, driverId, fileId) => {
  const bucket = storage.bucket();
  const folderName = driverId;
  const fileExtension = file.originalname.split(".").pop();
  const fileName = fileId + (fileExtension ? "." + fileExtension : "");

  const blob = bucket.file(`${folderName}/${fileName}`);

  const blobStream = blob.createWriteStream();

  blobStream.on("finish", async () => {
    const updatedData = {};
    updatedData[fileId] = fileName;
    await exports.updateDriver(driverId, updatedData, true);
  });

  blobStream.end(file.buffer);

  return fileName;
};

exports.readFileURL = async (driverId, fileId) => {
  const bucket = storage.bucket();
  const folderName = driverId; // Replace with the folder containing your image
  const fileName = fileId; // Replace with the actual image file name
  const filePath = `${folderName}/${fileName}`;
  try {
    // Get a signed URL for the file
    const [signedUrl] = await bucket.file(filePath).getSignedUrl({
      action: "read",
      expires: Date.now() + 120 * 1000,
    });
    return signedUrl;
  } catch (error) {
    return -1;
  }
};

exports.sendSMSVerificationCode = async (driverId) => {
  const driver = await exports.getDriverByID(driverId);
  if (driver == -1) {
    return -1;
  }
  const verifCode = generateVerifCode();
  let body = `${verifCode} est votre code de vérification pour GetTaxi`;
  try {
    /* const message = await twilioClient.messages.create({
      body: body,
      messagingServiceSid: "MG14f760a0ef76b408a639e0e83ab0e9f4",
      from: "GetTaxi",
      to: driver.phoneNbr,
    }); */
    if (verificationCodes[driverId]) {
      clearTimeout(verificationCodes[driverId].timer);
    }
    const timer = setTimeout(() => {
      delete verificationCodes[driverId]
    }, process.env.VERIFICATION_CODE_LIFETIME);

    verificationCodes[driverId] = { verifCode, timer };

    console.log(body)
    console.log("Verification code sent to " + driver.phoneNbr);
    return 0;
  } catch (error) {
    return -1;
  }
};

exports.verifySMSCode = async (driverId, verifCode) => {
  if (!verificationCodes[driverId]) {
    return -1;
  }
  if (verifCode != verificationCodes[driverId].verifCode) {
    return -1;
  }
  const driver = await exports.getDriverByID(driverId);
  if (driver == -1) {
    return -1;
  }
  return await exports.updateDriversSpecificProp(driverId, 'verifiedPhoneNbr', { verifiedPhoneNbr: true });
};