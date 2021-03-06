const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name:{
    type: String,
    required: true
  },
  scopes: [{
    type: String,
    required: true
  }],
  createdDate: String,
  updatedDate: String
});

module.exports = roleSchema;
