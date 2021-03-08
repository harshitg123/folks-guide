
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const phone = require('phone');
const jwt = require('jsonwebtoken');
const jwtCheck = require('./middleware/check-auth.js')
// const _ = require('lodash');

const saltRounds = 10;
const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json())

app.use((req, res, next)=>{
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if(req.method === 'OPTIONS'){
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET")
    return res.status(200).json({});
  }
  next();
})

mongoose.connect("mongodb://localhost:27017/apiDB", {useNewUrlParser:true, useUnifiedTopology:true, useFindAndModify: false, useCreateIndex: true});

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

app.get("/role", jwtCheck, (req, res) => {

  const scopes = req.userData.user.role.scopes;
  let scopePresent = false;

  scopes.map(scope => {
    if(scope === "role-get"){
      scopePresent = true;
    }
  })

  if(scopePresent){
    scopePresent = false;
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
              message: "Resource not found."
            }]
          })
        }
      }else{
        res.status(409).json({
          status: false,
          errors:[{
            message: "Something went wrong."
          }]
        })
      }
    })
  }else{
    res.status(401).json({
      message: "Access Denied."
    })
  }
});

app.post("/role", jwtCheck, (req, res)=>{
  const role = new Role({
    _id: mongoose.Types.ObjectId(),
    name: req.body.name,
    scopes: req.body.scopes
  })

  role.save((err, results) => {
    if(err){
      res.status(500).json({
        status: false,
        errors:[{
          massage: "Internal server error."
        }]
      })
    }else{
      res.status(201).json({
        status: true,
        message: "Role created."
      })
    }
  })
});

app.patch("/role/:roleId", jwtCheck, (req, res)=>{

  const scopes = req.userData.user.role.scopes;
  let scopePresent = false;

  scopes.map(scope => {
    if(scope === "role-edit"){
      scopePresent = true;
    }
  })

  if(scopePresent){
    scopePresent = false;
    Role.updateOne({_id: req.params.roleId}, {$set: req.body }, function(err, result){
      if(err){
        res.status(412).json({
          status: false,
          errors: [{
            message: "Something went wrong."
          }]
        })
      }else{
        res.status(200).json({
          status: true,
          message: "successful."
        })
      }
    })
  }else{
    res.status(401).json({
      message: "Access Denied."
    })
  }
});

