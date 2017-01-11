'use strict';
module.exports = (function() {
    const express = require('express');
    const api = express.Router();
    const config = require('../../config');
    const mongo = require('mongodb').MongoClient;
    const objectId = require('mongodb').ObjectID;
    // Save full timestamp
    const utc = new Date().toJSON().slice(0,10);
    // TODO: Move bodyParser to app.js
    const methodOverride = require('method-override');
    const bodyParser = require('body-parser');

    const projects = require('./project-model');

    api.use(methodOverride());
    api.use(bodyParser.json());
    api.use(bodyParser.urlencoded({ extended: true }));


    api.get('/', function (req, res, next) {
        projects.getProjects(function(){
            res.json(projects.projectsList);
        })
    });

    api.post('/', function (req, res, next) {
        console.log('projects to be inserted');
        var project = {
            projectName :          req.body.projectName,
            projectDescription:    req.body.projectDescription,
            projectLink:           req.body.projectLink,
            users:                 [],
            createdDate:           utc,
            updatedDate:           '',
            isActive:              true
        };
        projects.submitProject(project, function(){
            res.send(200, project);
        })
    });
    api.put('/', function (req, res, next) {
        var project = {
            projectName :          req.body.projectName,
            projectDescription:    req.body.projectDescription,
            projectLink:           req.body.projectLink,
            users:                 [],
            updatedDate:           utc,
            isActive:              req.body.isActive,
        };
        var id = req.body.id;
        projects.updateProject(project, id, function(){
            res.send(200, project);
        })
    });
    // TODO: Redo
    // api.post('/project/:projectID/user/:userID')
    api.put('/add-user', function (req, res, next) {
        var user = {
            userId:      req.body.userId
        };
        var projectId =  req.body.projectId;

       // console.log('id s ',id);
        mongo.connect(config.mongo, function(err, db) {
            var allUsersInProjects = db.collection('projects').findOne({'_id': objectId(projectId)}).then(
                function(data){
                    console.log(data.users);
                    res.send(200, data.users);
                }
            ).catch(function(e){
                console.error('error', e);
                // TODO send error (500, 400, ...)
            });
           /* db.collection('projects').updateOne({'_id': objectId(projectId)}, {$push: {users: user}}, function(err, result) {
                res.send(200, 'user is added');
                console.log('user added');
                db.close();
            });*/
        });
    });
    // { archived: false }
    // projects/:id/archive
    // HTTP PATCH /projects/:id
    // Try api.patch instead
    api.put('/archive', function (req, res, next) {
        var projectId = req.body.projectId;
        mongo.connect(config.mongo, function (err, db) {
            var project = db.collection('projects').updateOne({'_id': objectId(projectId)}, {$set: {archived: true}});
            project.then(function (data) {
                res.json(data);
                db.close();
            })
                .catch(function (error) {
                    console.log(error);
                    res.end('something went wrong');
                });
        });
    });
    return api;
})();
