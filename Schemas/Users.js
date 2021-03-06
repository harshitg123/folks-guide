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
    required: true
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
  },
  role: roleSchema
});

module.exports = userSchema;
