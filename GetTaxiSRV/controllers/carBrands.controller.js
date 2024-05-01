const carBrandsService = require("../services/carBrands.service");

exports.getAllCarBrands = async (req, res) => {
  const result = await carBrandsService.getAllCarBrands();
  if (result != -1) {
    res.json({ carBrands: result });
  } else {
    res.json({ isNotification: true, type: 'error', title: "erreur", body: "Pas de données disponibles (pour les marques de voitures)." });
  }
};

exports.getCarBrandByID = async (req, res) => {
  const carBrandId = req.params.carBrandId;
  const result = await carBrandsService.getCarBrandByID(carBrandId);
  if (result != -1) {
    res.json(result);
  } else {
    res.json({ isNotification: true, type: 'error', title: "erreur", body: "La marque de voiture n'est pas disponible." });
  }
}

exports.createCarBrand = async (req, res) => {
  const data = {
    ...req.body,
    created_at: new Date(),
  };
  const result = await carBrandsService.createCarBrand(data);
  if (result != -1) {
    res.json({ isNotification: true, type: 'success', title: "succès", body: "La création du marque de voiture est terminée avec succès", new: result });
  } else {
    res.json({ isNotification: true, type: 'error', title: "erreur", body: "Impossible de créer ce marque de voiture." });
  }
};

exports.deleteCarBrandById = async (req, res) => {
  const carBrandId = req.params.carBrandId;
  const result = await carBrandsService.deleteCarBrandById(carBrandId);
  if (result != -1) {
    res.json({ isNotification: true, type: 'success', title: "succès", body: "Marque de voiture supprimé avec succès" });
  } else {
    res.json({ isNotification: true, type: 'error', title: "erreur", body: "Impossible de supprimer la marque de voiture sélectionné." });
  }
};