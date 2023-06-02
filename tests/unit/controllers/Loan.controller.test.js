const LoanController = require("../../../src/controllers/Loan.controller");
const Constants = require("../../../src/utils/Constants");
const Helper = require("../../../src/utils/Helper");
const InstallmentModel = require("../../../src/models/Installment.model");
const LoanModel = require("../../../src/models/Loan.model");
const RequestError = require("../../../src/errors/RequestError");


jest.mock("../../../src/utils/Helper");
jest.mock("../../../src/models/Installment.model");
jest.mock("../../../src/models/Loan.model");
jest.mock("../../../src/errors/RequestError");


describe('Loan controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
  
    describe('create', () => {
        test('Should throw RequestError if the user is not a customer', async() => {
            const user = { id: 1, type: Constants.USERS.TYPE.ADMIN };
            const loanController = new LoanController(user);
            
            try {
                await loanController.create({})
            } catch(error) {
                expect(error instanceof RequestError).toBe(true);
                expect(RequestError).toBeCalledWith(401);
            }
        });
    
        test('Should throw RequestError for duplicate request', async() => {
            const user = { id: 1, type: Constants.USERS.TYPE.CUSTOMER };
            const request = { referenceId: `dupReferenceId` };
            LoanModel.findOne.mockReturnValueOnce(true);
            const loanController = new LoanController(user);

            try {
                await loanController.create({ referenceId: `dupReferenceId` });
            } catch(error) {
                expect(error instanceof RequestError).toBe(true);
                expect(RequestError).toBeCalledWith(409, 'Loan with reference ID already exists');
            }
        
            expect(LoanModel.findOne).toBeCalledTimes(1);
            expect(LoanModel.findOne).toBeCalledWith({ 
                customerId: user.id, referenceId : request.referenceId 
            });
        });

        test('creates a new loan and returns the prepared response', async () => {
            const user = { id: 1, type: Constants.USERS.TYPE.CUSTOMER };
            const request = { referenceId: `someReferenceId`, amount: 10, terms: 2 };
            const loanObj = {
                id: 1,
                customerId: user.id,
                referenceId: request.referenceId,
                amount: request.amount,
                balance: request.amount,
                terms: request.terms,
                applicationDate: new Date(),
                insert: jest.fn()
            };
            LoanModel.findOne.mockReturnValueOnce(false);
            LoanModel.mockReturnValueOnce(loanObj);
            const loanController = new LoanController(user);
            
            const result = await loanController.create(request);
            
            expect(LoanModel).toBeCalledTimes(1)
            expect(LoanModel).toBeCalledWith({
                customerId: user.id,
                referenceId: request.referenceId,
                amount: request.amount,
                balance: request.amount,
                terms: request.terms
            });
            expect(loanObj.insert).toBeCalledTimes(1);
            for (const [key, value] of Object.entries(loanObj)) {
                expect(result[key]).toStrictEqual(value);
            }
          });
        });

  
    describe('pay', () => {
        test('Should throw RequestError if user is not a customer', async() => {
            const user = { id: 1, type: Constants.USERS.TYPE.ADMIN };
            const loanController = new LoanController(user);

            try {
                await loanController.pay(1, 10);
            } catch(error) {
                expect(error instanceof RequestError).toBe(true);
                expect(RequestError).toBeCalledWith(401);
            }
        });

        test('Should throw RequestError if a pending loan is not found', async () => {
            const user = { id: 1, type: Constants.USERS.TYPE.CUSTOMER };
            LoanModel.findOne.mockReturnValueOnce(null);
            const loanController = new LoanController(user);

            try {
                await loanController.pay(1, 1000);
            } catch(error) {
                expect(error instanceof RequestError).toBe(true);
                expect(RequestError).toBeCalledWith(400, `No loan found for payment`);
            }
        });
        
        test('Should throw RequestError if loan balance is less than the payment amount', async () => {
            const user = { id: 1, type: Constants.USERS.TYPE.CUSTOMER };
            const loan = { balance: 500 };
            LoanModel.findOne.mockReturnValueOnce(loan);
            const loanController = new LoanController(user);

            try {
                await loanController.pay(1, 1000);
            } catch(error) {
                expect(error instanceof RequestError).toBe(true);
                expect(RequestError).toBeCalledWith(400, 'Amount more than pending balance');
            }
            
        });

        test('Should throw RequestError if amount less than installment due', async () => {
            const user = { id: 1, type: Constants.USERS.TYPE.CUSTOMER };
            const installment1 = { dueAmount: 250, dueDate: new Date(), status: 'pending', update: jest.fn() };
            const installment2 = { dueAmount: 250, dueDate: new Date(), status: 'pending', update: jest.fn() };
            const loan = { balance: 500, installments: [installment1, installment2] };
            LoanModel.findOne.mockReturnValueOnce(loan);
            const loanController = new LoanController(user);

            try {
                await loanController.pay(1, 200);
            } catch(error) {
                expect(error instanceof RequestError).toBe(true);
                expect(RequestError).toBeCalledWith(400, 'Installment amount must not be less than the due amount');
            }
        });
        
        test('Should mark installments advanced if fully paid before and reduce due amount if partially paid', async () => {
            const user = { id: 1, type: Constants.USERS.TYPE.CUSTOMER };
            const installment1 = { dueAmount: 200, dueDate: new Date(), status: 'pending', paymentDate: null, update: jest.fn() };
            const installment2 = { dueAmount: 200, dueDate: new Date(), status: 'pending', update: jest.fn() };
            const installment3 = { dueAmount: 200, dueDate: new Date(), status: 'pending', update: jest.fn() };
            const loan = { balance: 600, installments: [installment1, installment2, installment3], update: jest.fn() };
            LoanModel.findOne.mockReturnValueOnce(loan);
            Helper.round.mockReturnValueOnce(installment1.dueAmount).mockReturnValueOnce(installment2.dueAmount);
            const loanController = new LoanController(user);
            
            await loanController.pay(1, 500);
            
            expect(installment1.amount).toBe(500);
            expect(installment1.status).toBe(`paid`);
            expect(installment1.paymentDate).not.toBe(null);
            expect(installment2.status).toBe(`pending`);
            expect(installment2.dueAmount).toBe(100);
            expect(installment3.status).toBe(`advanced`);
            expect(installment3.dueAmount).toBe(0);
            expect(installment1.update).toBeCalledTimes(1);
            expect(installment2.update).toBeCalledTimes(1);
            expect(installment3.update).toBeCalledTimes(1);
        });

        test('Should mark loan status in paid if full balance is paid', async () => {
            const user = { id: 1, type: Constants.USERS.TYPE.CUSTOMER };
            LoanModel.STATUS = { PAID: 'paid' };
            const installment = { dueAmount: 500, dueDate: new Date(), status: 'pending', paymentDate: null, update: jest.fn() };
            const loan = { balance: 500, installments: [installment], update: jest.fn() };
            LoanModel.findOne.mockReturnValueOnce(loan);
            Helper.round.mockReturnValueOnce(installment.dueAmount);
            const loanController = new LoanController(user);
            
            await loanController.pay(1, 500);
            
            expect(loan.balance).toBe(0);
            expect(loan.status).toBe(LoanModel.STATUS.PAID);
            expect(loan.update).toBeCalledTimes(1);
        });

        test('Should mark loan status in progress if partial amount is paid', async () => {
            const user = { id: 1, type: Constants.USERS.TYPE.CUSTOMER };
            LoanModel.STATUS = { IN_PROGRESS: 'in_progress' };
            const installment = { dueAmount: 100, dueDate: new Date(), status: 'pending', paymentDate: null, update: jest.fn() };
            const loan = { balance: 500, installments: [installment], update: jest.fn() };
            LoanModel.findOne.mockReturnValueOnce(loan);
            Helper.round.mockReturnValueOnce(installment.dueAmount);
            const loanController = new LoanController(user);
            
            await loanController.pay(1, 100);
            
            expect(loan.balance).toBe(400);
            expect(loan.status).toBe(LoanModel.STATUS.IN_PROGRESS);
            expect(loan.update).toBeCalledTimes(1);
        });
    });
  
    describe('get', () => {
        test('Should throw RequestError if user is not a customer or admin', async () => {
            const user = { id: 1, type: `NotCustomerNotAdmin` };
            const loanController = new LoanController(user);
            
            try {
                await loanController.get([])
            } catch(error) {
                expect(error instanceof RequestError).toBe(true);
                expect(RequestError).toBeCalledWith(401);
            }
        });
        
        test('Should fetch loans for the customer only', async () => {
            const user = { id: 1, type: Constants.USERS.TYPE.CUSTOMER };
            const loan = { id: 1, referenceId: `ref1`, customerId: user.id, applicationDate: new Date(), terms: 2 }
            LoanModel.findAll.mockReturnValueOnce([loan]);
            const loanController = new LoanController(user);
            
            const result = await loanController.get();
            
            expect(LoanModel.findAll).toBeCalledTimes(1);
            expect(LoanModel.findAll).toBeCalledWith({ customerId: user.id });
        });

        test('Should fetch loans for all customers for admin', async () => {
            const user = { id: 1, type: Constants.USERS.TYPE.ADMIN };
            const loan = { id: 1, referenceId: `ref1`, customerId: user.id, applicationDate: new Date(), terms: 2 }
            LoanModel.findAll.mockReturnValueOnce([loan]);
            const loanController = new LoanController(user);
            
            const result = await loanController.get();
            
            expect(LoanModel.findAll).toBeCalledTimes(1);
            expect(LoanModel.findAll).toBeCalledWith({});
        });

        test('Should fetch loans for passed loanIds', async () => {
            const customer = { id: 1, type: Constants.USERS.TYPE.CUSTOMER };
            const admin = { id: 2, type: Constants.USERS.TYPE.ADMIN };
            const loan = { id: 1, referenceId: `ref1`, customerId: customer.id, applicationDate: new Date(), terms: 2 }
            LoanModel.findAll.mockReturnValueOnce([loan]).mockReturnValueOnce([loan]);
            const customerLoanController = new LoanController(customer);
            const adminLoanController = new LoanController(admin);
            
            await customerLoanController.get([1,2,3]);
            await adminLoanController.get([1,2,3]);
            
            expect(LoanModel.findAll).toBeCalledTimes(2);
            expect(LoanModel.findAll).nthCalledWith(1, { customerId: customer.id, id: { $in: [1,2,3] } });
            expect(LoanModel.findAll).nthCalledWith(2, { id: { $in: [1,2,3] } });
        });
    });
  
    describe('approveOrDeny', () => {
        test('Should throw RequestError if user is not an admin', async () => {
            const user = { id: 1, type: Constants.USERS.TYPE.CUSTOMER };
            const loanController = new LoanController(user);

            try {
                await loanController.approveOrDeny([1,2,3], true);
            } catch(error) {
                expect(error instanceof RequestError).toBe(true);
                expect(RequestError).toBeCalledWith(401);
            }
            
        });

        test('Should check for pending loans and throw RequestError if not found', async () => {
            const user = { id: 1, type: Constants.USERS.TYPE.ADMIN };
            LoanModel.findAll.mockReturnValueOnce([{ id: 1, status: 'approved' }]);
            const loanController = new LoanController(user);

            let error;
            try {
                await loanController.approveOrDeny([1,2,3], true);
            } catch(err) {
                expect(error instanceof RequestError).toBe(true);
                expect(RequestError).toBeCalledWith(400, 'Invalid loan IDs specified: 1,2,3');
            }
            
            expect(LoanModel.findAll).toBeCalledTimes(1);
            expect(LoanModel.findAll).toBeCalledWith({ id: { $in: [1,2,3] } });
        });
        
        test('Should update loans with correct status and mark decision date', async() => {
            const user = { id: 1, type: Constants.USERS.TYPE.ADMIN };
            LoanModel.STATUS = { APPROVED: 'approved', DENIED: 'denied', PENDING: 'pending' };
            LoanModel.findAll
                .mockReturnValueOnce([{ id: 1, status: LoanModel.STATUS.PENDING }, { id: 2, status: LoanModel.STATUS.PENDING }])
                .mockReturnValueOnce([{ id: 3, status: LoanModel.STATUS.PENDING }, { id: 4, status: LoanModel.STATUS.PENDING }]);
            const loanController = new LoanController(user);
            
            await loanController.approveOrDeny([1, 2], true);
            await loanController.approveOrDeny([3, 4], false);

            
            expect(LoanModel.updateAll).toBeCalledTimes(2);
            expect(LoanModel.updateAll).nthCalledWith(1, [1,2], {
                status: `approved`,
                decisionDate: expect.any(Date)
            });
            expect(LoanModel.updateAll).nthCalledWith(2, [3,4], {
                status: `denied`,
                decisionDate: expect.any(Date)
            });
        });

        test('Should create installments for loan terms if loan approved', async () => {
            const user = { id: 1, type: Constants.USERS.TYPE.ADMIN };
            LoanModel.STATUS = { APPROVED: 'approved', PENDING: 'pending' };
            LoanModel.findAll
                .mockReturnValueOnce([
                    { id: 1, status: 'pending', terms: 3, balance: 100 }, 
                    { id: 2, status: 'pending', terms: 2, balance: 50 }
                ]);
            Helper.round
                .mockReturnValueOnce(33.333).mockReturnValueOnce(33.334)
                .mockReturnValueOnce(25).mockReturnValueOnce(25);
            Helper.getDateAfterWeeks.mockImplementation(n => n);
            const loanController = new LoanController(user);
            
            await loanController.approveOrDeny([1, 2], true);
            
            expect(InstallmentModel.insertAll).toBeCalledTimes(2);
            expect(InstallmentModel.insertAll).nthCalledWith(1, [
                { loanId: 1, dueAmount: 33.333, dueDate: 1 },
                { loanId: 1, dueAmount: 33.333, dueDate: 2 },
                { loanId: 1, dueAmount: 33.334, dueDate: 3 }
            ]);
            expect(InstallmentModel.insertAll).nthCalledWith(2, [
                { loanId: 2, dueAmount: 25, dueDate: 1 },
                { loanId: 2, dueAmount: 25, dueDate: 2 },
            ]);
        });
    });
});