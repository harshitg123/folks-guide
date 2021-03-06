const mongoose = require('mongoose');

const userSchema = require('./Users');
const User = mongoose.model("Users", userSchema);

const schoolSchema = require('./Schools');
const School = mongoose.model("Schools", schoolSchema);

const profileSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  first_name:{
    type: String,
    required: true
  },
  last_name:{
    type: String,
    required: true
  },
  classroom: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
    required:true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: School,
    required:true
  }
});

module.exports = profileSchema;
