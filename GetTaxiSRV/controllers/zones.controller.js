const zonesService = require("../services/zones.service")

exports.getAllZones = async (req, res) => {
  const result = await zonesService.getAllZones();
  if(result != -1){
    res.json({ zones: result });
  } else {
    res.json({ title: "error", body: "No Data (for zones) available." });
  }
};

exports.getZoneById = async (req, res) => {
  const zoneId = req.params.zoneId;
  const result = await zonesService.getZoneById(zoneId);
  if (result != -1) {
    res.json(result);
  } else {
    res.json({ title: "error", body: "Zone not available." });
  }
}

exports.createZone = async (req, res) => {
  const data = {
    ...req.body,
    created_at: new Date(),
  };
  const result = await zonesService.createZone(data);
  if(result != -1){
    res.json({ title: "success", body: "Zone added successfully", new: result });
  } else {
    res.json({ title: "error", body: "Couldnt create Zone." });
  }
};

exports.deleteZoneById = async (req, res) => {
  const zoneId = req.params.zoneId;
  const result = await zonesService.deleteZoneById(zoneId);
  if(result != -1){
    res.json({ title: "success", body: "Zone deleted successfully" });
  } else {
    res.json({ title: "error", body: "Couldnt delete Zone." });
  }
};