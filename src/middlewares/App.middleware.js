const createHttpError = require("http-errors");
const httpStatusCodes = require("http-status-codes");
const Helper = require("../utils/Helper");
const Logger = require("../lib/logger/LoggerClient");


class App {
    /**
     * Middleware for adding metadata to request for context and logging
     * @param {Express.Request} req
     * @param {Express.Response} res
     * @param {*} next
     */
    static addRequestMetadata(req, res, next){
        req.ns = {
            id: Helper.getUuid(),
            startTime: new Date(),
            endTime: null
        };
        req.logger = new Logger(req.ns.id);
    
        next();
    }

    static requestLogger(req, res, next) {
        let logMsg = `${req.method} request received from IP: ${App.#getClientIp(req)} with`;
        if (req.body) logMsg += ` body: ${App.#getBody(req.body)},`;
        if (req.query) logMsg += ` query params: ${JSON.stringify(req.query)},`;
        logMsg += ` headers: ${JSON.stringify(req.headers)} on endpoint: ${req.originalUrl}`;
    
        req.logger.info(logMsg);
        next();
    }

    static #getClientIp(req) {
        return req.headers[`x-forwarded-for`]?.split(`,`).pop()
            || req.connection.remoteAddress 
            || req.socket.remoteAddress 
            || req.connection.socket.remoteAddress;
    }

    static #getBody(req) {
        let body = req.body || null;
        if (body !== null && !Helper.is(body, 'string')) body = JSON.stringify(body);
        return body;
    }

    static responseLogger(req, res, next) {
        const data = { chunks: [] };
        App.#overrideWriteFunction(res, data);
        App.#overrideEndFunction(req, res, data);
        next();
    }
    
    static #overrideWriteFunction(res, data) {
        const originalWrite = res.write;
        res.write = function (chunk) {
            if (chunk) data.chunks.push(chunk);
            originalWrite.apply(res, arguments);
        };
    }

    static #overrideEndFunction(req, res, data) {
        const originalEnd = res.end
        res.end = function (chunk) {
            try {
                if (chunk) data.chunks.push(chunk);
                const responseBody = Buffer.concat(data.chunks).toString(`utf8`);
                req.logger.info(`Response sent with statusCode: ${res.statusCode}, body: ${responseBody} \
                and headers: ${JSON.stringify(res.getHeaders())} in ${req.ns.endTime - req.ns.startTime} ms`);
            } catch (err) {
                req.logger.error(`Error occurred while logging response body: ${JSON.stringify(err)}`);
            } finally {
                originalEnd.apply(res, arguments);
            }
        }
    }

    static notFoundHandler(req, res, next) {
        next(createHttpError(404));
    }

    static httpErrorHandler(error, req, res, next) {
        if (!error) return next();
    
        let result = error.message, status = Number(error.status) || 500;
        if (status === 500) {
            req.logger.error(error.stack);
            result = httpStatusCodes.getReasonPhrase(status);
        }

        if (res.headersSent) {
            //Response already sent and hence, should not be sent again
            return next(error);
        } else {
            res.status(status).send(result);
        }
    }
}

module.exports = App;