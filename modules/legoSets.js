/** @format */

const setData = require("../data/setData");
const themeData = require("../data/themeData");
const { Theme, Set, sequelize } = require('../sequelize');

let sets = [];

const initialize = () => {
  return new Promise((resolve, reject) => {
    sequelize
      .sync()
      .then(() => {
        console.log('Database synced successfully');
        resolve();
      })
      .catch((error) => {
        console.error('Unable to sync the database:', error);
        reject(error);
      });
  });
};



const getAllSets = async () => {
  try {
    const sets = await Set.findAll({ include: [Theme] });
    return sets;
  } catch (error) {
    throw new Error("Unable to fetch sets");
  }
};

const getSetByNum = async (setNum) => {
  try {
    const set = await Set.findOne({ where: { set_num: setNum }, include: [Theme] });
    if (set) return set;
    throw new Error(`No set found with id of ${setNum}`);
  } catch (error) {
    throw new Error(`Unable to find requested set: ${error.message}`);
  }
};

const getSetsByTheme = async (theme) => {
  try {
    const sets = await Set.findAll({
      include: [Theme],
      where: {
        '$Theme.name$': {
          [Sequelize.Op.iLike]: `%${theme}%`
        }
      }
    });

    if (sets.length > 0) return sets;
    throw new Error(`No sets found with theme of ${theme}`);
  } catch (error) {
    throw new Error(`Unable to find requested sets: ${error.message}`);
  }
};

// Function to add a new set
const addSet = async (setData) => {
  try {
    // Use the Set model to create a new set
    await Set.create(setData);
    return Promise.resolve(); // Resolve the Promise on success
  } catch (err) {
    // Check if err.errors exists before accessing it
    const errorMessage = err.errors ? err.errors[0].message : err.message;
    // Reject the Promise with the error message
    return Promise.reject(errorMessage);
  }
};


// Function to get all themes
const getAllThemes = async () => {
  try {
    // Use the Theme model to find all themes
    const themes = await Theme.findAll();
    return Promise.resolve(themes);
  } catch (err) {
    // Reject the Promise with the error message
    return Promise.reject(err.message);
  }
};


const editSet = async (setNum, setData) => {
  try {
    // Use the Set model to find and update the set
    const result = await Set.update(setData, {
      where: { set_num: setNum }
    });

    if (result[0] > 0) {
      // If at least one row is affected, resolve the Promise
      return Promise.resolve();
    } else {
      // If no rows are affected, reject with an error message
      return Promise.reject("Unable to find and update the requested set");
    }
  } catch (err) {
    const errorMessage = err.errors ? err.errors[0].message : err.message;
    // Reject the Promise with the first error message
    return Promise.reject(errorMessage);
  }
};


const deleteSet = async (setNum) => {
  try {
    // Use the Set model to find and delete the set
    const result = await Set.destroy({
      where: { set_num: setNum }
    });

    if (result > 0) {
      // If at least one row is affected, resolve the Promise
      return Promise.resolve();
    } else {
      // If no rows are affected, reject with an error message
      return Promise.reject("Unable to find and delete the requested set");
    }
  } catch (err) {
    // Reject the Promise with the first error message
    return Promise.reject(err.errors[0].message);
  }
};


// Export the functions to make them available to server.js

module.exports = {
  initialize,
  getAllSets,
  getSetByNum,
  getSetsByTheme,
  addSet,
  getAllThemes,
  editSet,
  deleteSet,
  // other functions...
};


