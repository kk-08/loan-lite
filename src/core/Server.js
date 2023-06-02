const http = require("node:http");
const AppProcess = require("./AppProcess");
const AppError = require("../errors/AppError");
const Logger = require("../lib/logger/LoggerClient");


class Server {
    static ERRORS = {
        ACCESS_DENIED: `EACCES`,
        ADDRESS_IN_USE: `EADDRINUSE`
    }

    /**
     * Instance of the server
     * @type {http.Server=}
     */
    #httpServer;
    /**
     * Instance of logger to be used for logging server messages/errors
     * @type {Logger}
     */
    #logger;

    /**
     * @type {Server=}
     */
    static #instance = null;

    /**
     * @type {boolean}
     */
    static #internal = false;

    constructor() {
        if (!Server.#internal) throw new AppError(`Cannot instantiate Server. Call getInstance instead`);
        Server.#internal = false;
        this.#logger = new Logger();
    }

    static getInstance() {
        if (Server.#instance === null) {
            Server.#internal = true;
            Server.#instance = new Server();
        }
        return Server.#instance;
    }

    /**
     * Creates and starts a server listening on the PORT and HOST
     * defined in the app (falling back to DEFAULTS)
     */
    init(app) {
        this.#httpServer = http.createServer(app);
        this.#httpServer.listen(app.get(`PORT`), app.get(`HOST`));
        this.#subscribeToProcessEvents();
        this.#subscribeToServerEvents();
    }

    /**
     * Adds listeners to server's events
     */
    #subscribeToServerEvents() {
        this.#httpServer.on(`error`, Server.#onError.bind(this));
        this.#httpServer.on(`listening`, Server.#onListening.bind(this));
    }

    /**
     * Event listener for HTTP server's `error` event.
     * @param {Error} error
     */
    static #onError(error) {
        switch (error.code) {
            case Server.ERRORS.ACCESS_DENIED:
            case Server.ERRORS.ADDRESS_IN_USE:
                this.#logger.error(`Unable to start server on ${this.#getHostPortLog(error)}\nTRACE: ${error.stack}\n`);
                process.exit(1);
            default:
                throw error;
        }
    }

    #getHostPortLog(options) {
        return `[Host ${options.address}][Port ${options.port}]`;
    }

    /**
     * Event listener for HTTP server `listening` event.
     */
    static #onListening() {
        const addInfo = this.#httpServer.address();
        this.#logger.info(`Server started on ${this.#getHostPortLog(addInfo)}`);
    }

    #subscribeToProcessEvents() {
        const appProcess = new AppProcess(this.#httpServer);
        appProcess.subscribeToExceptions();
        appProcess.subscribeToExitSignals();
    }
}

module.exports = Server;