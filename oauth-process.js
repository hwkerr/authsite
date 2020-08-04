/* How to set up OAuth 2.0 (Google) with Passport.js

   Partial code examples also found here:
      http://www.passportjs.org/packages/passport-google-oauth20/
*/

///////////////////////// 1. Required Modules for Authentication /////////////////////////

require("dotenv").config();

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");


///////////////////////// 2. Express.js plugins /////////////////////////

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// mongoose.connect...


///////////////////////// 3. Mongoose Schema/Model setup /////////////////////////

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);


///////////////////////// 4. Passport setup /////////////////////////

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


///////////////////////// 5. Google OAuth definition /////////////////////////

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://www.example.com/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


///////////////////////// Google OAuth routes /////////////////////////

// Access this route with a login button in the webapp
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

// Authorized Redirect URI (set up in Google's Dev Console)
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });


///////////////////////// Authenticated Access Demo /////////////////////////

app.get("/", function(req, res) {
  if (req.isAuthenticated())
    res.render("private");
  else
    res.redirect("/login");
});
