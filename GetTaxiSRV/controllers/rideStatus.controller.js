const rideStatusService = require("../services/rideStatus.service")

exports.initRideStatus = async (req, res) => {
  const data = {
    ...req.body,
    created_at: new Date(),
  };
  const result = await rideStatusService.initRideStatus(data);
  switch (result) {
    case 0:
      res.json({ title: "success", body: "Ride status initiated successfully" });
      break;
    case -2:
      res.json({ title: "warning", body: "No drivers available with the selected options." });
      break;
    default:
      res.json({ title: "error", body: "Couldnt initiate Ride status." });
      break;
  }
};

exports.getRideById = async (req, res) => {
  const rideId = req.params.rideId;
  const result = await rideStatusService.getRideById(rideId);
  if (result != -1) {
    res.json(result);
  } else {
    res.json({ title: "error", body: "Ride not available." });
  }
}

exports.changeRideStatus = async (req, res) => {
  const rideId = req.params.rideId;
  const driverId = req.params.driverId;
  const result = await rideStatusService.changeRideStatus(rideId, driverId);
  if (result != -1) {
    res.json(result);
  } else {
    res.json({ title: "error", body: "Ride no longer available.", error: true });
  }
}