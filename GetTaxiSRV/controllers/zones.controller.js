const zonesService = require("../services/zones.service")

exports.getAllZones = async (req, res) => {
  const result = await zonesService.getAllZones();
  if(result != -1){
    res.json({ zones: result });
  } else {
    res.json({ isNotification: true, type: 'error', title: "erreur", body: "Aucune donnée (pour les zones) n'est disponible." });
  }
};

exports.getZoneById = async (req, res) => {
  const zoneId = req.params.zoneId;
  const result = await zonesService.getZoneById(zoneId);
  if (result != -1) {
    res.json(result);
  } else {
    res.json({ isNotification: true, type: 'error', title: "erreur", body: "Zone non disponible." });
  }
}

exports.createZone = async (req, res) => {
  const data = {
    ...req.body,
    created_at: new Date(),
  };
  const result = await zonesService.createZone(data);
  if(result != -1){
    res.json({ isNotification: true, type: 'success', title: "succès", body: "Zone ajoutée avec succès.", new: result });
  } else {
    res.json({ isNotification: true, type: 'error', title: "erreur", body: "Impossible de créer la zone." });
  }
};

exports.deleteZoneById = async (req, res) => {
  const zoneId = req.params.zoneId;
  const result = await zonesService.deleteZoneById(zoneId);
  if(result != -1){
    res.json({ isNotification: true, type: 'success', title: "succès", body: "Zone supprimée avec succès." });
  } else {
    res.json({ isNotification: true, type: 'error', title: "erreur", body: "Impossible de supprimer la zone." });
  }
};