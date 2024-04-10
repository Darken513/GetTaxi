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
const ttlInSeconds = 45;
const cleanTimerInSeconds = 25;

exports.storeOrUpdateDef = function (pathArray, value) {
    if (!Array.isArray(pathArray)) {
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
        cache[pathArray[0]].totalCount += 1;
    } else {
    }
}

exports.updateDefSpecificProp = function (pathArray, value) {
    if (!Array.isArray(pathArray)) {
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
    if (!Array.isArray(values)) {
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