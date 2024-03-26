const fs = require('fs');
/**
cache structure is the following : 
{
    'carTypes':{
        values: {
            carTypeId:{
                value: { id, ...doc.data() },
                expirationTime : ttl
            },
            ...
        },
        fetchedAllOnce: this is to keep track if at least one getAll was executed to figure out how much elements DB has
        totalCount : totalInDB ( +1 if added / -1 if deleted )
    },
    'zones':{...},
    'drivers':{...},
    'rideStatus':{...},
}
*/
const cache = {
    'carTypes': {
        values: {},
        totalCount: 0,
        fetchedAllOnce: false
    },
    'zones': {
        values: {},
        totalCount: 0,
        fetchedAllOnce: false
    },
    'drivers': {
        values: {},
        totalCount: 0,
        fetchedAllOnce: false
    },
    'rideStatus': {
        values: {},
        totalCount: 0,
        fetchedAllOnce: false
    },
};
const ttlInSeconds = 15;
const cleanTimerInSeconds = 10;

exports.storeOrUpdateDef = function (pathArray, value) {
    //console.info('attempting to store/update def in cache')
    if (!Array.isArray(pathArray)) {
        console.error("pathArray should be an Array")
        return -1;
    }
    let currentObj = cache;
    let shouldIncrement = false;
    for (let i = 0; i < pathArray.length - 1; i++) {
        const key = pathArray[i];
        if (currentObj[key] == undefined) {
            currentObj[key] = {};
        }
        currentObj = currentObj[key];
    }
    if (!currentObj[pathArray[pathArray.length - 1]]) {
        shouldIncrement = true;
    }
    currentObj[pathArray[pathArray.length - 1]] = {
        value,
        expirationTime: Date.now() + ttlInSeconds * 1000
    };
    if (shouldIncrement) {
        //console.info('stored a new def in cache')
        cache[pathArray[0]].totalCount += 1;
    } else {
        //console.info('updated an existing def in cache')
    }
}

exports.updateDefSpecificProp = function (pathArray, value) {
    //console.info('attempting to update specific prop in cache')
    if (!Array.isArray(pathArray)) {
        console.error("pathArray should be an Array")
        return -1;
    }
    let currentObj = cache;
    for (let i = 0; i < pathArray.length - 1; i++) {
        const key = pathArray[i];
        if (currentObj[key] == undefined) {
            return;
        }
        currentObj = currentObj[key];
        if (currentObj.expirationTime != undefined) {
            currentObj.expirationTime = Date.now() + ttlInSeconds * 1000;
        }
    }
    currentObj[pathArray[pathArray.length - 1]] = value;
}
exports.storeOrUpdateArrayofDefs = function (nodeName, values, ttlInSeconds = 10) {
    //console.info('attempting to store an array of defs in cache')
    if (!Array.isArray(values)) {
        console.error("pathArray & values should be of type Array")
        return -1;
    }
    const toSaveObj = {};
    values.forEach((val) => {
        toSaveObj[val.id] = {
            value: val,
            expirationTime: Date.now() + ttlInSeconds * 1000
        };
    })
    cache[nodeName] = {
        'values': toSaveObj,
        'fetchedAllOnce': true,
        'totalCount': values.length
    };
}

exports.deleteByPath = function (pathArray) {
    //console.info('attempting to delete a def from cache')
    let currentObj = cache;
    for (let i = 0; i < pathArray.length - 1; i++) {
        const key = pathArray[i];
        if (currentObj[key] == undefined) {
            cache[pathArray[0]].totalCount -= 1;
            return;
        }
        currentObj = currentObj[key];
    }
    delete currentObj[pathArray[pathArray.length - 1]];
    cache[pathArray[0]].totalCount -= 1;
    return;
}

exports.getByPath = function (pathArray) {
    //console.info('attempting to get a def from cache')
    let currentObj = cache;
    for (let i = 0; i < pathArray.length - 1; i++) {
        const key = pathArray[i];
        if (currentObj[key] == undefined) {
            return undefined;
        }
        currentObj = currentObj[key];
    }
    const toret = currentObj[pathArray[pathArray.length - 1]];
    if (!toret)
        return undefined;
    toret.expirationTime = Date.now() + ttlInSeconds * 1000; //update expiration time
    return toret.value;
}

exports.getArrayOfDefs = function (nodeName) {
    //console.info('attempting to get an array of defs from cache')
    let toParse = cache[nodeName]['values'];
    if (!toParse) {
        return undefined;
    }
    const toret = Object.values(toParse).map(val => val.value);
    if (cache[nodeName]['fetchedAllOnce'] && toret.length == cache[nodeName]['totalCount']) {
        Object.values(toParse).forEach((val) => {
            val.expirationTime = Date.now() + ttlInSeconds * 1000; //update expiration time
        })
        return toret;
    }
    return undefined;
}

exports.startCacheCleaner = function () {
    setInterval(() => {
        //fs.writeFileSync('cacheBeforeClean_' + Date.now() + ".json", JSON.stringify(cache))
        cleanExpiredEntries(cache);
    }, cleanTimerInSeconds * 1000)
}

function cleanExpiredEntries(obj) {
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const entry = obj[key];
            if (entry && entry.expirationTime && entry.expirationTime < Date.now()) {
                delete obj[key];
            } else if (typeof entry === 'object') {
                cleanExpiredEntries(entry);
            }
        }
    }
}