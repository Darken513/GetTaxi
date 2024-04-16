const carTypesService = require("../services/carTypes.service");

exports.getAllCarTypes = async (req, res) => {
  const result = await carTypesService.getAllCarTypes();
  if (result != -1) {
    res.json({ carTypes: result });
  } else {
    res.json({ isNotification: true, type: 'error', title: "erreur", body: "Pas de données disponibles (pour les types de voitures)." });
  }
};

exports.getCarByID = async (req, res) => {
  const carId = req.params.carId;
  const result = await carTypesService.getCarByID(carId);
  if (result != -1) {
    res.json(result);
  } else {
    res.json({ isNotification: true, type: 'error', title: "erreur", body: "Le type de voiture n'est pas disponible." });
  }
}

exports.createCarType = async (req, res) => {
  const data = {
    ...req.body,
    created_at: new Date(),
  };
  const result = await carTypesService.createCarType(data);
  if (result != -1) {
    res.json({ isNotification: true, type: 'success', title: "succès", body: "La création du type de voiture est terminée avec succès", new: result });
  } else {
    res.json({ isNotification: true, type: 'error', title: "erreur", body: "Impossible de créer ce type de voiture." });
  }
};

exports.deleteCarTypeById = async (req, res) => {
  const carTypeId = req.params.carTypeId;
  const result = await carTypesService.deleteCarTypeById(carTypeId);
  if (result != -1) {
    res.json({ isNotification: true, type: 'success', title: "succès", body: "Type de voiture supprimé avec succès" });
  } else {
    res.json({ isNotification: true, type: 'error', title: "erreur", body: "Impossible de supprimer le type de voiture sélectionné." });
  }
};