class DriverURL {
    constructor(driver, rideStatusObj) {
        this.driver = driver;
        this.rideStatusObj = rideStatusObj;
        this.createURLs()
    }
    createURLs() {
        const driverApiUrl = process.env.DRIVER_API_URL + process.env.DRIVER_RIDE_STATUS_API;
        const clientApiUrl = process.env.CLIENT_API_URL + process.env.CLIENT_RIDE_REALTIME_API;
        this.rideStatusURL = [driverApiUrl, this.rideStatusObj.id, this.driver.id].join("/")
        this.clientURL = [clientApiUrl, this.rideStatusObj.id].join("/")
    }
}

exports.DriverURL = DriverURL;