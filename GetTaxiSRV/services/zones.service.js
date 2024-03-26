const { db } = require("../server");
const zonesRef = db.collection("zones");

const cacheService = require("./cache.service");
const cachePath = ["zones", "values"];

exports.getAllZones = async () => {
  const cachedResult = cacheService.getArrayOfDefs(cachePath[0])
  if (cachedResult) {
    return cachedResult;
  }
  try {
    const snapshot = await zonesRef.get();
    const zones = snapshot.docs.map((doc) => {
      return { id: doc.id, ...doc.data() };
    });
    cacheService.storeOrUpdateArrayofDefs(cachePath[0], zones);
    return zones;
  } catch (error) {
    console.error("Error getting zones:", error);
    return -1; //error case "-1"
  }
};

exports.getZoneById = async (zoneId) => {
  const cachedResult = cacheService.getByPath([...cachePath, zoneId])
  if (cachedResult) {
    return cachedResult;
  }
  try {
    const docRef = zonesRef.doc(zoneId);
    const snapshot = await docRef.get();
    if(!snapshot.exists){
      throw Error('Zone with id : ' + zoneId + ' Doesnt exist')
    }
    return { id: snapshot.id, ...snapshot.data() };
  } catch (error) {
    console.error("Error getting zone :", error);
    return -1; //error case "-1"
  }
};

exports.createZone = async (data) => {
  try {
    const docRef = await zonesRef.add(data);
    console.log("Zone added with ID:", docRef.id);
    const toret = { id: docRef.id, ...data };
    cacheService.storeOrUpdateDef([...cachePath, docRef.id], toret)
    return toret;
  } catch (error) {
    console.error("Error adding Zone:", error);
    return -1;
  }
};

exports.deleteZoneById = async (zoneId) => {
  try {
    const docRef = zonesRef.doc(zoneId);
    await docRef.delete();
    cacheService.deleteByPath([...cachePath, zoneId])
    console.log(
      "Zone with ID:",
      zoneId,
      "deleted successfully."
    );
    return 0;
  } catch (error) {
    console.error("Error deleting carType:", error);
    return -1;
  }
};