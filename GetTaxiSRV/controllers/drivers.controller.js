const driversService = require("../services/drivers.service");

exports.getAllDrivers = async (req, res) => {
  const result = await driversService.getAllDrivers();
  if (result != -1) {
    res.json({ drivers: result });
  } else {
    res.json({ title: "error", body: "No Data (for drivers) available." });
  }
};

exports.getDriverByID = async (req, res) => {
  const driverId = req.params.driverId;
  const result = await driversService.getDriverByID(driverId);
  if (result != -1) {
    res.json(result);
  } else {
    res.json({ title: "error", body: "Driver type not available." });
  }
}

exports.createDriver = async (req, res) => {
  const data = {
    ...req.body,
    created_at: new Date(),
  };
  const result = await driversService.createDriver(data);
  if (result != -1) {
    res.json({ title: "success", body: "Driver added successfully", new: result });
  } else {
    res.json({ title: "error", body: "Couldnt create Driver." });
  }
};

exports.updateDriver = async (req, res) => {
  const updatedData = {
    ...req.body
  };
  const driverId = req.params.driverId;
  const result = await driversService.updateDriver(driverId, updatedData)
  if (result != -1) {
    res.status(201).json({ title: "success", body: "Driver updated successfully." });
  } else {
    res.status(201).json({ title: "error", body: "Driver update failed." });
  }
};

exports.changeDriverStatus = async (req, res) => {
  const updatedData = {
    isActive: req.params.status == 'true',
  };
  const driverId = req.params.driverId;
  const result = await driversService.changeDriverStatus(driverId, updatedData);
  if (result != -1) {
    res.status(201).json({ title: "success", body: "Driver status updated successfully." });
  } else {
    res.status(201).json({ title: "error", body: "Driver status update failed." });
  }
};

exports.deleteDriverById = async (req, res) => {
  const driverId = req.params.driverId;
  const result = await driversService.deleteDriverById(driverId);
  if (result != -1) {
    res.json({ title: "success", body: "Driver deleted successfully" });
  } else {
    res.json({ title: "error", body: "Couldnt delete Driver." });
  }
};

exports.uploadFile = async (req, res) => {
  const file = req.file;
  const driverId = req.params.driverId;
  const fileId = req.params.fileId;
  if (file) {
    const fileName = driversService.uploadFile(file, driverId, fileId);
    res.json({ fileName });
  } else {
    res.status(400).send('No file provided');
  }
}

exports.readFileURL = async (req, res) => {
  const driverId = req.params.driverId;
  const filePath = req.params.filePath;
  const result = await driversService.readFileURL(driverId, filePath);
  if (result != -1) {
    res.json({filePath: result});
  } else {
    res.json({ title: "error", body: "No file found." });
  }
}