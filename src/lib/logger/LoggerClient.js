const dateFormat = require("dateformat");
const AbstractClient = require("./AbstractClient");


class Client extends AbstractClient {

    static #TIME_FORMAT = `yyyy-mm-dd HH:MM:ss`;
    
    debug(msg) {
        console.debug(this.#getMessage(msg));
    }

    #getMessage(msg) {
        return { id: this.id, ts: dateFormat(Client.#TIME_FORMAT), msg };
    }

    info(msg) {
        console.info(this.#getMessage(msg));
    }

    error(msg) {
        console.error(this.#getMessage(msg));
    }

    trace(msg) {
        console.trace(this.#getMessage(msg));
    }
}

module.exports = Client;