const User = require("../../middlewares/User.middleware");
const APISpecs = require("../APISpecs");
const Constants = require("../../utils/Constants");
const loanAPI = require("./loans");
const Validator = require("../../utils/Validator");


const CustomRouter = require("../../core/CustomRouter");
const router = CustomRouter.get();

router.use(User.authenticate(Constants.USERS.TYPE.CUSTOMER));

router.use(`/:userId/loans`, Validator.getSpecValidator(APISpecs.customers.base), loanAPI);

module.exports = router;