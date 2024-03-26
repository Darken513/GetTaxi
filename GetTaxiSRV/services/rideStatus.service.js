const { db, twilioClient } = require("../server");
const zonesRef = db.collection("zones");
const carTypesRef = db.collection("carTypes");
const driversRef = db.collection("Drivers");
const rideStatusRef = db.collection("RideStatus");
const { DriverURL } = require("../models/DriverURL");

const cacheService = require("./cache.service");
const cachePath = ["rideStatus", "values"];

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
    const docRef = await rideStatusRef.add(data);
    const rideStatus = { id: docRef.id, ...data };
    cacheService.storeOrUpdateDef([...cachePath, docRef.id], rideStatus);
    console.log("Ride status initiated with ID:", docRef.id);

    const driverUrls = drivers.map((driver) => {
      return new DriverURL(driver, rideStatus);
    });
    // send sms to all drivers
    // to-do : create a client side project for drivers
    // it should ask the driver if he is sure he wants to take the ride
    // it should also connect to backend via web socket, to verify if the ride is not yet taken
    // once the driver accepts, a second check should be done, if taken display error
    // else affect the ride to that driver, and disable all other links
    for (let i = 0; i < driverUrls.length; i++) {
      const driverUrl = driverUrls[i];
      let body = `Proposal: ${driverUrl.rideStatusObj.id}
Date/heure: 
${
  driverUrl.rideStatusObj.isDeferred
    ? "Différée, " + formatDate(driverUrl.rideStatusObj.deferredDateTime)
    : "Immédiatement"
}

Adresse de prise en charge: 
${
  driverUrl.rideStatusObj.current_roadName +
  driverUrl.rideStatusObj.current_postalCode +
  driverUrl.rideStatusObj.current_city
}

Cliquez ici pour accepter la course: 
${driverUrl.rideStatusURL}
      `;
      console.log(body);
      return;
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
      //console.log(body);
    }
    return 0;
  } catch (error) {
    console.error("Error initiating Ride status:", error);
    return -1;
  }
};

exports.getRideById = async (rideId) => {
  const cachedResult = cacheService.getByPath([...cachePath, rideId]);
  if (cachedResult) {
    return cachedResult;
  }
  try {
    const docRef = rideStatusRef.doc(rideId);
    const snapshot = await docRef.get();
    if(!snapshot.exists){
      throw Error('Ride status with id : ' + rideId + ' Doesnt exist')
    }
    //todo : should store def in cache
    return { id: snapshot.id, ...snapshot.data() };
  } catch (error) {
    console.error("Error getting Ride:", error);
    return -1; //error case "-1"
  }
};

exports.changeRideStatus = async (rideId, driverId) => {
  try {
    const docRef = rideStatusRef.doc(rideId);
    const snapshot = await docRef.get();
    if(!snapshot.exists){
      throw Error('Ride status with id : ' + rideId + ' Doesnt exist')
    }
    const isOwner = snapshot.data().takenByDriver == driverId;
    if (!isOwner && snapshot.data().takenByDriver) {
      return -1;
    }
    await docRef.update({
      takenByDriver: !isOwner ? driverId : "",
    });
    const toSaveCache = {
      id: docRef.id,
      ...snapshot.data(),
      takenByDriver: !isOwner ? driverId : "",
    };
    cacheService.storeOrUpdateDef([...cachePath, docRef.id], toSaveCache);
    console.log(
      "Ride ",
      rideId,
      isOwner ? "canceled by driver" : " taken by driver",
      driverId
    );
    return toSaveCache;
  } catch (error) {
    console.error("Error initiating Ride status:", error);
    return -1;
  }
};

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
