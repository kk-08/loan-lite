const loki = require("lokijs");
const AppError = require("../../errors/AppError");
const config = require("../../configs/config.json");


class Client {
    /**
     * Flag for allowing internal calls to constructor
     * Ensures a single client is made for underlying DB
     */
    static #internal;
    /**
     * Underlying cache
     * @type {loki}
     */
    static #db;

    constructor() {
        if (!Client.#internal) {
            throw new AppError(`Cannot instantiate DB client. Call getInstance instead`);
        }

        Client.#internal = false;
        Client.#db = new loki(config.db.store,{
            autoload: true,
            autosave: true, 
            autosaveInterval: 4000,
        });
    }

    static getInstance() {
        if (!Client.#db) {
            Client.#internal = true;
            new Client();
        }
        return Client.#db;
    }
}

module.exports = Client;