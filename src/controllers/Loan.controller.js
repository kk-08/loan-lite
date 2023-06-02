const Constants = require("../utils/Constants");
const Helper = require("../utils/Helper");
const InstallmentModel = require("../models/Installment.model");
const LoanModel = require("../models/Loan.model");
const RequestError = require("../errors/RequestError");


class LoanController {
    #user;

    constructor(user) {
        this.#user = user;

    }

    #isCustomer() {
        return this.#user.type === Constants.USERS.TYPE.CUSTOMER;    
    }

    #isAdmin() {
        return this.#user.type === Constants.USERS.TYPE.ADMIN;  
    }

    async create(request) {
        if (!this.#isCustomer()) throw new RequestError(401);
        if (this.#isDuplicateCreateRequest(request)) {
            throw new RequestError(409, `Loan with reference ID already exists`);
        }

        const loan = new LoanModel({ 
            customerId: this.#user.id,
            referenceId: request.referenceId,
            amount: request.amount,
            balance: request.amount,
            terms: request.terms
        });
        loan.insert();
        return LoanController.#prepareResponse([loan])[0];
    }

    #isDuplicateCreateRequest(request) {
        const loan = LoanModel
            .findOne({ customerId: this.#user.id, referenceId : request.referenceId });
        return Boolean(loan);
    }

    static #prepareResponse(loans) {
        const response = [];
        for (const loan of loans) {
            const installments = LoanController.#getInstallmentData(loan.installments);
            response.push({ 
                id: loan.id,
                referenceId: loan.referenceId,
                customerId: loan.customerId,
                referenceId: loan.referenceId,
                applicationDate: loan.applicationDate,
                installments,
                terms: loan.terms,
                ...loan 
            });
        }
        return response;
    }

    static #getInstallmentData(installments) {
        if (!installments) return null;

        const result = [];
        for (const installment of installments) {
            result.push({
                id: installment.id,
                ...installment
            })
        }
        return result;
    }

    async pay(loanId, amount) {
        if (!this.#isCustomer()) throw new RequestError(401);
        
        const loan = LoanModel.findOne({ id: loanId, 
            status: { $in: [LoanModel.STATUS.APPROVED, LoanModel.STATUS.IN_PROGRESS] } });
        if (!loan) throw new RequestError(400, `No loan found for payment`);
        if (loan.balance < amount) throw new RequestError(400, `Amount more than pending balance`);

        //Create transaction
        this.#processInstallments(loan, amount);
        loan.balance -= amount;
        loan.status = LoanModel.STATUS.IN_PROGRESS;
        if (loan.balance === 0) {
            loan.status = LoanModel.STATUS.PAID;
        }
        loan.update();
        //Commit or rollback transaction basis success/failure
    }

    #processInstallments(loan, amount) {
        const pendingInstallments = loan.installments
            .filter(x => x.status === InstallmentModel.STATUS.PENDING);
        const currentInstallment = pendingInstallments[0];
        if (currentInstallment.dueAmount > amount) throw new RequestError(400, `Installment amount must not be less than the due amount`);
        if (currentInstallment.dueDate < new Date()) { 
            //TODO: Add late payment charges 
        }

        currentInstallment.amount = amount;
        currentInstallment.status = InstallmentModel.STATUS.PAID;
        currentInstallment.paymentDate = new Date();
        amount -= Helper.round(currentInstallment.dueAmount, 3);

        currentInstallment.update();
        let j = pendingInstallments.length-1;
        while (amount > 0 && j > 0) {
            const lastPendingInstallment = pendingInstallments[j];
            const dueAmount = lastPendingInstallment.dueAmount;
            lastPendingInstallment.dueAmount = Math.max(0, dueAmount-amount);
            if (lastPendingInstallment.dueAmount === 0) {
                lastPendingInstallment.status = InstallmentModel.STATUS.ADVANCED;
                lastPendingInstallment.amount = 0;
            }
            lastPendingInstallment.update();
            amount -= Helper.round(dueAmount, 3);;
            j--;
        }
    }

    /**
     * Fetches and returns the list of loans for the given customer or admin
     * If loanIds are passed, only those loans are fetched 
     * @param {number[]=} loanIds 
     * @returns 
     */
    async get(loanIds = []) {
        let searchOptions = {};
        if (loanIds.length) searchOptions.id = { $in: loanIds };

        if (this.#isCustomer()) {
            searchOptions.customerId = this.#user.id;
            const loans = LoanModel.findAll(searchOptions);
            return LoanController.#prepareResponse(loans);
        } else if (this.#isAdmin()) {
            //Add business logic for selecting a category of customers, if required
            const loans = LoanModel.findAll(searchOptions);
            return LoanController.#prepareResponse(loans);
        } else {
            throw new RequestError(401);
        }
    }

    async approveOrDeny(loanIds, isApproved) {
        if (!this.#isAdmin()) throw new RequestError(401);

        let loans = LoanModel.findAll({ id: { $in: loanIds } });
        loans = loans.filter(loan => loan.status === LoanModel.STATUS.PENDING);
        if (loans.length !== loanIds.length) {
            const idsPresent = new Set();
            for (const loan of loans) idsPresent.add(loan.id);
            const missingIds = loanIds.filter(id => !idsPresent.has(id));
            //Either loan missing or already approved/denied
            throw new RequestError(400, `Invalid loan IDs specified: ${missingIds}`);
        } else {
            //Create transaction
            LoanModel.updateAll(loanIds, {
                status: isApproved ? LoanModel.STATUS.APPROVED: LoanModel.STATUS.DENIED,
                decisionDate: new Date()
            });
            if (isApproved) this.#createInstallments(loans);
            //Commit or rollback transaction basis success/failure
            return;
        }
    }

    async #createInstallments(loans) {
        for (const loan of loans) {
            const installments = [];
            if (loan.terms === 1) {
                installments.push({
                    loanId: loan.id,
                    dueAmount: loan.balance,
                    dueDate: Helper.getDateAfterWeeks(terms)
                });
            } else {
                let installmentAmt = Helper.round(loan.balance/loan.terms, 3);
                let balanceAmt = loan.balance;
                for (let i=1; i<loan.terms; i++) {
                    balanceAmt -= installmentAmt;
                    installments.push({
                        loanId: loan.id,
                        dueAmount: installmentAmt,
                        dueDate: Helper.getDateAfterWeeks(i)
                    });
                }
                installments.push({
                    loanId: loan.id,
                    dueAmount: Helper.round(balanceAmt, 3),
                    dueDate: Helper.getDateAfterWeeks(loan.terms)
                });
            }
            const result = InstallmentModel.insertAll(installments);
            loan.installments = result || installments;
        }
    }
}

module.exports = LoanController;