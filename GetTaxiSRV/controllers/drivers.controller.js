const driversService = require("../services/drivers.service");

//todo-p2: find a solution to avoid allowing drivers to accept two rides at the same time
exports.login = async (req, res) => {
  const result = await driversService.login(req);
  if (result == -1) {
    res.json({ isNotification: true, type: 'error', title: "erreur", body: "Impossible de se connecter, veuillez vérifier vos informations d'identification." });
  } else if (result == -2) {
    res.json({ isNotification: true, type: 'error', title: "erreur", body: "Impossible de se connecter, email non inscrit." });
  } else {
    res.json({ token: result });
  }
}
exports.signUp = async (req, res) => {
  const result = await driversService.signUp(req.body);
  if (result == -1) {
    res.json({ isNotification: true, type: 'error', title: "erreur", body: "Impossible de s'inscrire, l'email est déjà enregistré." });
  } else if (result == -2) {
    res.json({ isNotification: true, type: 'error', title: "erreur", body: "Impossible de s'inscrire, erreur inconnue." });
  } else {
    res.json({ isNotification: true, type: 'success', title: "succès", body: "Création de compte terminée avec succès." });
  }
}

exports.getAllDrivers = async (req, res) => {
  const result = await driversService.getAllDrivers();
  if (result != -1) {
    res.json({ drivers: result });
  } else {
    res.json({ isNotification: true, type: 'error', title: "erreur", body: "Aucune donnée (pour les conducteurs) n'est disponible." });
  }
};

exports.getDriverByID = async (req, res) => {
  const driverId = req.params.driverId;
  const result = await driversService.getDriverByID(driverId);
  if (result != -1) {
    res.json(result);
  } else {
    res.json({ isNotification: true, type: 'error', title: "erreur", body: "Le conducteur n'est pas disponible." });
  }
}
exports.getDriverBehaviorsById = async (req, res) => {
  const driverId = req.params.driverId;
  const nbr = req.params.nbr;
  const result = await driversService.getDriverBehaviorsById(driverId, nbr);
  if (result != -1) {
    res.json(result);
  } else {
    res.json({ isNotification: true, type: 'error', title: "erreur", body: "Le conducteur n'est pas disponible." });
  }
}

exports.createDriver = async (req, res) => {
  const data = {
    ...req.body,
    created_at: new Date(),
  };
  const result = await driversService.createDriver(data);
  if (result != -1) {
    res.json({ isNotification: true, type: 'success', title: "succès", body: "Le conducteur a été ajouté avec succès", new: result });
  } else {
    res.json({ isNotification: true, type: 'error', title: "erreur", body: "Impossible de créer ce conducteur." });
  }
};

exports.updateDriver = async (req, res) => {
  const updatedData = {
    ...req.body
  };
  const driverId = req.params.driverId;
  const result = await driversService.updateDriver(driverId, updatedData)
  if (result != -1) {
    res.status(201).json({ isNotification: true, type: 'success', title: "succès", body: "les données du conducteur ont été mises à jour avec succès." });
  } else {
    res.status(201).json({ isNotification: true, type: 'error', title: "erreur", body: "La mise à jour du conducteur a échoué." });
  }
};

exports.changeDriverStatus = async (req, res) => {
  const updatedData = {
    isActive: req.params.status == 'true',
  };
  const driverId = req.params.driverId;
  const result = await driversService.changeDriverStatus(driverId, updatedData);
  if (result != -1) {
    res.status(201).json({ isNotification: true, type: 'success', title: "succès", body: "L'état du conducteur a été mis à jour avec succès." });
  } else {
    res.status(201).json({ isNotification: true, type: 'error', title: "erreur", body: "La mise à jour de l'état du conducteur a échoué." });
  }
};

exports.deleteDriverById = async (req, res) => {
  const driverId = req.params.driverId;
  const result = await driversService.deleteDriverById(driverId);
  if (result != -1) {
    res.json({ isNotification: true, type: 'success', title: "succès", body: "Conducteur supprimé avec succès." });
  } else {
    res.json({ isNotification: true, type: 'error', title: "erreur", body: "Impossible de supprimer ce conducteur." });
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
    res.json({ filePath: result });
  } else {
    res.json({ isNotification: true, type: 'error', title: "erreur", body: "Aucun fichier n'a été trouvé." });
  }
}

exports.sendSMSVerificationCode = async (req, res) => {
  const driverId = req.decoded.driverId;
  const result = await driversService.sendSMSVerificationCode(driverId);
  if (result != -1) {
    res.json({ error: false });
  } else {
    res.json({ success: true });
  }
}

exports.verifySMSCode = async (req, res) => {
  const driverId = req.decoded.driverId;
  const verifCode = req.params.verifCode;
  const result = await driversService.verifySMSCode(driverId, verifCode);
  if (result == -1) {
    res.json({ error: true });
  } else {
    res.json({ success: true });
  }
}