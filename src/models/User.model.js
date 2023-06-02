const db = require("../lib/database/NoSQLClient").getInstance();


class User {
    static #COLLECTION = `users`;

    #id;
    /**
     * @type {string=}
     */
    email;
    /**
     * @type {string=}
     */
    password;
    /**
     * @type {'customer'|'admin'=}
     */
    type;

    constructor(user) {
        if (user) {
            this.#id = user.id;
            this.email = user.email;
            this.password = user.password;
            this.type = user.type;
        }
    }

    get id(){
        return this.#id;
    }

    static findOne(options) {
        const user = db.getCollection(User.#COLLECTION)?.findOne(options);
        return new User(user);
    }
}

module.exports = User;