const { db } = require("../server");
const carBrandsRef = db.collection("carBrands");

const cacheService = require("./cache.service");
const cachePath = ["carBrands", "values"];

exports.getAllCarBrands = async () => {
  const cachedResult = cacheService.getArrayOfDefs(cachePath[0])
  if (cachedResult) {
    return cachedResult;
  }
  try {
    const snapshot = await carBrandsRef.get();
    const carBrands = snapshot.docs.map((doc) => {
      return { id: doc.id, ...doc.data() };
    });
    cacheService.storeOrUpdateArrayofDefs(cachePath[0], carBrands);
    return carBrands;
  } catch (error) {
    console.error(error);
    return -1; //error case "-1"
  }
};

exports.getCarBrandByID = async (carBrandId) => {
  const cachedResult = cacheService.getByPath([...cachePath, carBrandId])
  if (cachedResult) {
    return cachedResult;
  }
  try {
    const docRef = carBrandsRef.doc(carBrandId);
    const snapshot = await docRef.get();
    if(!snapshot.exists){
      throw Error('CarBrand with id : ' + carBrandId + ' Doesnt exist')
    }
    return { id: snapshot.id, ...snapshot.data() };
  } catch (error) {
    console.error(error);
    return -1; //error case "-1"
  }
};

exports.createCarBrand = async (data) => {
  try {
    const docRef = await carBrandsRef.add(data);
    const toret = { id: docRef.id, ...data };
    cacheService.storeOrUpdateDef([...cachePath, docRef.id], toret)
    return toret;
  } catch (error) {
    console.error(error);
    return -1;
  }
};

exports.deleteCarBrandById = async (carBrandId) => {
  try {
    const docRef = carBrandsRef.doc(carBrandId);
    await docRef.delete();
    cacheService.deleteByPath([...cachePath, carBrandId]);
    return 0;
  } catch (error) {
    console.error(error);
    return -1;
  }
};