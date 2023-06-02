const User = require("../../middlewares/User.middleware");
const Constants = require("../../utils/Constants");
const Validator = require("../../utils/Validator");
const loanAPI = require("./loans");


const CustomRouter = require("../../core/CustomRouter");
const APISpecs = require("../APISpecs");
const router = CustomRouter.get();


router.use(User.authenticate(Constants.USERS.TYPE.ADMIN));

router.use(`/:userId/loans`, Validator.getSpecValidator(APISpecs.admins.base), loanAPI);


module.exports = router;
