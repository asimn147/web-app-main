// Import required modules
const Sequelize = require('sequelize');
require('dotenv').config();

// Create Sequelize object
const { DB_USER, DB_DATABASE, DB_PASSWORD, DB_HOST } = process.env;


const sequelize = new Sequelize(DB_DATABASE, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, 
    },
  },
  define: {
    timestamps: false, 
  },
});

// Define Theme model
const Theme = sequelize.define('Theme', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING,
  },
});

// Define Set model
const Set = sequelize.define('Set', {
  set_num: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
  },
  year: {
    type: Sequelize.INTEGER,
  },
  num_parts: {
    type: Sequelize.INTEGER,
  },
  theme_id: {
    type: Sequelize.INTEGER,
  },
  img_url: {
    type: Sequelize.STRING,
  },
});

// Set association between Set and Theme
Set.belongsTo(Theme, { foreignKey: 'theme_id' });

// Export the models and sequelize for use in other files
module.exports = {
  Theme,
  Set,
  sequelize,
};
