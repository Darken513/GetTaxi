class DriverURL {
    constructor(driver, rideStatusObj) {
        this.driver = driver;
        this.rideStatusObj = rideStatusObj;
        this.createURL()
    }
    createURL() {
        const apiUrl = process.env.DRIVER_API_URL + process.env.RIDE_STATUS_API;
        this.rideStatusURL = [apiUrl, this.rideStatusObj.id, this.driver.id].join("/")
    }
}

exports.DriverURL = DriverURL;