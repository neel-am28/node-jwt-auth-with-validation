const { check, validationResult } = require('express-validator');

const userValidationRules = () => {
    return [
        check('username')
            .isLength({ min: 4 }).withMessage('Minimum username length is 4 characters'),
        check('email')
            .isEmail().withMessage('Please enter a valid email'),
        check('password')
            .isLength({ min: 6, max: 10 }).withMessage('Password length should be between 6 & 10 characters')  
            .custom((value, { req, location, path }) => {
                if(value !== req.body.cpassword) {
                    return false;
                } else{
                    return true;
                }
            }).withMessage("Passwords don't match") 
    ]
}

const validate = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        let validationErrors = { username: "", email: "", password: ""};
        errors.array().map(err => {
                validationErrors[err.param] = err.msg;
        });
        return res.status(400).json({
            errors: validationErrors
        });
    }
    next();
}
module.exports = {
    userValidationRules,
    validate,
  }