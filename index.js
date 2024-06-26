//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require('path')
require('dotenv').config({path:path.resolve(__dirname,'./.env')})
const connectDB = require("./config/db");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy; // Google OAuth 2.0
const findOrCreate = require('mongoose-findorcreate'); // findOrCreate

connectDB();
const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

// Set up session
app.use(session({
secret:"Our little secret.",
resave: false,
saveUninitialized: false
}));

// Set up passport
app.use(passport.initialize());
app.use(passport.session());



//Create a new user schema
const userSchema = new mongoose.Schema( {
    email:  { type: String, unique: true },
    password: String,
    googleId: String,
    secret: [String]
    });

// Set up passport local mongoose
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);   // findOrCreate plugin

//Create a new user model
const User = new mongoose.model("User", userSchema);

// Set up passport local mongoose
passport.use(User.createStrategy());

// Set up passport local mongoose serialize and deserialize
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

// Google OAuth 2.0
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userprofileURL: "http://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    
    User.findOrCreate({ username: profile.displayName, googleId: profile.id }, function (err, user) {
return cb(err, user);
});
  }
));


// GET request
app.get("/", function(req, res){
res.render("home");  
  }
);

// Google OAuth 2.0
app.get("/auth/google",
    passport.authenticate("google", {scope: ["profile"]})
);

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  });


app.get("/register", function(req, res){
    res.render("register"); 
   }
    );
    
    app.get("/login", function(req, res){
        res.render("login");   
     }
        );

// GET request for secrets page
app.get("/secrets", function(req, res) {
    User.find({ secret: { $ne: null } })
      .then((foundUsers) => {
        if (foundUsers) {
          res.render("secrets", { usersWithSecrets: foundUsers });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });
  
// GET request for submit page

app.get("/submit", function(req, res){
    if(req.isAuthenticated()){
        res.render("submit");
    } else {
        res.redirect("/login");
    }
    });

    //post request for submit page
    app.post("/submit", function(req, res) {
        const submittedSecret = req.body.secret;
        User.findById(req.user.id)
          .then((foundUser) => {
            if (foundUser) {
              // foundUser.secret = submittedSecret;
               foundUser.secret.push(submittedSecret);
              return foundUser.save();
            }
            
          })
          .then(() => {
            res.redirect("/secrets");
          })
          .catch((err) => {
            console.log(err);
            
          });
         
      });
      





// POST request
app.post("/register", function(req, res){
   User.register({username: req.body.username}, req.body.password, function(err, user){
    if(err){
        console.log(err);
        res.redirect("/register");
    } else {
        passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets");
        });
    }

        });
    });
  

// Post request for login

// POST request
app.post("/login", function(req, res){
   const user = new User({
    username: req.body.username,
    password: req.body.password
   });
   req.login(user, function(err){
         if(err){
              console.log(err);
         } else {
              passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
              });
         }
        }); 

    });

// Post request for logout
app.get("/logout", function(req, res){

    req.logout(function(err){
        if(err){
            console.log(err);
        }
    });

    res.redirect("/");
    });

        app.listen(3000, function(){
            console.log("Server started on port 3000.");
          }
            );
