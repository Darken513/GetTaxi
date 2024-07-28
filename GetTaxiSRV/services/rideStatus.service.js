const { db, twilioClient } = require("../server");
const { DriverURL } = require("../models/DriverURL");

const driversRef = db.collection("Drivers");
const rideStatusRef = db.collection("RideStatus");
const driverBehaviorRef = db.collection("DriverBehavior");

const cacheService = require("./cache.service");
const driverService = require("./drivers.service");

const RS_cachepath = ["rideStatus", "values"];
const DBH_cachepath = ["driverBehavior", "values"];

const { Client } = require('@googlemaps/google-maps-services-js');
const client = new Client({});

/**
 * Initializes the status of a new ride. (saves information to cache)
 * @param {Object} data - The data object containing ride information.
 * @param {string} data.carType - The type of car for the ride.
 * @param {string} data.zone - The zone for the ride.
 * @param {boolean} data.isDeferred - Indicates if the ride is deferred.
 * @param {string} data.deferredDateTime - The deferred date and time for the ride (if applicable).
 * @param {string} data.current_roadNbr
 * @param {string} data.current_Addressformatted
 * @param {string} data.destination_roadNbr
 * @param {string} data.destination_Addressformatted
 * @returns {Promise<number>} 0 if successful, -1 if there was an error initiating the ride status, -2 if no drivers were found.
 */
exports.initRideStatus = async (data) => {
  try {
    const distDura = await calculateDistanceBetweenAdrs(data.current_Addressformatted, data.destination_Addressformatted);
    if (!distDura) {
      return -1;
    }
    data.estimatedDistance = distDura.distance.text;
    data.estimatedDuration = distDura.duration.text;
    data.estimatedPrice = CustomToFixed2(Math.round(distDura.distance.value * process.env.PRICE_PER_METER * 100) / 100);

    creditsCost = calculateCreditsCost(data.estimatedPrice);

    const snapshot = await driversRef
      .where("carType", "==", data.carType)
      .where("zone", "==", data.zone)
      .where("isActive", "==", true)
      .where("credits", ">=", creditsCost)
      .get();

    const drivers = snapshot.docs.map((doc) => {
      return { id: doc.id, ...doc.data() };
    });
    if (!drivers.length) {
      return -2; //no drivers found
    }

    const docRef = await rideStatusRef.add({ ...data, currentState: 0 });
    const rideStatus = { id: docRef.id, ...data, currentState: 0 };
    cacheService.storeOrUpdateDef([...RS_cachepath, docRef.id], rideStatus);

    const driverUrls = drivers.map((driver) => {
      return new DriverURL(driver, rideStatus);
    });
    // send sms to all drivers
    for (let i = 0; i < driverUrls.length; i++) {
      const driverUrl = driverUrls[i];
      let body = `Proposal: ${driverUrl.rideStatusObj.id}
Date/heure: 
${driverUrl.rideStatusObj.isDeferred
          ? "Différée, " + formatDate(driverUrl.rideStatusObj.deferredDateTime)
          : "Immédiatement"
        }

Adresse de prise en charge: 
${deleteFirstOccurrence(driverUrl.rideStatusObj.current_Addressformatted, driverUrl.rideStatusObj.current_roadNbr)}

Cliquez ici pour accepter la course: 
${driverUrl.rideStatusURL}
      `;
      console.log(body);
      continue;
      twilioClient.messages
        .create({
          body: body,
          messagingServiceSid: "MG14f760a0ef76b408a639e0e83ab0e9f4",
          from: "GetTaxi",
          to: driverUrl.driver.phoneNbr,
        })
        .then((message) => {
          console.info("Sent sms to driver " + driverUrl.driver.phoneNbr);
        })
        .catch((error) => console.error(error));
    }
    return 0;
  } catch (error) {
    console.error(error);
    return -1;
  }
};

/**
 * Retrieves ride information by its ID. (tries to fetch information from cache)
 * @param {string} rideId - The ID of the ride to retrieve.
 * @returns {Promise<Object|number>} The ride information object if found, otherwise -1.
 */
exports.getRideById = async (rideId) => {
  const cachedResult = cacheService.getByPath([...RS_cachepath, rideId]);
  if (cachedResult) {
    return cachedResult;
  }
  try {
    const docRef = rideStatusRef.doc(rideId);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      throw Error('Ride status with id : ' + rideId + ' Doesnt exist')
    }
    const toSaveCache = { id: snapshot.id, ...snapshot.data() };
    Object.keys(toSaveCache).forEach((key) => {
      cacheService.updateDefSpecificProp(
        [...RS_cachepath, rideId, "value", key],
        toSaveCache[key]
      );
    });
    return { id: snapshot.id, ...snapshot.data() };
  } catch (error) {
    console.error(error);
    return -1; //error case "-1"
  }
};

