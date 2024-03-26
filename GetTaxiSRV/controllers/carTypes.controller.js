const carTypesService = require("../services/carTypes.service");

exports.getAllCarTypes = async (req, res) => {
  const result = await carTypesService.getAllCarTypes();
  if (result != -1) {
    res.json({ carTypes: result });
  } else {
    res.json({ title: "error", body: "No Data (for car types) available." });
  }
};

exports.getCarByID = async (req, res) => {
  const carId = req.params.carId;
  const result = await carTypesService.getCarByID(carId);
  if (result != -1) {
    res.json(result);
  } else {
    res.json({ title: "error", body: "Car type not available." });
  }
}

exports.createCarType = async (req, res) => {
  const data = {
    ...req.body,
    created_at: new Date(),
  };
  const result = await carTypesService.createCarType(data);
  if (result != -1) {
    res.json({ title: "success", body: "Car type added successfully", new: result });
  } else {
    res.json({ title: "error", body: "Couldnt create Car type." });
  }
};

exports.deleteCarTypeById = async (req, res) => {
  const carTypeId = req.params.carTypeId;
  const result = await carTypesService.deleteCarTypeById(carTypeId);
  if (result != -1) {
    res.json({ title: "success", body: "Car type deleted successfully" });
  } else {
    res.json({ title: "error", body: "Couldnt delete Car type." });
  }
};