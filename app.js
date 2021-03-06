const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const phone = require('phone');
// const _ = require('lodash');

const saltRounds = 10;
const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json())

// app.use((req, res, next)=>{
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept, Authorization"
//   );
//   if(req.method === 'OPTIONS'){
//     res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET")
//     return res.status(200).json({});
//   }
//   next();
// })

mongoose.connect("mongodb://localhost:27017/apiDB", {useNewUrlParser:true, useUnifiedTopology:true, useFindAndModify: false});

///////////////////////////////////////////////////////// Models => Role, User, School, Profile /////////////////////////////////////////////////////

const roleSchema = require("./Schemas/Role");
const Role = mongoose.model("Roles", roleSchema);

const userSchema = require('./Schemas/Users');
const User = mongoose.model("Users", userSchema);

const schoolSchema = require('./Schemas/Schools');
const School = mongoose.model("Schools", schoolSchema);

const profileSchema = require('./Schemas/Profiles');
const Profile = mongoose.model("Profiles", profileSchema);

////////////////////////////////////////////////////////////////////// Roles ///////////////////////////////////////////////////////////////

app.get("/role", (req, res) => {
  Role.find({}, (err, roleFound) => {
    if(!err){
      if(roleFound){
        res.status(200).json({
          status: true,
          roles: roleFound.map(role => {
            return {
              _id: role.id,
              name: role.name,
              scopes: role.scopes
            }
          })
        })
      }else{
        res.status(403).json({
          status: false,
          errors:[{
            message: "Resource not found"
          }]
        })
      }
    }else{
      res.status(409).json({
        status: false,
        errors:[{
          message: "Something went wrong"
        }]
      })
    }
  })
});

app.post("/role", (req, res)=>{
  const role = new Role({
    _id: mongoose.Types.ObjectId(),
    name: req.body.name,
    scopes: req.body.scopes
  })

  role.save((err, results) => {
    if(err){
      res.status(500).json({
        status: "false",
        errors:[{
          massage: "Internal server error"
        }]
      })
    }else{
      console.log(results);
      res.status(201).json({
        status: true,
        message: "Created"
      })
    }
  })
});

app.patch("/role/:roleId", (req, res)=>{
  Role.updateOne({_id: req.params.roleId}, {$set: req.body }, function(err, result){
    if(err){
      console.log(err);
      res.status(412).json({
        status: "false",
        errors: [{
          message: "Something went wrong."
        }]
      })
    }else{
      res.status(200).json({
        status: "true",
        message: "successful"
      })
    }
  })
});

app.delete("/role/:roleId", (req, res)=>{
  Role.findByIdAndDelete({_id: req.params.roleId}, (err, result) => {
    if(!err){
      if(result){
        res.status(200).json({
          status: true,
          message: "Successfully removed"
        })
      }
    }else{
      res.status(412).json({
        status: false,
        errors:[{
          message: "Something Went Wrong!"
        }]
      })
    }
  })
});

///////////////////////////////////////////////////////////////////////// Users //////////////////////////////////////////////////////////////

app.post("/user/signin", (req, res) => {

  const username = req.body.email;
  const password = req.body.password;

  User.findOne({email: username}, (err, result) => {
    if(!err){
        if(result){
          console.log(result.password);
          bcrypt.compare(password, result.password, (err, matched) => {

            if(matched){
              res.status(200).json({
                status: true,
                result: {
                  user:{
                    _id: result._id,
                    first_name: result.first_name,
                    last_name: result.last_name,
                    email: result.email,
                    roleId: result.roleId,
                    mobile: result.mobile,
                    role:{
                      _id: result.role._id,
                      name: result.role.name,
                      scopes: result.role.scopes
                    }
                  }
                }
              })
            }else{
              res.status(400).json({
                status: "false",
                error: [{
                  message: "something went wrong."
                }]
              })
            }
           })
        }else{
          res.status(403).json({
            status: true,
            message: "User Not Found!"
          })
        }
    }else{
      res.status(412).json({
        status: false,
        errors: [{
          message: "Something went wrong."
        }]
      })
    }
  })
});

