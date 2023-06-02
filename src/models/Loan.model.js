const InstallmentModel = require("./Installment.model");
const db = require("../lib/database/NoSQLClient").getInstance();


class Loan {
    static #COLLECTION = `loans`;

    static STATUS = {
        PENDING: 'pending',
        APPROVED: 'approved',
        DENIED: 'denied',
        IN_PROGRESS: 'inProgress',
        PAID: 'paid'
    }

    /**
     * @type {number=}
     */
    #id;
    /**
     * @type {number=}
     */
    #customerId;
    /**
     * @type {number=}
     */
    #terms;
    /**
     * @type {InstallmentModel[]=}
     */
    installments;
    /**
     * @type {string=}
     */
    #referenceId;
    /**
     * @type {Date=}
     */
    #applicationDate;
    /**
     * @type {Date=}
     */
    #decisionDate;
    /**
     * @type {number=}
     */
    #amount;
    /**
     * @type {Loan.STATUS=}
     */
    status;
    /**
     * @type {number=}
     */
    balance;

    constructor(loan) {
        if (loan) {
            Loan.#addDefaults(loan);
            this.#id = loan.id;
            this.#customerId = loan.customerId;
            this.#terms = loan.terms;
            this.#referenceId = loan.referenceId;
            this.#decisionDate = loan.decisionDate;
            this.#applicationDate = loan.$inapplicationDate;
            this.#amount = loan.amount;
            this.installments = loan.installments;
            this.balance = loan.balance;
            this.status = loan.status;
        }
    }

    get id(){
        return this.#id;
    }

    get customerId(){
        return this.#customerId;
    }

    get terms(){
        return this.#terms;
    }

    get referenceId(){
        return this.#referenceId;
    }

    get applicationDate(){
        return this.#applicationDate;
    }

    get decisionDate(){
        return this.#decisionDate;
    }

    static findOne(searchCriteria) {
        const loanCollection = db.getCollection(Loan.#COLLECTION);
        const loan = loanCollection.findOne(searchCriteria);
        if (loan) {
            loan.installments = Loan.#getInstallments([loan])[loan.id];
            return new Loan(loan);
        } else {
            return null;
        }
    }

    static #getInstallments(loans) {
        const loanIds = loans.map(loan => loan.id);
        const installments = InstallmentModel.findAll({ loanId: { $in: loanIds } });
        const result = {};
        for (const installment of installments) {
            if (!result[installment.loanId]) {
                result[installment.loanId] = [installment];
            } else {
                result[installment.loanId].push(installment);
            }
        }
        return result;
    }

    static findAll(searchCriteria) {
        const loanCollection = db.getCollection(Loan.#COLLECTION);
        const records = loanCollection.chain().find(searchCriteria).simplesort(`id`).data();
        const loans = [];
        const installments = Loan.#getInstallments(records);
        for (const record of records) {
            record.installments = installments[record.id];
            loans.push(new Loan(record));
        }
        return loans;
    }

    static updateAll(ids, updateData) {
        const loanCollection = db.getCollection(Loan.#COLLECTION);
        updateData.updatedOn = new Date();
        loanCollection.findAndUpdate({
            id: { $in: ids }
        }, function update(obj) {
            Object.assign(obj, updateData);
            return obj;
        });
    }

    insert() {
        const loanCollection = db.getCollection(Loan.#COLLECTION);
        const data = {
            id: loanCollection.maxId+1,
            customerId: this.#customerId,
            referenceId: this.#referenceId,
            amount: this.#amount,
            terms: this.#terms,
            balance: this.balance,
        };
        Loan.#addDefaults(data);
        const loan = loanCollection.insert(data);
        this.#id = loan.id;
        this.#applicationDate = loan.applicationDate;
        return this;
    }

    static #addDefaults(obj) {
        if (!obj.decisionDate) obj.decisionDate = null;
        if (!obj.status) obj.status = Loan.STATUS.PENDING;
        if (!obj.applicationDate) obj.applicationDate = new Date();
        if (!obj.updatedOn) obj.updatedOn = new Date();
    }

    update() {
        const loanCollection = db.getCollection(Loan.#COLLECTION);
        const updateData = {
            status: this.status,
            balance: this.balance,
            updatedOn: new Date()
        };
        loanCollection
            .findAndUpdate({ id: this.id }, function update(obj) {
                Object.assign(obj, updateData);
                return obj;
            });
    }
}

module.exports = Loan;