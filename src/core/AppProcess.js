const http = require("node:http");
const Logger = require("../lib/logger/LoggerClient");


class AppProcess {
    /**
     * List of application process exceptions to be handled
     */
    static #EXCEPTIONS = [`unhandledRejection`, `uncaughtException`];
    /**
     * List of exit signals to be handled for graceful shutdown
     */
    static #EXIT_SIGNALS = [`SIGHUP`, `SIGINT`, `SIGTERM`];
    /**
     * Instance of the server
     * @type {http.Server}
     */
    #server;
    /**
     * Logger instance associated with the process
     * @type {Logger}
     */
    #logger;
    /**
     * Flag to indicate if the server is shutting down
     * @type {boolean}
     */
    #isShuttingDown;


    constructor(server) {
        this.#server = server;
        this.#logger = new Logger();
        this.#isShuttingDown = false;
    }

    subscribeToExceptions() {
        for (const exception of AppProcess.#EXCEPTIONS) {
            process.on(exception, AppProcess.#logUncaughtError.bind(this));
        }
    }

    static #logUncaughtError(error) {
        const msg = error.stack ? error.stack : error;
        this.#logger.error(`Unhandled error occurred: ${msg}`);
    }

    subscribeToExitSignals() {
        for (const signal of AppProcess.#EXIT_SIGNALS) {
            process.on(signal, () => this.#gracefulShutdown());
        }
        process.on(`exit`, () => this.#logger.info(`Application exited!`));
    }

    #gracefulShutdown() {
        if (!this.#isShuttingDown) {
            this.#isShuttingDown = true;
            this.#logger.info(`Application shutting down...`);

            //Close all entities that need to be exited gracefully
            this.#server.close((error) => {
                if (error) {
                    this.#logger.error(`Error in closing server: ${error}`);
                }
                this.#isShuttingDown = false;
                process.exit(error ? 1: 0);
            });
        }
    }
}

module.exports = AppProcess;