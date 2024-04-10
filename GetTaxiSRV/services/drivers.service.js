const { db, storage } = require("../server");
const driversRef = db.collection("Drivers");

const cacheService = require("./cache.service");
const cachePath = ["drivers", "values"];

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
    console.error("Error getting drivers:", error);
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
    if(!snapshot.exists){
      throw Error('Driver with id : ' + driverId + ' Doesnt exist')
    }
    //todo-P2 : should store def in cache
    return { id: snapshot.id, ...snapshot.data() };
  } catch (error) {
    console.error("Error getting driver:", error);
    return -1; //error case "-1"
  }
};

exports.createDriver = async (data) => {
  try {
    const docRef = await driversRef.add(data);
    console.log("Driver added with ID:", docRef.id);
    const toret = { id: docRef.id, ...data };
    cacheService.storeOrUpdateDef([...cachePath, docRef.id], toret)
    return toret;
  } catch (error) {
    console.error("Error adding Driver:", error);
    return -1;
  }
};

exports.updateDriver = async (driverId, updatedData) => {
  try {
    const docRef = driversRef.doc(driverId);
    await docRef.update(updatedData);
    const toSaveCache = { id: driverId, ...updatedData }
    cacheService.storeOrUpdateDef([...cachePath, driverId], toSaveCache);
    console.log("Driver with ID:", driverId, "updated successfully.");
    return 0;
  } catch (error) {
    console.error("Error updating Driver:", error);
    return -1;
  }
};
exports.updateDriversCredit = async (driverId, updatedData) => {
  try {
    const docRef = driversRef.doc(driverId);
    await docRef.update(updatedData);
    cacheService.updateDefSpecificProp([...cachePath, driverId, 'value', updatedData], updatedData.credits);
    console.log("Driver with ID:", driverId, "updated successfully.");
    return 0;
  } catch (error) {
    console.error("Error updating Driver:", error);
    return -1;
  }
};

exports.changeDriverStatus = async (driverId, updatedData, res) => {
  try {
    const docRef = driversRef.doc(driverId);
    await docRef.update(updatedData);
    cacheService.updateDefSpecificProp([...cachePath, driverId, 'value', 'isActive'], updatedData.isActive);
    console.log("Driver with ID:", driverId, "updated successfully.");
    return 0;
  } catch (error) {
    console.error("Error updating Driver:", error);
    return -1;
  }
};

exports.deleteDriverById = async (driverId) => {
  try {
    const docRef = driversRef.doc(driverId);
    await docRef.delete();
    cacheService.deleteByPath([...cachePath, driverId])
    console.log(
      "Driver with ID:",
      driverId,
      "deleted successfully."
    );
    return 0;
  } catch (error) {
    console.error("Error deleting carType:", error);
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
    console.log(`File ${file.originalname} uploaded to Firebase Storage.`);
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