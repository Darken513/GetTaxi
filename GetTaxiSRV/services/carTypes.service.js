const { db } = require("../server");
const carTypesRef = db.collection("carTypes");

const cacheService = require("./cache.service");
const cachePath = ["carTypes", "values"];

exports.getAllCarTypes = async () => {
  const cachedResult = cacheService.getArrayOfDefs(cachePath[0])
  if (cachedResult) {
    return cachedResult;
  }
  try {
    const snapshot = await carTypesRef.get();
    const carTypes = snapshot.docs.map((doc) => {
      return { id: doc.id, ...doc.data() };
    });
    cacheService.storeOrUpdateArrayofDefs(cachePath[0], carTypes);
    return carTypes;
  } catch (error) {
    return -1; //error case "-1"
  }
};

exports.getCarByID = async (carTypeId) => {
  const cachedResult = cacheService.getByPath([...cachePath, carTypeId])
  if (cachedResult) {
    return cachedResult;
  }
  try {
    const docRef = carTypesRef.doc(carTypeId);
    const snapshot = await docRef.get();
    if(!snapshot.exists){
      throw Error('CarType with id : ' + carTypeId + ' Doesnt exist')
    }
    return { id: snapshot.id, ...snapshot.data() };
  } catch (error) {
    return -1; //error case "-1"
  }
};

exports.createCarType = async (data) => {
  try {
    const docRef = await carTypesRef.add(data);
    const toret = { id: docRef.id, ...data };
    cacheService.storeOrUpdateDef([...cachePath, docRef.id], toret)
    return toret;
  } catch (error) {
    return -1;
  }
};

exports.deleteCarTypeById = async (carTypeId) => {
  try {
    const docRef = carTypesRef.doc(carTypeId);
    await docRef.delete();
    cacheService.deleteByPath([...cachePath, carTypeId]);
    return 0;
  } catch (error) {
    return -1;
  }
};