/**
 * Accepts a ride by assigning it to a driver. (saves information to cache)
 * @param {string} rideId - The ID of the ride to accept.
 * @param {string} driverId - The ID of the driver accepting the ride.
 * @returns {Promise<Object|number>} The updated ride information object if successful, otherwise -1.
 */
exports.acceptRide = async (rideId, driverId, coords) => {
  try {
    const rideS_docRef = rideStatusRef.doc(rideId);
    const rideS_snapshot = await rideS_docRef.get();
    if (!rideS_snapshot.exists) {
      throw Error('Ride status with id : ' + rideId + ' Doesnt exist')
    }
    const isOwner = rideS_snapshot.data().takenByDriver == driverId;
    if (!isOwner && rideS_snapshot.data().takenByDriver) {
      return -1;
    }
    //check credits first, should have enough credits to accept
    let driverBH = prepareDriverBehavior(rideS_snapshot, undefined, driverId, rideId);
    let driverData = await driverService.getDriverByID(driverId);
    if (driverBH.creditsChange < 0) {
      if (driverData.credits + driverBH.creditsChange < 0) {
        return -2
      }
    }
    await rideS_docRef.update({
      takenByDriver: !isOwner ? driverId : "",
    });
    const toSaveCache = {
      id: rideS_docRef.id,
      ...rideS_snapshot.data(),
      takenByDriver: !isOwner ? driverId : "",
    };
    cacheService.storeOrUpdateDef([...RS_cachepath, rideS_docRef.id], toSaveCache);
    const credsUpdateState = updateDriverCredits(driverBH, driverId);
    const driverUrl = new DriverURL({ id: driverId, ...driverData }, { id: rideId, ...rideS_snapshot.data() });
    if (driverUrl.rideStatusObj.isDeferred) {
      await sendSMStoClientCaseDiferred(driverUrl, coords)
    } else {
      await sendSMStoClientCaseImidiateRide(driverUrl, coords)
    }
    return toSaveCache;
  } catch (error) {
    console.error(error);
    return -1;
  }
};

async function sendSMStoClientCaseImidiateRide(driverUrl, coords) {
  const currentDriverPosition = `${coords[0]},${coords[1]}`;
  const distDura = await calculateDistanceBetweenAdrs(currentDriverPosition, driverUrl.rideStatusObj.current_Addressformatted);
  //todo-P1 : driverUrl.driver.carBrand should return the string not the id
  let body = `Merci pour votre commande.
Le véhicule: ${driverUrl.driver.carBrand + ', ' + driverUrl.driver.carColor}
Numéro de plaques ${driverUrl.driver.carPlateNbr} arrive avant ${distDura.duration.text} à ${driverUrl.rideStatusObj.current_Addressformatted}

Suivez votre taxi ici -> ${driverUrl.clientURL}`;
  console.log(body);
  return;
  twilioClient.messages
    .create({
      body: body,
      messagingServiceSid: "MG14f760a0ef76b408a639e0e83ab0e9f4",
      from: "GetTaxi",
      to: driverUrl.rideStatusObj.phoneNumber,
    })
    .then((message) => {
      console.info("Sent sms to client " + driverUrl.rideStatusObj.phoneNumber);
    })
    .catch((error) => console.error(error));
}

async function sendSMStoClientCaseDiferred(driverUrl) {
  //todo-P1 : driverUrl.driver.carBrand should return the string not the id
  let body = `Merci pour votre commande.
Le véhicule: ${driverUrl.driver.carBrand + ', ' + driverUrl.driver.carColor}
Numéro de plaques ${driverUrl.driver.carPlateNbr} à la date et à l'heure indiquées ${driverUrl.rideStatusObj.deferredDateTime} à ${driverUrl.rideStatusObj.current_Addressformatted}

Suivez votre taxi ici -> ${driverUrl.clientURL}`;
  console.log(body);
  return;
  twilioClient.messages
    .create({
      body: body,
      messagingServiceSid: "MG14f760a0ef76b408a639e0e83ab0e9f4",
      from: "GetTaxi",
      to: driverUrl.rideStatusObj.phoneNumber,
    })
    .then((message) => {
      console.info("Sent sms to client " + driverUrl.rideStatusObj.phoneNumber);
    })
    .catch((error) => console.error(error));
}

