const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require('express-validator');

const User = require("../models/Auth");
const { userValidationRules, validate } = require("../validator");

const maxAge = 3 * 24 * 60 * 60;

router.get("/signup", (req, res) => {
  res.render("signup");
});

router.get("/login", (req, res) => {
  res.render("login");
});

router.post("/signup", userValidationRules(), validate, async (req, res) => {
  const { username, email, password } = req.body;
  try {
    // check if email already in db
    const userExists = await User.findOne({ email: email });
    if (userExists) {
      return res
        .status(400)
        .json({ errors: { email: "That email is already taken" } });
    }
    // create new user object
    const user = new User({
      username,
      email,
      password,
    });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const payload = { user: user._id };
    const token = jwt.sign(payload, "poiuytrewq", { expiresIn: maxAge });
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge });
    res.status(201).json({ user: payload });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err: err });
  }
});

router.post('/login', [
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'Please enter a valid password').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        let validationErrors = { email: "", password: "", incorrect: ""};
        errors.array().map(err => {
            validationErrors[err.param] = err.msg;
        });
        return res.status(400).json({ errors: validationErrors });
    }

    const { email, password } = req.body;
    try{
        let user = await User.findOne({ email });
        if(!user){
            return res.status(400).json({ errors: { email: "Email doesn't exist" }});
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({ errors: { password: "Password is incorrect" } });
        }

        const payload = { user: user._id };
        const token = jwt.sign(payload, "poiuytrewq", { expiresIn: maxAge });
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge });
        res.status(200).json({ user: payload });
    } catch(err) {
        console.log(err);
        res.status(500).json({ err: err });
    }
});

router.get('/logout', (req, res) => {
    res.cookie('jwt', '', { maxAge: 1 });
    res.redirect('/');
});


module.exports = router;
