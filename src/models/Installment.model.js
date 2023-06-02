const db = require("../lib/database/NoSQLClient").getInstance();


class Installment {
    static #COLLECTION = `installments`;

    static STATUS = {
        PENDING: 'pending',
        PAID: 'paid',
        ADVANCED: 'advanced',
        LATE: 'late'
    }

    /**
     * @type {number=}
     */
    #id;
    /**
     * @type {number=}
     */
    #loanId;
    /**
     * @type {Date=}
     */
    #dueDate;
    /**
     * @type {Date=}
     */
    paymentDate;
    /**
     * @type {Installment.STATUS=}
     */
    status;
    /**
     * @type {number=}
     */
    dueAmount;
    /**
     * @type {number=}
     */
    amount;

    constructor(installment) {
        if (installment) {
            Installment.#addDefaults(installment);
            this.#id = installment.id;
            this.#loanId = installment.loanId;
            this.#dueDate = installment.dueDate;
            this.dueAmount = installment.dueAmount;
            this.paymentDate = installment.paymentDate;
            this.status = installment.status;
            this.amount = installment.amount;
        }
    }

    get id(){
        return this.#id;
    }

    get loanId(){
        return this.#loanId;
    }

    get dueDate(){
        return this.#dueDate;
    }

    static findAll(searchCriteria) {
        const installmentCollection = db.getCollection(Installment.#COLLECTION);
        const records = installmentCollection.chain().find(searchCriteria).simplesort(`id`).data();
        const installments = [];
        if (records) {
            for (const record of records) {
                installments.push(new Installment(record));
            }
        }
        return installments;
    }

    static insertAll(installments) {
        const installmentCollection = db.getCollection(Installment.#COLLECTION);
        let id = installmentCollection.maxId+1;
        for (const installment of installments) {
            installment.id = id++;
            Installment.#addDefaults(installment);
        }
        return installmentCollection.insert(installments);
    }

    insert() {
        const installmentCollection = db.getCollection(Installment.#COLLECTION);
        const data = {
            id: installmentCollection.maxId+1,
            loanId: this.#loanId,
            dueDate: this.#dueDate,
            dueAmount: this.dueAmount,
            amount: this.amount
        };
        Installment.#addDefaults(data);
        installmentCollection.insert(data);
        return this;
    }

    static #addDefaults(obj) {
        if (!obj.amount) obj.amount = null;
        if (!obj.paymentDate) obj.paymentDate = null;
        if (!obj.status) obj.status = Installment.STATUS.PENDING;
        if (!obj.createdOn) obj.createdOn = new Date();
    }

    update() {
        const installmentCollection = db.getCollection(Installment.#COLLECTION);
        const updateData = {
            status: this.status,
            amount: this.amount,
            dueAmount: this.dueAmount,
            paymentDate: this.paymentDate,
            updatedOn: new Date()
        };
        installmentCollection
            .findAndUpdate({ id: this.id }, function update(obj) {
                Object.assign(obj, updateData);
                return obj;
            });
    }
}

module.exports = Installment;