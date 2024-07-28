
/**
 * Replaces a character at a specific index in a string.
 * @param str - The original string.
 * @param index - The index at which the character should be replaced.
 * @param chr - The character to be inserted at the specified index.
 * @returns The modified string with the character replaced.
 */
function setCharAtStringIndex(str: string, index: number, chr: string) {
    if (index > str.length - 1) return str;
    return str.substring(0, index) + chr + str.substring(index + 1);
}

/**
 * Determines whether a given value is numeric.
 * @param str - The value to be checked.
 * @returns True if the value is numeric, false otherwise.
 */
function isNumeric(str: any) {
    if (typeof str != "string") return false;
    return !isNaN((str as any)) && !isNaN(parseFloat(str))
}

/**
 * Formats a given date value into a string with the format "DD.MM.YYYY, HH:MM".
 * If the input is a string, it is converted to a timestamp and then formatted.
 * If the input is not provided or not a number, it is assumed to be a Firestore timestamp and converted to milliseconds before formatting.
 * @param inputDate - The date value to be formatted. Can be a string, number, or Firestore timestamp.
 * @returns A string representing the formatted date in the format "DD.MM.YYYY, HH:MM".
 */
function formatDate(inputDate: any) {
    if (typeof inputDate == "string") {
        const timestamp = new Date(inputDate).getTime();
        const unixEpoch = new Date('1970-01-01T00:00:00.000Z').getTime();
        const secondsSinceUnixEpoch = Math.floor((timestamp - unixEpoch));
        inputDate = secondsSinceUnixEpoch;
    } else {
        if (!inputDate)
            return;
        if (typeof inputDate != 'number')
            inputDate = inputDate._seconds * 1000;
    }
    const date = new Date(inputDate);

    const day = date.getDate();
    const month = date.getMonth() + 1; // Months are zero-indexed
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    const formattedDay = day < 10 ? '0' + day : day;
    const formattedMonth = month < 10 ? '0' + month : month;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    const formattedHours = hours < 10 ? '0' + hours : hours;

    const formattedDate = `${formattedDay}.${formattedMonth}.${year}, ${formattedHours}:${formattedMinutes}`;

    return formattedDate;
}


function getCurrentPosition():any {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
}

async function getCoordinates() {
    try {
        const position = await getCurrentPosition();
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
        return [latitude, longitude];
    } catch (error:any) {
        console.error(`Error: ${error.message}`);
        return [];
    }
}


export {
    setCharAtStringIndex,
    isNumeric,
    formatDate,
    getCoordinates
}