const { db, twilioClient } = require("../server");
const { DriverURL } = require("../models/DriverURL");

const driversRef = db.collection("Drivers");
const rideStatusRef = db.collection("RideStatus");
const driverBehaviorRef = db.collection("DriverBehavior");

const cacheService = require("./cache.service");
const driverService = require("./drivers.service");
const socketService = require("./socket.service");

const RS_cachepath = ["rideStatus", "values"];
const DBH_cachepath = ["driverBehavior", "values"];

const REFUND_ON_CANCEL_PERCENTAGE = 0.9;
const PRICE_PER_METER = 0.01;
const COMMISION_ON_RIDE_PERCENTAGE = 0.05;

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
    const snapshot = await driversRef
      .where("carType", "==", data.carType)
      .where("zone", "==", data.zone)
      .where("isActive", "==", true)
      .get();
    const drivers = snapshot.docs.map((doc) => {
      return { id: doc.id, ...doc.data() };
    });
    if (!drivers.length) {
      return -2; //no drivers found
    }
    const distDura = await calculateDistanceBetweenAdrs(data.current_Addressformatted, data.destination_Addressformatted);
    if (!distDura) {
      return -1;
    }
    data.estimatedDistance = distDura.distance.text;
    data.estimatedDuration = distDura.duration.text;
    data.estimatedPrice = (Math.round(distDura.distance.value * PRICE_PER_METER * 100) / 100).toFixed(2);

    const docRef = await rideStatusRef.add(data);
    const rideStatus = { id: docRef.id, ...data };
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
          console.log("Sent sms to " + driverUrl.driver.phoneNbr);
        })
        .catch((error) => console.error(error));
    }
    return 0;
  } catch (error) {
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
    //todo-P2 : should store def in cache
    return { id: snapshot.id, ...snapshot.data() };
  } catch (error) {
    return -1; //error case "-1"
  }
};

/**
 * Accepts a ride by assigning it to a driver. (saves information to cache)
 * @param {string} rideId - The ID of the ride to accept.
 * @param {string} driverId - The ID of the driver accepting the ride.
 * @returns {Promise<Object|number>} The updated ride information object if successful, otherwise -1.
 */
exports.acceptRide = async (rideId, driverId) => {
  try {
    //todo-P1: check credits first, should have enough credits to accept
    const rideS_docRef = rideStatusRef.doc(rideId);
    const rideS_snapshot = await rideS_docRef.get();
    if (!rideS_snapshot.exists) {
      throw Error('Ride status with id : ' + rideId + ' Doesnt exist')
    }
    const isOwner = rideS_snapshot.data().takenByDriver == driverId;
    if (!isOwner && rideS_snapshot.data().takenByDriver) {
      return -1;
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
    const credsUpdateState = updateDriverCredits(rideS_snapshot, rideId, driverId);
    //todo-P1 : should send sms to client
    return toSaveCache;
  } catch (error) {
    return -1;
  }
};

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
    return { error: true, body: "Error initiating Ride status" };
  }
};

async function cancelRideCaseClient(rideS_snapshot, rideS_docRef, rideId, reasonObj) {
  try {
    await rideS_docRef.update({
      isCanceled: true,
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
      const credsUpdateState = updateDriverCredits(rideS_snapshot, rideId, rideS_snapshot.data().takenByDriver, reasonObj);
    }
    return { error: false, body: "successfully cancelled ride" };
  } catch (error) {
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
    });
    const toSaveCache = {
      id: rideS_docRef.id,
      ...rideS_snapshot.data(),
      takenByDriver: "",
    };
    cacheService.storeOrUpdateDef([...RS_cachepath, rideS_docRef.id], toSaveCache);
    //preparing driverBehavior record
    //on cancel refund 90% of the commission.
    const credsUpdateState = updateDriverCredits(rideS_snapshot, rideId, reasonObj.driverId, reasonObj);
    return { error: false, body: 'successfully cancelled ride' };
  }
}

async function updateDriverCredits(rideS_snapshot, rideId, driverId, reasonObj) {
  const canceledByDriver = reasonObj && !reasonObj.byClient;
  const canceledByClient = reasonObj && reasonObj.byClient;
  const behaviorType = canceledByClient ? 'RideCanceled_Client' : canceledByDriver ? 'RideCanceled_Driver' : 'rideAccepted'
  const creditsCost = (Math.round(rideS_snapshot.data().estimatedPrice * COMMISION_ON_RIDE_PERCENTAGE * 100) / 100).toFixed(2);
  const creditsChange = creditsCost * (canceledByClient ? 1 : canceledByDriver ? REFUND_ON_CANCEL_PERCENTAGE : -1)
  let driverBH = {
    behaviorType: behaviorType,
    created_at: new Date(),
    creditsChange: creditsChange,
    driverId: driverId,
    rideId: rideId,
    reason: reasonObj ? reasonObj.reason : {}
  }
  //update driver (refund some credits) & saving changes to cache
  let driverData = await driverService.getDriverByID(driverId);
  //todo-P3: avoid NaN cases !
  driverData.credits += driverBH.creditsChange;
  driverService.updateDriversCredit(driverId, { credits: driverData.credits });
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
      },
    });
    const route = response.data.routes[0];
    const distance = route.legs[0].distance;
    const duration = route.legs[0].duration;
    return { distance, duration };
  } catch (err) {
    console.error('Error:', err.response.data.error_message);
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