app.post("/user/signup", (req, res) => {

  User.find({email: req.body.email}, (err, matched)=>{
    if(matched.length >= 1){
      res.status(200).json({
        status: "false",
        errors: [{
          message: "User already exist, Bad Request."
        }]
      })
    }
    else{
      let phoneNum = req.body.mobile;
      const password = req.body.password;
      let email;
      const emailToValidate = req.body.email;
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

      if(emailRegex.test(emailToValidate)){
        console.log("verified");
        email = emailToValidate;
      }else{
        return res.status(400).json({
          status: "false",
          errors: [{
            message: "Enter Correct email address"
          }]
        })
      }

        if(phone(phoneNum).length >= 1){
          phoneNum = phone(phoneNum);

        }else{
          return res.status(400).json({
            status: "false",
            errors: [{
              message: "Enter Correct mobile number with country code, i.e for India +91xxxxxxxxxx"
            }]
          })
        }

      bcrypt.hash(password, saltRounds, (err, hash)=>{
        if(!err){
          Role.findById({_id: req.body.roleId}, (err, foundRole) => {
            const user = new User ({
              _id: mongoose.Types.ObjectId(),
              first_name:  req.body.first_name,
              last_name: req.body.last_name,
              email: email,
              password: hash,
              mobile: phoneNum,
              roleId: req.body.roleId,
              role: foundRole
            })

            user.save((err, result) => {
            if(!err){
              res.status(201).json({
                status: true
              })
            }else{
              res.status(409).json({
                status: false,
                errors: [{
                  message: "Something went wrong."
                }]
              })
            }
          })
        })
        }else{
          res.status(400).json({
            status: false,
            errors: [{
              message: "Something went wrong."
            }]
          })
        }
      })
    }
  })
});

app.get("/user", (req, res) => {
  User.find({}, (err, foundResult)=>{
    if(!err){
      if(foundResult.length >= 1){
        res.status(200).json({
          status: true,
          content: {
            data: foundResult.map(result =>{
              return{
                _id: result._id,
                first_name: result.first_name,
                last_name: result.last_name,
                email: result.email,
                roleId: result.roleId,
                mobile: result.mobile
              }
            })
          }
        })
      }else{
        res.status(404).json({
          status: "false",
          message: "Not Found"
        })
      }
    }else{
      res.status(412).json({
        status: "false",
        errors: [{
          message: "Something went wrong."
        }]
      })
    }
  })
});

app.get("/user/:userId", (req, res) => {
  User.find({_id: req.params.userId}, (err, found)=>{
    if(!err){
      if(found.length >= 1){
        console.log(found);
        res.status(200).json({
          status: true,
          content: {
            data: found
          }
        })
      }else{
        res.status(200).json({
          message: "User not found"
        })
      }
    }else{
      res.status(412).json({
        status: "false",
        errors:[{
          message: "Something went wrong."
        }]
      })
    }
  })
});

app.patch("/user/:userId", (req, res) => {

  function hashPassword(){

    plainTextPassword = req.body.password;
    delete req.body.password;

    bcrypt.hash(plainTextPassword, saltRounds, (err, hash)=>{
      if(!err){
        User.findByIdAndUpdate(req.params.userId, { password: hash }, (err, doc)=>{
          if(err){
            return false;
          }
        })
      }else{
        res.status(500).json({
          status: false,
          error: [{
            message: "Something went wrong"
          }]
        })
      }
    })
    return true
  }

 function updateRest(){
    User.updateOne({_id: req.params.userId}, {$set: req.body}, (err, result)=>{
      if(err){
        return false;
      }
    })
    return true
  }

  let passCheck;
  let restCheck;

  if(req.body){
    [req.body].forEach(updates =>{
      if('password' in updates){
        passCheck = hashPassword();

        if(!Object.keys(req.body).length < 1){
          restCheck = updateRest();

          if(passCheck && restCheck){
            res.status(200).json({
              status: "true"
            })
          }else{
            res.status(500).json({
              status: "false"
            })
          }
        }else{
          if(passCheck){
            res.status(200).json({
              status: "true"
            })
          }else{
            res.status(500).json({
              status: "false"
            })
          }
        }
      }else{
        restCheck = updateRest();
        if(restCheck){
          res.status(200).json({
            status: "true"
          })
        }else{
          res.status(500).json({
            status: "false"
          })
        }
      }
    })
  }
});

