const { db, twilioClient } = require("../server");
const zonesRef = db.collection("zones");
const carTypesRef = db.collection("carTypes");
const driversRef = db.collection("Drivers");
const rideStatusRef = db.collection("RideStatus");
const driverBehaviorRef = db.collection("DriverBehavior");
const { DriverURL } = require("../models/DriverURL");

const cacheService = require("./cache.service");
const RS_cachepath = ["rideStatus", "values"];
const DBH_cachepath = ["driverBehavior", "values"];

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
    cacheService.storeOrUpdateDef([...RS_cachepath, docRef.id], rideStatus);
    console.log("Ride status initiated with ID:", docRef.id);

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
${driverUrl.rideStatusObj.current_roadName +
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
    console.error("Error getting Ride:", error);
    return -1; //error case "-1"
  }
};

exports.acceptRide = async (rideId, driverId) => {
  try {
    const docRef = rideStatusRef.doc(rideId);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
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
    cacheService.storeOrUpdateDef([...RS_cachepath, docRef.id], toSaveCache);
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

exports.cancelRide = async (rideId, reasonObj) => {
  try {
    const rideS_docRef = rideStatusRef.doc(rideId);
    const rideS_snapshot = await rideS_docRef.get();
    if (!rideS_snapshot.exists) {
      throw Error('Ride status with id : ' + rideId + ' Doesnt exist');
    }
    if (rideS_snapshot.data().canceled) {
      throw Error('Ride status with id : ' + rideId + ' Already canceled');
    }
    if (reasonObj && reasonObj.driverId) {
      const isOwner = (rideS_snapshot.data().takenByDriver && rideS_snapshot.data().takenByDriver == driverId);
      if (!isOwner) {
        return -1;
      } else {
        //toDo-P1 : should cancel ride and save a log to track it + reason
        await rideS_docRef.update({
          takenByDriver: "",
        });
        const toSaveCache = {
          id: rideS_docRef.id,
          ...rideS_snapshot.data(),
          takenByDriver: "",
        };
        cacheService.storeOrUpdateDef([...RS_cachepath, rideS_docRef.id], toSaveCache);
        let driverBH = {
          behaviorType: "rideCanceled",
          created_at: new Date(),
          creditsAffected: rideS_snapshot.data().creditsCost,
          driverId: reasonObj.driverId,
          rideId: rideId,
          reason: reasonObj.reason
        }
        //todo-P1: should reduce driver credits
        //should get current credits first ...
        // import the driverService to avoid retyping code

        /* const updatedData = {
          credits: 0
        };
        const result = await driversService.updateDriver(driverId, updatedData)
        if (result != -1) {
          res.status(201).json({ title: "success", body: "Driver updated successfully." });
        } else {
          res.status(201).json({ title: "error", body: "Driver update failed." });
        } */
        const driverBH_docRef = await driverBehaviorRef.add(driverBH);
        driverBH = { id: driverBH_docRef.id, ...driverBH };
        cacheService.storeOrUpdateDef([...DBH_cachepath, driverBH_docRef.id], driverBH);
        console.log(
          "Ride ",
          rideId,
          "canceled by driver",
          driverId
        );
        return {
          status: 0,
          body: toSaveCache
        };
      }
    } else {
      //todo-P1: case user ( not driver, make the ridestatus state canceled )
    }
  } catch (error) {
    console.error("Error initiating Ride status:", error);
    return { status: -1 };
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