/**
 * Cancels a ride and returns an object containing error status and body.
 * @param {string} rideId - The ID of the ride to cancel.
 * @param {Object} reasonObj - The object containing the reason for cancellation (optional).
 * @param {string} reasonObj.driverId - The ID of the driver requesting the cancellation (if applicable).
 * @param {Object} reasonObj.reason - The Object that describes the reason behind cancelling the ride.
 * @param {number} reasonObj.reason.id
 * @param {string} reasonObj.reason.name
 * @returns {Promise<{error: boolean, body: string|Object}>} An object with error status and body.
 */
exports.cancelRide = async (rideId, reasonObj) => {
  try {
    const rideS_docRef = rideStatusRef.doc(rideId);
    const rideS_snapshot = await rideS_docRef.get();
    if (!rideS_snapshot.exists) {
      return { error: true, body: 'Ride status with id : ' + rideId + ' Doesnt exist' };
    }
    if (rideS_snapshot.data().canceled) {
      return { error: true, body: 'Ride status with id : ' + rideId + ' Already canceled' };
    }
    if (reasonObj && reasonObj.driverId) {
      return await cancelRideCaseDriver(rideS_snapshot, rideS_docRef, rideId, reasonObj)
    } else {
      return await cancelRideCaseClient(rideS_snapshot, rideS_docRef, rideId, reasonObj)
    }
  } catch (error) {
    console.error(error);
    return { error: true, body: "Error initiating Ride status" };
  }
};

exports.changeRideStatus = async (rideId, currentState) => {
  try {
    const rideS_docRef = rideStatusRef.doc(rideId);
    const toUpdate = {
      currentState: currentState,
    }
    if (currentState == 3) {
      toUpdate['rideEndedAt'] = new Date();
    }
    await rideS_docRef.update(toUpdate);
    const rideS_snapshot = await rideS_docRef.get();
    const toSaveCache = {
      id: rideS_docRef.id,
      ...rideS_snapshot.data(),
      currentState: currentState
    };
    if (currentState == 3) {
      toSaveCache['rideEndedAt'] = toUpdate['rideEndedAt'];
      let driverBH = {
        behaviorType: process.env.RIDE_ENDED,
        created_at: toSaveCache['rideEndedAt'],
        estimatedGain: rideS_snapshot.data().estimatedPrice,
        driverId: rideS_snapshot.data().takenByDriver,
        rideId: rideId,
      }
      //saving driverBehavior record & saving changes to cache
      const driverBH_docRef = await driverBehaviorRef.add(driverBH);
      driverBH = { id: driverBH_docRef.id, ...driverBH };
      cacheService.storeOrUpdateDef([...DBH_cachepath, driverBH_docRef.id], driverBH);

      let driverData = await driverService.getDriverByID(driverBH.driverId);
      const absChange = Math.abs(rideS_snapshot.data().estimatedPrice);

      driverData.totalIncome += absChange;
      driverService.updateDriversSpecificProp(driverBH.driverId, 'totalIncome', { totalIncome: CustomToFixed2(driverData.totalIncome) });
    }
    cacheService.storeOrUpdateDef([...RS_cachepath, rideS_docRef.id], toSaveCache);
    return { error: false, body: "successfully changed ride status" };
  } catch (error) {
    console.error(error, true);
    return { error: true, body: "Error updating Ride status" };
  }
};

async function cancelRideCaseClient(rideS_snapshot, rideS_docRef, rideId, reasonObj) {
  try {
    await rideS_docRef.update({
      isCanceled: true,
      currentState: 0,
      cancelReason: reasonObj.reason
    });
    const toSaveCache = {
      id: rideS_docRef.id,
      ...rideS_snapshot.data(),
      isCanceled: true,
      cancelReason: reasonObj.reason
    };
    reasonObj = { byClient: true, ...reasonObj }
    cacheService.storeOrUpdateDef([...RS_cachepath, rideS_docRef.id], toSaveCache);
    if (rideS_snapshot.data().takenByDriver) {
      let driverBH = prepareDriverBehavior(rideS_snapshot, reasonObj, rideS_snapshot.data().takenByDriver, rideId);
      const credsUpdateState = updateDriverCredits(driverBH, rideS_snapshot.data().takenByDriver);
    }
    return { error: false, body: "successfully cancelled ride" };
  } catch (error) {
    console.error(error);
    return { error: true, body: "Error initiating Ride status" };
  }
}

