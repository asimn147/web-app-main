// auth-service.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

require('dotenv').config();

const Schema = mongoose.Schema;

// Define userSchema
const userSchema = new Schema({
  userName: { type: String, unique: true },
  password: String,
  email: String,
  loginHistory: [
    {
      dateTime: Date,
      userAgent: String,
    },
  ],
});

// Initialize User model
let User; // to be defined on new connection (see initialize)

// Function to initialize the User model
function initialize() {
  User = mongoose.model('User', userSchema);
}

// Function to create a new connection and initialize User
function initialize() {
  return new Promise(function (resolve, reject) {
    let db = mongoose.createConnection(process.env.MONGODB);

    db.on('error', (err) => {
      reject(err); // reject the promise with the provided error
    });

    db.once('open', () => {
      console.log('Connected with mongo-db')
      User = db.model('users', userSchema);
      resolve();
    });
  });
}

// Function to register a new user
function registerUser(userData) {
  return new Promise(async function (resolve, reject) {
    if (userData.password !== userData.password2) {
      reject('Passwords do not match');
    } else {

      // Hash the user's password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Update userData with the hashed password
      userData.password = hashedPassword;

      let newUser = new User(userData);

      newUser.save()
        .then(() => resolve())
        .catch((err) => {
          if (err.code === 11000) {
            reject('User Name already taken');
          } else {
            reject(`There was an error creating the user: ${err}`);
          }
        });
    }
  });
}


// Function to check user credentials
function checkUser(userData) {
  return new Promise(async function (resolve, reject) {
    try {
      const users = await User.find({ userName: userData.userName });

      if (users.length === 0) {
        reject(`Unable to find user: ${userData.userName}`);
        return;
      }

      const passwordMatch = await bcrypt.compare(userData.password, users[0].password);

      if (!passwordMatch) {
        reject(`Incorrect Password for user: ${userData.userName}`);
        return;
      }

      // Update login history
      if (users[0].loginHistory.length === 8) {
        users[0].loginHistory.pop();
      }

      users[0].loginHistory.unshift({
        dateTime: new Date().toString(),
        userAgent: userData.userAgent,
      });

      await User.updateOne(
        { userName: users[0].userName },
        { $set: { loginHistory: users[0].loginHistory } }
      );

      resolve(users[0]);
    } catch (err) {
      reject(`There was an error verifying the user: ${err}`);
    }
  });
}


// Export the module
module.exports = { initialize, registerUser, checkUser };
