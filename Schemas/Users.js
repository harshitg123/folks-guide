const mongoose = require('mongoose');
const roleSchema = require("./Role");
const Role = mongoose.model("Roles", roleSchema);

const userSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  first_name:{
    type: String,
    required: true
  },
  last_name:{
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  },
  mobile: [{
    type: String,
    required: true
  }],
  password: {
    type: String,
    required: true
  },
  roleId: {
    type: mongoose.Types.ObjectId,
    ref: Role,
    required: true
  }
});

module.exports = userSchema;