async function cancelRideCaseDriver(rideS_snapshot, rideS_docRef, rideId, reasonObj) {
  const isOwner = (rideS_snapshot.data().takenByDriver && rideS_snapshot.data().takenByDriver == reasonObj.driverId);
  if (!isOwner) {
    return { error: true, body: 'Ride status with id : ' + rideId + ' not owned' };
  } else {
    //letting go the ridestatus and updating it in cache
    await rideS_docRef.update({
      takenByDriver: "",
      currentState: 0
    });
    const toSaveCache = {
      id: rideS_docRef.id,
      ...rideS_snapshot.data(),
      takenByDriver: "",
    };
    cacheService.storeOrUpdateDef([...RS_cachepath, rideS_docRef.id], toSaveCache);
    //preparing driverBehavior record
    //on cancel refund 90% of the commission.
    let driverBH = prepareDriverBehavior(rideS_snapshot, reasonObj, reasonObj.driverId, rideId);
    const credsUpdateState = updateDriverCredits(driverBH, reasonObj.driverId);
    return { error: false, body: 'successfully cancelled ride' };
  }
}

function calculateCreditsCost(estimatedPrice) {
  return CustomToFixed2(Math.round(estimatedPrice * process.env.COMMISION_ON_RIDE_PERCENTAGE * 100) / 100)
}

function prepareDriverBehavior(rideS_snapshot, reasonObj, driverId, rideId) {
  const canceledByDriver = reasonObj && !reasonObj.byClient;
  const canceledByClient = reasonObj && reasonObj.byClient;
  const behaviorType = canceledByClient ?
    process.env.RIDE_CANCELED_CLIENT : canceledByDriver ?
      process.env.RIDE_CANCELED_DRIVER :
      process.env.RIDE_ACCEPTED

  const creditsCost = calculateCreditsCost(rideS_snapshot.data().estimatedPrice);
  const creditsChange = creditsCost * (canceledByClient ? 1 : canceledByDriver ? process.env.REFUND_ON_CANCEL_PERCENTAGE : -1)
  return {
    behaviorType: behaviorType,
    created_at: new Date(),
    creditsChange: creditsChange,
    driverId: driverId,
    rideId: rideId,
    reason: reasonObj ? reasonObj.reason : {}
  }
}

function checkRideIsCanceled(driverBH) {
  return (
    driverBH == process.env.RIDE_CANCELED_CLIENT ||
    driverBH == process.env.RIDE_CANCELED_DRIVER
  );
}

async function updateDriverCredits(driverBH, driverId) {
  //update driver (refund some credits) & saving changes to cache
  let driverData = await driverService.getDriverByID(driverId);
  //todo-P3: avoid NaN cases !
  driverData.credits += driverBH.creditsChange;
  const absChange = Math.abs(driverBH.creditsChange)
  if (driverBH.creditsChange > 0) {
    if (checkRideIsCanceled(driverBH)) {
      driverData.totalSpent -= absChange;
      driverService.updateDriversSpecificProp(driverId, 'totalSpent', { totalSpent: CustomToFixed2(driverData.totalSpent) });
    }
  } else {
    driverData.totalSpent += absChange;
    driverService.updateDriversSpecificProp(driverId, 'totalSpent', { totalSpent: CustomToFixed2(driverData.totalSpent) });
  }
  driverService.updateDriversSpecificProp(driverId, 'credits', { credits: CustomToFixed2(driverData.credits) });

  //saving driverBehavior record & saving changes to cache
  const driverBH_docRef = await driverBehaviorRef.add(driverBH);
  driverBH = { id: driverBH_docRef.id, ...driverBH };
  cacheService.storeOrUpdateDef([...DBH_cachepath, driverBH_docRef.id], driverBH);
}

async function calculateDistanceBetweenAdrs(origin, destination) {
  try {
    const response = await client.directions({
      params: {
        origin: origin,
        destination: destination,
        key: 'AIzaSyAsh5nn3ADF9DpWipZ3_TuMpZ9m0fjsBr8',
        mode: 'driving',
        language: 'fr',
      },
    });
    const route = response.data.routes[0];
    const distance = route.legs[0].distance;
    const duration = route.legs[0].duration;
    return { distance, duration };
  } catch (err) {
    console.error('Error: ', err);
  }
}

function formatDate(inputDate) {
  // Parse the input date string
  const date = new Date(inputDate);

  // Extract date components
  const day = date.getDate();
  const month = date.getMonth() + 1; // Months are zero-indexed
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Add leading zeros if necessary
  const formattedDay = day < 10 ? "0" + day : day;
  const formattedMonth = month < 10 ? "0" + month : month;

  // Construct the formatted date string
  const formattedDate = `${formattedDay}.${formattedMonth}.${year}, ${hours}:${minutes}`;

  return formattedDate;
}

function deleteFirstOccurrence(mainString, subString) {
  if (!subString)
    return mainString.trim();
  if (!mainString)
    return '';
  const index = mainString.indexOf(subString);
  if (index === -1)
    return mainString.trim();
  return (mainString.slice(0, index) + mainString.slice(index + subString.length)).trim();
}

function CustomToFixed2(val) {
  return parseFloat(val.toFixed(2));
}