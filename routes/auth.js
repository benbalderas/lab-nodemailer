const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const {send} = require('../helpers/mailer');
const User = require("../models/User");

// Signup the user
router.post("/signup", (req, res) => {
    // destructure the body
    const {username, email, password } = req.body;

    // Create random token
    const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let token = '';

    for (let i = 0; i < 25; i++) {
        token += characters[Math.floor(Math.random() * characters.length )];
    }
  
    // use bcrypt to hash the password 10 time
    bcrypt.hash(password, 10).then((hashPassword) => {
      // define user object
      const user = { username, email, password: hashPassword, confirmationCode: token };
      // define options to send in email
      let options = {
        email: user.email,
        subject: "Signup confirmation",
        username: user.username,
        message: "Thank you for joining our community, please confirm your account by clicking the button below:",
        confirmationURL: `http://localhost:3000/confirm/${user.confirmationCode}`
      }

      // degine the template for the email
      options.filename = "confirmation";
  
      // create user using the defined object
      User.create(user)
        .then(() => {
            // send the email
            send(options).then(() => {
                res.status(200).json({ msg: "User created and email sent" })
            }).catch(err => res.status(400).json(err))
        })
        .catch((err) => res.status(400).json(err));
    });
  });


  router.patch('/confirm/:confirmationCode', (req, res) => {
    const { confirmationCode } = req.params;

    // Find the user with the confirmation code
    User.findOne({confirmationCode: confirmationCode}).then((user) => {
        if(user.status === "Active") {
            res.status(400).json({msg: "This account has already been confirmed"})
        }
        // patch the user
        User.updateOne({confirmationCode: confirmationCode}, { $set: { status: "Active" }})
        .then(() => {
            res.status(200).json({ msg: "Great! We have confirmed you account" });
          })
    }).catch(err => res.status(400).json({err, msg: "Invalid token" }))
  });

  module.exports = router;