const rideStatusService = require("../services/rideStatus.service")

exports.initRideStatus = async (req, res) => {
  const data = {
    ...req.body,
    created_at: new Date(),
  };
  const result = await rideStatusService.initRideStatus(data);
  switch (result) {
    case 0:
      res.json({ isNotification: true, type: 'success', title: "succès", body: "le suivi de la course a été initié avec succès." });
      break;
    case -2:
      res.json({ isNotification: true, type: 'warning', title: "alerte", body: "Aucun conducteur n'est disponible avec les options sélectionnées." });
      break;
    default:
      res.json({ isNotification: true, type: 'error', title: "erreur", body: "Impossible d'initier le suivi de la course." });
      break;
  }
};

exports.getRideById = async (req, res) => {
  const rideId = req.params.rideId;
  const result = await rideStatusService.getRideById(rideId);
  if (result != -1) {
    res.json(result);
  } else {
    //todo-P3 : log the errors
    res.json({ isNotification: true, type: 'error', title: "erreur", body: "La course n'est pas disponible." });
  }
}

exports.acceptRide = async (req, res) => {
  const rideId = req.params.rideId;
  const driverId = req.params.driverId;
  const result = await rideStatusService.acceptRide(rideId, driverId);
  if (result == -1) {
    res.json({ isNotification: true, type: 'error', title: "erreur", body: "La course n'est plus disponible.", error: true });
  } else if (result == -2) {
    res.json({ isNotification: true, type: 'error', title: "erreur", body: "Vous n'avez pas assez de crédits,\nVeillez à recharger vos crédits", error: true });
  } else {
    //todo-P3 : log the errors
    res.json(result);
  }
}

exports.cancelRide = async (req, res) => {
  const rideId = req.params.rideId;
  const reasonObj = req.body;
  const result = await rideStatusService.cancelRide(rideId, reasonObj);
  res.json(result);
}