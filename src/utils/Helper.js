const { v4: uuidv4 } = require("uuid");
const ipAddress = require("ip").address();


class Helper {
    /**
     * Returns `true` if the value is defined and not null
     * @param {*} value 
     * @returns
     */
    static isSet(value) {
        return (typeof value !== `undefined` && value !== null);
    }

    /**
     * Returns `true` if the `value` is of the given `type`
     * @param {*} value 
     * @returns
     */
    static is(value, type) {
        switch (type) {
            case 'array': 
                return Array.isArray(value);
            default:
                return (typeof value === type);
        }
    }

    /**
     * Returns `true` if the `value` is an empty object
     * @param {*} value 
     * @returns
     */
    static getServerIp () {
        return ipAddress;
    }

    /**
     * Generates and returns a `UUID` (version 4)
     * @returns
     */
    static getUuid() {
        return uuidv4().replaceAll(`-`,``);
    }

    static round(num, places) {
        return Number(Math.round(num + `e+${places}`) + `e-${places}`);
    }

    /**
    * Adds the number of weeks to the given date and returns
    * @param {Date} date
    * @param {number} numWeeks
    * @returns
    */
    static getDateAfterWeeks(numWeeks) {
        const newDate = new Date();
        newDate.setDate(newDate.getDate() + 7*numWeeks);
        return newDate;
    }
}

module.exports = Helper;