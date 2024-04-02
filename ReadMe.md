1.	Le téléphoniste enregistre le numéro du client, l’adresse de départ/destination, et l’option immédiate ou différée (avec date/heure).
2.	Après l’appel, envoi d’un SMS à tous les chauffeurs avec les détails de la demande et un numéro de demande. Leschauffeurs peuvent accepter ou refuser.
3.	Le premier chauffeur qui accepte la demande indique le temps d’arrivée en minutes jusqu’à l’arrivée au client et est attribué à la course.
4.	Envoi d’un SMS à l’administrateur avec les détails du chauffeur, le numéro de demande, et les informations de confirmation du chauffeur (minutes, détails du véhicule).
5.	Envoi d’un SMS au client avec le temps d’arrivée estimé du chauffeur et un lien de suivi de la localisation duchauffeur.
6.	Le chauffeur arrive chez le client, confirme dans le système en ligne, puis une notification par SMS est envoyée àl’administrateur.
7.	Le chauffeur, après la fin de la course, saisit le montant dans le système en ligne.
8.	L’administrateur est informé par SMS dès que le chauffeur termine la course et saisit le montant. Le SMS inclut lenuméro de la demande, l’identification du chauffeur, et le montant de la course.

secondary stuff :
- a way to edit zones, car types, and drivers
- a way to upload files for drivers
    - permis de conduire 
    - ⁠autorisation de transport 
    - ⁠Permis de taxi 
    - ⁠et la carte grise de sa voiture. 
- a realtime location update user-driver



TODO : 
- on driver & user cancel ride
- keep track of the driver behavior ( cancel & accept ) rides
- add a proprety to disable ridestatus if user canceled it
- add credis to drivers

- we should find a solution for calculating the distance between start & end
- we should find a way for online payment so that the driver charges his wallet
- 