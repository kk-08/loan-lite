const express = require("express");
const AppError = require("../errors/AppError");
const AppMiddlewares = require("../middlewares/App.middleware");
const Helper = require("../utils/Helper");


class App {

    /**
     * Client's configured API handlers
     */
    #handlers;

    /**
     * Instance of express application
     * @type {express.Express=}
     */
    #app;

    constructor() {
        this.#handlers = [];
        this.#app = express();
        this.#setSecurityHeaders();
        this.#setRequestParsers();
        this.#setBaseMiddlewares();
    }

    /**
     * Adds headers for security implications like
     * disabling `x-powered-by`
     * Can use 3rd party package like `helmet` for extensive controls
     */
    #setSecurityHeaders() {
        this.#app.disable(`x-powered-by`);
    }

    /**
     * Adds request parser for the API type
     */
    #setRequestParsers() {
        this.#app.use(express.json());
    }


    #setBaseMiddlewares() {
        this.#app.use(AppMiddlewares.addRequestMetadata);
        this.#app.use(AppMiddlewares.requestLogger);
        this.#app.use(AppMiddlewares.responseLogger);
    }

    addRequestHandler(routes, handler) {
        if ((Helper.is(routes, 'string') || Helper.is(routes, 'array'))
            && Helper.is(handler, 'function')) {
            this.#handlers.push({ routes , handler });
        } else {
            throw new AppError(`Invalid parameters specified for the request handler`);
        }
        return this;
    }

    build() {
        this.#setClientAPIHandlers();
        this.#setErrorHandlers();
        return this.#app;
    }

    #setClientAPIHandlers() {
        for (const { routes, handler } of this.#handlers) {
            this.#app.use(routes, handler);
        }
    }

    #setErrorHandlers() {
        this.#app.use(AppMiddlewares.notFoundHandler);
        this.#app.use(AppMiddlewares.httpErrorHandler);
    }
}

module.exports = App;