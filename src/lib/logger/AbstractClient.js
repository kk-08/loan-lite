const AppError = require("../../errors/AppError");
const Helper = require("../../utils/Helper");

/**
 * Abstract class for defining client methods
 * Any new Logger client must extend this and 
 * implement the required log methods
 */
class AbstractClient {
    /**
     * ID associated with logger instance to keep track of chain of events
     */
    #id;

    constructor(id = null) {
        this.#id = id || Helper.getUuid();
    }

    get id() {
        return this.#id;
    }

    /**
     * @param {string} msg 
     */
    debug(msg) {
        throw new AppError(`Implementation required`);
    }

    /**
     * @param {string} msg 
     */
    info(msg) {
        throw new AppError(`Implementation required`);
    }

    /**
     * @param {string} msg 
     */
    error(msg) {
        throw new AppError(`Implementation required`);
    }

    /**
     * @param {string} msg 
     */
    trace(msg) {
        throw new AppError(`Implementation required`);
    }

}

module.exports = AbstractClient;