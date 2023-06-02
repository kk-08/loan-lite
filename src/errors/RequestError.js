const http_status_codes = require('http-status-codes');

class RequestError extends Error {
    /**
     * @param {number} [status_code=400]
     * @param {string?} message
     */
    constructor(status_code = 400, message = null) {
        status_code = Number(status_code) || 400;
        super(message || http_status_codes.getReasonPhrase(status_code));
        this.status = status_code;
        this.name = this.constructor.name;
    }
}

module.exports = RequestError;
