const crypto = require("node:crypto");
const db = require("../../lib/database/NoSQLClient").getInstance();


const CustomRouter = require("../../core/CustomRouter");
const router = CustomRouter.get();


router.get(`/collections`, async (req, res) => {
    createUsersCollection();
    createLoansCollection();
    createInstallmentsCollection();

    res.json(`Done`);
});

function createUsersCollection() {
    const entries = db.getCollection(`users`);
    if (!entries) db.addCollection(`users`, { unique: ['email'] });
}

function createLoansCollection() {
    const entries = db.getCollection(`loans`);
    if (!entries) db.addCollection(`loans`, { unique: [`referenceId`], indices: [`customerId`] });
}

function createInstallmentsCollection() {
    const entries = db.getCollection(`installments`);
    if (!entries) db.addCollection(`installments`, { indices: [`loanId`, `dueDate`] });
}

router.post(`/users`, async (req, res) => {
    const records = db.getCollection(`users`);
    const user = {
        id: records.maxId+1,
        email: req.body.email,
        name: req.body.name,
        password: getSha256(req.body.password),
        type: req.body.type
    };
    try {
        const result = db.getCollection(`users`).insert(user);
        res.json(result);
    } catch(error) {
        req.logger.error(error);
        res.status(400).send(`User insertion failed`);
    }
});

function getSha256(str) {
    return crypto.createHash('sha256').update(str).digest('base64');
}



module.exports = router;
