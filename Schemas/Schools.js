const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name:{
    type: String,
    required: true
  },
  city:{
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  }
});

module.exports = schoolSchema;
