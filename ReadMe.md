1. Le téléphoniste enregistre le numéro du client, l’adresse de départ/destination, et l’option immédiate ou différée (avec date/heure).
2. Après l’appel, envoi d’un SMS à tous les chauffeurs avec les détails de la demande et un numéro de demande. Leschauffeurs peuvent accepter ou refuser.
3. Le premier chauffeur qui accepte la demande indique le temps d’arrivée en minutes jusqu’à l’arrivée au client et est attribué à la course.
4. Envoi d’un SMS à l’administrateur avec les détails du chauffeur, le numéro de demande, et les informations de confirmation du chauffeur (minutes, détails du véhicule).
5. Envoi d’un SMS au client avec le temps d’arrivée estimé du chauffeur et un lien de suivi de la localisation duchauffeur.
6. Le chauffeur arrive chez le client, confirme dans le système en ligne, puis une notification par SMS est envoyée àl’administrateur.
7. Le chauffeur, après la fin de la course, saisit le montant dans le système en ligne.
8. L’administrateur est informé par SMS dès que le chauffeur termine la course et saisit le montant. Le SMS inclut lenuméro de la demande, l’identification du chauffeur, et le montant de la course.

secondary stuff :
- a way to edit zones, car types, car brands, and drivers
- a way to upload files for drivers
  - permis de conduire
  - ⁠autorisation de transport
  - ⁠Permis de taxi
  - ⁠et la carte grise de sa voiture.
- not displaying full address for drivers who didnt accept ride
- driver account creation
- driver phone verification
- driver profile consultation
- a realtime location update user-driver
- restablishing connection if lost
- ride state
- ride canceling driver/client

TODO :

- profile consultation for driver / check credits and nbr of rides done / check current ride
- once validated the driver is added in a list of drivers to activate -> add a proprety previouslyActivated
- resending sms if ride canceled by driver

- sending sms to client as well, driver on his way, rate dirver maybe ?

- ridestatus state, pickingUpClient / takingClientToDestination / rideFinished
- sending an sms to admin once ride done

- not sending sms to drivers with low credits (where credits-cost < -5 disant)

- we should find a way for online payment so that the driver charges his wallet