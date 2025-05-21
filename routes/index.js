var express = require('express');
var router = express.Router();
const userModel = require('./users');
const postModel = require('./post');
const passport = require('passport');
const localStrategy = require('passport-local');
const upload = require('./multer');


// Passport.js setup
passport.use(new localStrategy(userModel.authenticate()));

// Home route
router.get('/', function(req, res, next) {
  res.render('index', { nav: false , error: null }); // Pass 'error' as null by default
});


// Registration route
router.get('/register', function (req, res) {
  res.render('register', { nav: false , error: null }); // Pass error as null initially
});

// Profile route (protected)
router.get('/profile', isLoggedIn,  async function (req, res, next) {
  const user = 
  await userModel
      .findOne({username: req.session.passport.user})
      .populate("posts")
       
  res.render('profile', {user, nav: true});
});

router.get('/show/posts', isLoggedIn, async function (req, res, next) {
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts");

  res.render('show', { user, nav: true });
});

// Redirect /show to /show/posts
router.get('/show', (req, res) => {
  res.redirect('/show/posts');
});

router.get('/feed', isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user});
  const posts = await postModel.find()
  .populate("user");

  res.render("feed", {user, posts , nav : true}); 
});

 


router.get('/add', isLoggedIn,  async function (req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user});
  res.render('add', {user, nav: true});
});

router.get('/createpost', isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render('createpost', { user, nav: true });
});


router.post('/createpost', isLoggedIn, upload.single("postimage") ,async function (req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user});
  const post = await postModel.create({
    user : user._id,
    title : req.body.title,
    description : req.body.description,
    image : req.file.filename
  });

  user.posts.push(post._id),
  await user.save();
  res.redirect("/profile");
});

router.post('/fileupload', isLoggedIn, upload.single("image") , async function (req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user});
  user.profileImage = req.file.filename;
  await user.save();
  res.redirect("/profile");
});

// Registration POST route
router.post('/register', async (req, res) => {
  try {
    // Check if the username already exists
    const existingUser = await userModel.findOne({ username: req.body.username });
    if (existingUser) {
      return res.render('register', { error: 'A user with this username already exists.' });
    }

    // Create a new user
    const newUser = new userModel({
      username: req.body.username,
      email: req.body.email,
      contact: req.body.contact,
      name : req.body.fullname 
    });

    // Register the user with a hashed password
    await userModel.register(newUser, req.body.password);

    // Authenticate and redirect
    passport.authenticate('local')(req, res, (err) => {
      if (err) {
        console.error(err);
        return res.render('register', { error: 'Authentication failed. Please try again.' });
      }
      res.redirect('/profile');
    });
  } catch (err) {
    console.error(err);
    res.render('register', { error: 'An unexpected error occurred. Please try again.' });
  }
});

// Login POST route
router.post(
  '/login',
  passport.authenticate('local', {
    failureRedirect: '/',
    successRedirect: '/profile',
  })
);

// Logout POST route
router.post('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

// Middleware to check if a user is authenticated
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

module.exports = router;