app.delete("/user/:userId", (req, res) => {
  User.findByIdAndDelete({_id: req.params.userId}, (err, result) => {
    if(!err){
      if(result){
        res.status(200).json({
          status: true,
          message: "Sussfully removed"
        })
      }
    }else{
      res.status(404).json({
        status: false,
        errors: [{
          message: "Something Went Wrong!"
        }]
      })
    }
  })
});

////////////////////////////////////////////////////////////////////////// Schools ////////////////////////////////////////////////////////////

app.get("/school", (req, res) => {
  School.find({}, (err, results) =>{
    if(!err){
      if(results.length>=1){
        res.status(200).json({
          status: "true",
          content: {
            data: results
          }
        })
      }else{
        res.status(200).json({
          status: "true",
          message: "School Not Found"
        })
      }
    }else{
      res.status(404).json({
        status: "false",
        errors: [
          {
            message: "Something went wrong."
          }
        ]
      })
    }
  })
});

app.get("/school/:schoolId/students", (req, res) => {
  School.findOne({ _id: req.params.schoolId }, (err, found) =>{
    console.log(found);
    if(!err){
      Profile.find({schoolId: req.params.schoolId}, (err,result)=>{
        if(!err){
          if(found){
            res.status(200).json({
              status: "true",
              content:{
                data:[
                  {
                    _id: found._id,
                    name: found.name,
                    city: found.city,
                    state: found.state,
                    country: found.country,
                    students: result
                  }
                ]
              }
            })
          }else{
            res.status(200).json({
              message: "School Not Found"
            })
          }
        }
      })
    }else{
      res.status(404).json({
        status: "false",
        errors: [
          {
            message: "Something went wrong."
          }
        ]
      })
    }
  })
});

app.post("/school", (req, res) => {


  const school = new School({
    _id: mongoose.Types.ObjectId(),
    name: req.body.name,
    city: req.body.city,
    state: req.body.state,
    country: req.body.country
  })
  school.save((err, result) => {
    if(!err){
      res.status(201).json({
        status: "true",
        message: "School added."
      })
    }else{
      res.status(500).json({
        status: "false",
        errors: [
          {
            message: "Something went wrong."
          }
        ]
      })
    }
  })
});

app.patch("/school/:schoolId", (req, res) => {

  School.updateOne({_id: req.params.schoolId}, {$set: req.body }, function(err, result){
    if(err){
      console.log(err);
      res.status(500).json({
        status: false,
        errors: [
          {
            message: "Something went wrong."
          }
        ]
      })
    }else{
      res.status(200).json({
        status: "true",
        message: "Updated"
      })
    }
  })
});

/////////////////////////////////////////////////////////////////////////// Profile //////////////////////////////////////////////////////////

app.get("/profile", (req,res) => {
  Profile.find({}, (err, foundProfiles)=>{
    if(!err){
      if(foundProfiles){
        res.status(200).json({
          status: true,
          content:{
            data: foundProfiles
          }
        })
      }else{
        res.status(500).json({
          status: false,
          error:{
            message: "Profiles not found."
          }
        })
      }
    }
  })
});

app.post("/profile", (req,res) => {

  const student = new Profile ({
    _id: mongoose.Types.ObjectId(),
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    classroom: req.body.classroom,
    userId: req.body.userId,
    schoolId: req.body.schoolId
  })

  student.save((err) => {
    if(!err){
      res.status(201).json({
        status: true,
        message: "Successfully added profile."
      })
    }else{
      res.status(500).json({
        status: false,
        error: err
      })
    }
  })
});

////////////////////////////////////////////////// Handling errors for undifined routes //////////////////////////////////////////////////////////

app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
})

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  });
});

app.listen(3000, (req, res) => console.log("server started on port 3000"))
