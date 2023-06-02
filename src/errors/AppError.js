class AppError extends Error {
    /**
     * @param {string} message
     * @param {JSON?} data
     */
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}

module.exports = AppError;