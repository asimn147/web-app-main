/** @format */

/********************************************************************************
 * WEB322 – Assignment 04
 *
 * I declare that this assignment is my own work in accordance with Seneca's
 * Academic Integrity Policy:
 *
 * https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 *
 * Name: Pamualdeep Kaur Mander Student ID: 160357216
 Cyclic Link: 
 *********************************************************************************/

const express = require("express");
const path = require("path");
const { Theme, Set, sequelize } = require('./sequelize');
const authData = require('./modules/auth-service');
const legoData = require("./modules/legoSets");
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const clientSessions = require('client-sessions');
const app = express();

const PORT = process.env.PORT || 8080;

app.use(express.static("public"));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGODB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(clientSessions({
  cookieName: 'session', 
  secret: 'top_secret_key', 
  duration: 24 * 60 * 60 * 1000, //  (24 hours)
  activeDuration: 15 * 60 * 1000, //  (15 minutes)
}));

// Middleware to make session data available in templates
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Middleware to ensure user is logged in
function ensureLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    res.redirect('/login');
  } else {
    next();
  }
}


app.get("/", (req, res) => {
  res.render("home");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get('/lego/addSet', async (req, res) => {
  try {
    const themes = await legoData.getAllThemes(); 
    res.render('addSet', { themes });
  } catch (err) {
    // Handle error and render 500 view
    res.render('500', { message: `We are sorry, but we have encountered the following error: ${err}` });
  }
});

app.post('/lego/addSet', ensureLogin, async (req, res) => {
  try {
    await legoData.addSet(req.body); 
    res.redirect('/lego/sets'); 
  } catch (err) {
    // Handle error and render 500 view
    res.render('500', { message: `Im sorry, but we have encountered the following error: ${err}` });
  }
});

app.get("/lego/sets", (req, res) => {
  if (req.query.theme) {
    legoData
      .getSetsByTheme(req.query.theme)
      .then((data) => res.render("sets", { sets: data })) 
      .catch((err) => res.status(404).render("404", { message: "No Sets found for a matching theme" }))
  } else {
    legoData
      .getAllSets()
      .then((data) => res.render("sets", { sets: data })) 
      .catch((err) => res.status(404).render("404", { message: "No Sets found" }))
  }
});

// GET route to serve "/lego/editSet/:num"
app.get('/lego/editSet/:num', async (req, res) => {
  try {
    const setNum = req.params.num;

    // Request set data and theme data using Promises
    const [set, themes] = await Promise.all([
      legoData.getSetByNum(setNum),
      legoData.getAllThemes()
    ]);

    // Render the "edit" view with theme and set data
    res.render('editSet', { themes, set });
  } catch (err) {
    // If there's an error, render the "404" view
    res.status(404).render('404', { message: err });
  }
});

// POST route to handle "/lego/editSet"
app.post('/lego/editSet', ensureLogin,  async (req, res) => {
  try {
    const setNum = req.body.set_num;
    const setData = req.body;

    // Make a request to edit the set using Promises
    await legoData.editSet(setNum, setData);

    // Redirect to "/lego/sets" on success
    res.redirect('/lego/sets');
  } catch (err) {
    // If there's an error, render the "500" view
    res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }
});


app.get("/lego/sets/:num", (req, res) => {
  legoData
    .getSetByNum(req.params.num)
    .then((data) => {
      fetch('https://api.quotable.io/random')
        .then(response => response.json())
        .then(quoteData => {
          res.render("set", { set: data, quote: quoteData });
        })
        .catch(error => {
          console.log("Error fetching quote: ", error);
          res.render("set", { set: data, quote: null });
        });
    })
    .catch((err) => {
      res.status(404).render("404", { message: "No Sets found for a specific set num" })
    });
});

// GET route to delete a set
app.get('/lego/deleteSet/:num', ensureLogin, async (req, res) => {
  try {
    const setNum = req.params.num;

    await legoData.deleteSet(setNum);

    // If successful, redirect to the "/lego/sets" route
    res.redirect('/lego/sets');
  } catch (err) {
    // If an error occurs, render the "500" view with an appropriate message
    res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }
});

// Render the login view
app.get('/login', (req, res) => {
  res.render('login', { errorMessage: null, userName: null });
});

// Render the register view
app.get('/register', (req, res) => {
  res.render('register', { successMessage: null, errorMessage: null, userName: null });
});

// Handle user registration
app.post('/register', (req, res) => {
  const userData = req.body;

  authData.registerUser(userData)
    .then(() => res.render('register', { successMessage: 'User created', errorMessage: null, userName: null }))
    .catch((err) => res.render('register', { successMessage: null, errorMessage: err, userName: req.body.userName }));
});

// Handle user login
app.post('/login', (req, res) => {
  req.body.userAgent = req.get('User-Agent'); // Set User-Agent in the request body

  authData.checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory,
      };
      res.redirect('/');
    })
    .catch((err) => res.render('login', { errorMessage: err, userName: req.body.userName }));
});

// Handle user logout
app.get('/logout', (req, res) => {
  req.session.reset(); // Reset the session
  res.redirect('/');
});

// Render the userHistory view
app.get('/userHistory', ensureLogin, (req, res) => {
  res.render('userHistory');
});

app.use((req, res, next) => {
  res.status(404).render("404", { message: "No view matched for this route" });
});

// Sync models with the database
sequelize.sync().then(() => {
  console.log('Database and tables synced!');
});

legoData
  .initialize()
  .then(authData.initialize)
  .then(() => app.listen(PORT, () => console.log(`listening on port ${PORT}`)))
  .catch((error) => console.log(`Failed to listen on port ${PORT}`));
