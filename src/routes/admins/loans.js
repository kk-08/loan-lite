const APISpecs = require("../APISpecs");
const LoanController = require("../../controllers/Loan.controller");
const Validator = require("../../utils/Validator");


const CustomRouter = require("../../core/CustomRouter");
const router = CustomRouter.get();


router.get(`/:loanId?`, Validator.getSpecValidator(APISpecs.admins.loans.get), async (req, res, next) => {
    const controller = new LoanController(req.user);
    let result;
    if (req.params.loanId) {
        result = await controller.get([Number(req.params.loanId)]);
    } else {
        result = await controller.get();
    }
    res.json(result);
});

router.patch(`/:loanId`, Validator.getSpecValidator(APISpecs.admins.loans.approve), async (req, res, next) => {
    const controller = new LoanController(req.user);
    const result = await controller.approveOrDeny([Number(req.params.loanId)], req.body.approval);
    res.json(result);
});


module.exports = router;