app.delete("/role/:roleId", jwtCheck, (req, res)=>{

  const scopes = req.userData.user.role.scopes;
  let scopePresent = false;

  scopes.map(scope => {
    if(scope === "role-remove"){
      scopePresent = true;
    }
  })

  if(scopePresent){
    scopePresent = false;
    Role.findByIdAndDelete({_id: req.params.roleId}, (err, result) => {
      if(!err){
        if(result){
          res.status(200).json({
            status: true,
            message: "Successfully removed."
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
  }else{
    res.status(401).json({
      message: "Access Denied."
    })
  }
});

///////////////////////////////////////////////////////////////////////// Users //////////////////////////////////////////////////////////////

app.post("/user/signin", (req, res) => {

  const username = req.body.email;
  const password = req.body.password;

  User.findOne({email: username}, (err, result) => {
    if(!err){
        if(result){
          bcrypt.compare(password, result.password, (err, matched) => {
            if(matched){
              Role.findById({_id: result.roleId}, (err, foundRole)=>{
                const token = jwt.sign(
                  {
                    user:{
                      _id: result._id,
                      first_name: result.first_name,
                      last_name: result.last_name,
                      email: result.email,
                      roleId: result.roleId,
                      mobile: result.mobile[0],
                      role:{
                        _id: foundRole._id,
                        name: foundRole.name,
                        scopes: foundRole.scopes
                      }
                    }
                  },
                  process.env.JWT_KEY,
                  {
                    expiresIn: "1h"
                  }
                );
                res.status(200).json({
                  message: "Auth Successful.",
                  token: token
                })
             })
            }else{
              res.status(401).json({
                status: false,
                error: [{
                  message: "Auth failed."
                }]
              })
            }
           })
        }else{
          res.status(401).json({
            status: false,
            message: "Auth failed."
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
      res.status(409).json({
        status: false,
        errors: [{
          message: "User already exist, Bad Request."
        }]
      })
    }
    else{
      let phoneNum = req.body.mobile;
      const password = req.body.password;

        if(phone(phoneNum).length >= 1){
          phoneNum = phone(phoneNum);

        }else{
          return res.status(400).json({
            status: false,
            errors: [{
              message: "Enter Correct mobile number with country code, i.e for India +91xxxxxxxxxx."
            }]
          })
        }

      bcrypt.hash(password, saltRounds, (err, hash)=>{
        if(!err){
            const user = new User ({
              _id: mongoose.Types.ObjectId(),
              first_name:  req.body.first_name,
              last_name: req.body.last_name,
              email: req.body.email,
              password: hash,
              mobile: phoneNum,
              roleId: req.body.roleId,
            })

            user.save((err, result) => {
            if(!err){
              res.status(201).json({
                status: true,
                message: "User Created."
              })
            }else{
              res.status(409).json({
                status: false,
                errors: [{
                  error: err
                }]
              })
            }
          })
        }else{
          res.status(400).json({
            status: false,
            errors: [{
              message: "Please enter password."
            }]
          })
        }
      })
    }
  })
});

app.get("/user",jwtCheck, (req, res) => {

  const scopes = req.userData.user.role.scopes;
  let scopePresent = false;

  scopes.map(scope => {
    if(scope === "user-get"){
      scopePresent = true;
    }
  })

  if(scopePresent){
    scopePresent = false;
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
          return res.status(404).json({
            status: false,
            message: "Not Found."
          })
        }
      }else{
        return res.status(412).json({
          status: false,
          errors: [{
            message: "Something went wrong."
          }]
        })
      }
    })
  }else{
    res.status(401).json({
      message: "Access Denied."
    })
  }
});

app.get("/user/:userId",jwtCheck , (req, res) => {

  const scopes = req.userData.user.role.scopes;
  let scopePresent = false;

  scopes.map(scope => {
    if(scope === "user-get"){
      scopePresent = true;
    }
  })

  if(scopePresent){
    scopePresent=false;
    User.find({_id: req.params.userId}, (err, found)=>{
      if(!err){
        if(found.length >= 1){
          Role.findById({_id: found[0].roleId}, (err, foundRole)=>{
            console.log(foundRole);
            res.status(200).json({
              status: true,
              content: {
                data: found.map(user=>{
                  return{
                    _id: user._id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role_id: user.roleId,
                    mobile: user.mobile,
                    role:{
                      _id: foundRole._id,
                      name: foundRole.name,
                      scopes: foundRole.scopes
                    }
                  }
                })
              }
            })
          })
        }else{
          res.status(200).json({
            message: "User not found."
          })
        }
      }else{
        res.status(412).json({
          status: false,
          errors:[{
            message: "Something went wrong."
          }]
        })
      }
    })
  }else{
    res.status(401).json({
      message: "Access Denied."
    })
  }
});

app.patch("/user/:userId",jwtCheck, (req, res) => {

  const scopes = req.userData.user.role.scopes;
  let scopePresent = false;

  scopes.map(scope => {
    if(scope === "user-edit"){
      scopePresent = true;
    }
  })

  if(scopePresent){
    scopePresent = false;
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
              message: "Something went wrong."
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
                status: true
              })
            }else{
              res.status(500).json({
                status: false
              })
            }
          }else{
            if(passCheck){
              res.status(200).json({
                status: true
              })
            }else{
              res.status(500).json({
                status: false
              })
            }
          }
        }else{
          restCheck = updateRest();
          if(restCheck){
            res.status(200).json({
              status: true
            })
          }else{
            res.status(500).json({
              status: false
            })
          }
        }
      })
    }
  }else{
      res.status(401).json({
        message: "Access Denied."
      })
    }
});

