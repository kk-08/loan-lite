const AppBuilder = require("../src/core/AppBuilder");
const Server = require("../src/core/Server");
const config = require("../src/configs/config.json");
const API = {
    INTERNAL: require("../src/routes/internal/index"),
    ADMIN:  require("../src/routes/admins/index"),
    CUSTOMER: require("../src/routes/customers/index")
}
const Clients = {
    DB: require('../src/lib/database/NoSQLClient'),
}


runApp();

async function runApp() {
    validateConfig();
    const expressApp = buildAndGetExpressApp();
    expressApp.set('HOST', config.app.host);
    expressApp.set('PORT', config.app.port);
    await connectClients();
    startServer(expressApp);
}

function validateConfig() {
    //validate required configurations
}

function buildAndGetExpressApp() {
    const app = new AppBuilder()
        .addRequestHandler(`/internal`, API.INTERNAL)
        .addRequestHandler(`/admins`, API.ADMIN)
        .addRequestHandler(`/customers`, API.CUSTOMER)
        .build();
    return app;
}

async function connectClients() {
    for (const client in Clients) {
        await Clients[client].getInstance();
    }
}

function startServer(app) {
    const server = Server.getInstance();
    server.init(app);
}