const APISpecs = require("../APISpecs");
const LoanController = require("../../controllers/Loan.controller");
const Validator = require("../../utils/Validator");


const CustomRouter = require("../../core/CustomRouter");
const router = CustomRouter.get();


router.post(`/`, Validator.getSpecValidator(APISpecs.customers.loans.create), async (req, res) => {
    const controller = new LoanController(req.user);
    const result = await controller.create(req.body);
    res.json(result);
});

router.patch(`/:loanId`, Validator.getSpecValidator(APISpecs.customers.loans.pay), async (req, res) => {
    const controller = new LoanController(req.user);
    const result = await controller.pay(Number(req.params.loanId), req.body.amount);
    res.json(result);
});

router.get(`/:loanId?`, Validator.getSpecValidator(APISpecs.customers.loans.get), async (req, res) => {
    const controller = new LoanController(req.user);
    let result;
    if (req.params.loanId) {
        result = await controller.get([Number(req.params.loanId)]);
    } else {
        result = await controller.get();
    }
    res.json(result);
});

module.exports = router;