app.delete("/user/:userId",jwtCheck, (req, res) => {

  const scopes = req.userData.user.role.scopes;
  let scopePresent = false;

  scopes.map(scope => {
    if(scope === "user-remove"){
      scopePresent = true;
    }
  })

  if(scopePresent){
    scopePresent = false;
    User.findByIdAndDelete({_id: req.params.userId}, (err, result) => {
      if(!err){
        if(result){
          res.status(200).json({
            status: true,
            message: "Sussfully removed."
          })
        }else{
          res.status(403).json({
            message: "User not exist."
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
  }else{
      res.status(401).json({
        message: "Access Denied."
      })
  }
});

////////////////////////////////////////////////////////////////////////// Schools ////////////////////////////////////////////////////////////

app.get("/school", jwtCheck, (req, res) => {

  const scopes = req.userData.user.role.scopes;
  let schoolScopePresent = false;

  scopes.map(scope => {
    if(scope === "school-get"){
      schoolScopePresent = true;
    }
  })

  if(schoolScopePresent){
    schoolScopePresent = false;
    School.find({}, (err, results) =>{
      if(!err){
        if(results.length>=1){
          res.status(200).json({
            status: true,
            content: {
              data: results
            }
          })
        }else{
          res.status(200).json({
            status: true,
            message: "School Not Found."
          })
        }
      }else{
        res.status(404).json({
          status: false,
          errors: [
            {
              message: "Something went wrong."
            }
          ]
        })
      }
    })
  }else{
    res.status(401).json({
      message: "Access Denied."
    })
  }
});

app.get("/school/:schoolId/students",jwtCheck, (req, res) => {

  const scopes = req.userData.user.role.scopes;
  let scopePresent = false;

  scopes.map(scope => {
    if(scope === "school-get"){
      scopePresent = true;
    }
  })

  if(scopePresent){
    scopePresent = false;
    School.findOne({ _id: req.params.schoolId }, (err, found) =>{
      if(!err){
        Profile.find({schoolId: req.params.schoolId}, (err,result)=>{
          if(!err){
            if(found){
              res.status(200).json({
                status: true,
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
                message: "School Not Found."
              })
            }
          }
        })
      }else{
        res.status(404).json({
          status: false,
          errors: [
            {
              message: "Something went wrong."
            }
          ]
        })
      }
    })
  }else{
    res.status(401).json({
      message: "Access Denied."
    })
  }
});

app.post("/school", jwtCheck, (req, res) => {
  const scopes = req.userData.user.role.scopes;
  let scopePresent = false;

  scopes.map(scope => {
    if(scope === "school-create"){
      scopePresent = true;
    }
  })

  if(scopePresent){
    scopePresent = false;
    School.find({name: req.body.name, city: req.body.city, state: req.body.state}, (err, matchFound)=>{
      if(!err){
        if(matchFound.length >= 1){
          return res.status(500).json({
            message: "School already exist."
          })
       }else{
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
               status: true,
               message: "School added."
             })
           }else{
             res.status(500).json({
               status: false,
               errors: [
                 {
                   message: "Something went wrong."
                 }
               ]
             })
           }
         })
        }
      }
    })
  }else{
    res.status(401).json({
      message: "Access Denied."
    })
  }
});

app.patch("/school/:schoolId", jwtCheck, (req, res) => {

  const scopes = req.userData.user.role.scopes;
  let scopePresent = false;

  scopes.map(scope => {
    if(scope === "school-edit"){
      scopePresent = true;
    }
  })

  if(scopePresent){
    scopePresent = false;
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
          status: true,
          message: "Updated."
        })
      }
    })
  }else{
    res.status(401).json({
      message: "Access Denied."
    })
  }
});

/////////////////////////////////////////////////////////////////////////// Profile //////////////////////////////////////////////////////////

app.get("/profile", jwtCheck, (req,res) => {

  const scopes = req.userData.user.role.scopes;
  let scopePresent = false;

  scopes.map(scope => {
    if(scope === "profile-get"){
      scopePresent = true;
    }
  })

  if(scopePresent){
    scopePresent = false;
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
  }else{
    res.status(401).json({
      message: "Access Denied."
    })
  }
});

app.post("/profile", jwtCheck, (req,res) => {

  const scopes = req.userData.user.role.scopes;
  let scopePresent = false;

  scopes.map(scope => {
    if(scope === "profile-create"){
      scopePresent = true;
    }
  })

  if(scopePresent){
    scopePresent = false;
    Profile.find({userId: req.body.userId}, (err, profileFound) => {
      if(!err){
        if(profileFound.length >=1){
          return res.status(500).json({
            message: "profile already exist with same userId.",
            userId: req.body.userId
          })
        }else{
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
        }
      }
    })
  }else{
    res.status(401).json({
      message: "Access Denied."
    })
  }
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
