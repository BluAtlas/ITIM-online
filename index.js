const express = require('express')
const session = require('express-session')
const passport = require('passport')
const passportLocal = require('passport-local')

const cors = require('cors')
const multer = require('multer')
const fs = require('fs')
const archiver = require('archiver');
const path = require('path')
const rimraf = require("rimraf");
const { exec } = require('child_process')
const mime = require('mime-types')

const model = require('./model')
const IphoneTemplate = model.iPhoneTemplate
const User = model.User

// setup multer for file save locations and file names
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        var dir // directory changes based on icon file or background file
        if (file.fieldname == "backgroundFile") {
            dir = path.format({ // create path
                dir: 'temp' + path.sep + req.body.name,
                base: 'input'
            })
        } else {
            dir = path.format({ // create path
                dir: 'temp' + path.sep + req.body.name + path.sep + 'input',
                base: 'icons'
            })
        }

        if (!fs.existsSync(dir)) { // make sure directory exists
            fs.mkdirSync(dir, { recursive: true }) // create if not
        }
        cb(null, dir)
    },
    filename: function(req, file, cb) {
        if (file.fieldname == "backgroundFile") { // background file
            ext = mime.extension(file.mimetype)
            if (ext == 'jpeg') { // jpeg unsupported, change to jpg
                ext = 'jpg'
            }
            cb(null, "background." + ext)
        } else { // icon files
            og = file.originalname.slice(0, -(mime.extension(file.mimetype).length + 1))
            ext = mime.extension(file.mimetype)
            if (ext == 'jpeg') { // jpeg unsupported, change to jpg
                ext = 'jpg'
            }
            cb(null, og + '-' + file.fieldname + "." + ext)
        }
    }
})

// setup upload for upload.any
const upload = multer({
    storage: storage,
    fileFilter: function(req, file, cb) {
        // fileFilter goes here
        var filetypes = /jpg|png|jpeg/;
        var mimetype = filetypes.test(file.mimetype);
        var extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb("Error: File upload only supports the following filetypes - " + filetypes);
    }
})

// setup multiUpload, a function called later to upload multiple files
const multiUpload = upload.any()

// setup express and the port number
const app = express()
const port = process.env.PORT || 8080

// setup middleware
app.use(express.static('public'))
app.use(express.urlencoded({ extended: false }))
app.use(cors())
app.use(session({ secret: 'xd', resave: false, saveUninitialized: true }))
app.use(passport.initialize())
app.use(passport.session())

// setup middle-middleware
passport.use(new passportLocal.Strategy({
    username: 'userName',
    password: 'plainPassword',
}, function(userName, plainPassword, done) {
    // authentication logic
    valid = false

    // check if user exists
    User.findOne({
        userName: userName
    }).then(function(user) {
        // if user exists, verify password
        if (user) {
            user.verifyPassword(plainPassword).then(function(result) {
                if (result) {
                    console.log("session success")
                    done(null, user);
                } else {
                    console.log("session error, password wrong")
                    done(null, false)
                }
            })
        } else {
            console.log("session error, no user found")
            done(null, false)
        }
    }).catch(function(err) {
        console.log("session error, findOne error")
        done(err);
    })
}))

passport.serializeUser(function(user, done) {
    done(null, user._id)
});

passport.deserializeUser(function(userId, done) {
    User.findOne({ _id: userId }).then(function(user) {
        done(null, user)
    }).catch(function(err) {
        done(err)
    })
});

// ACTION: post session (login)
app.post('/session', passport.authenticate('local'), function(req, res) {
    console.log("post session request body:", req.body)
        // authentication succeeded
    res.sendStatus(201);
})

// ACTION: get session (check login)
app.get('/session', function(req, res) {
    if (req.user) {
        res.sendStatus(200)
    } else {
        res.sendStatus(401)
    }
})

// ACTION: delete session (logout)
app.delete('/session', function(req, res) {
    req.logout();
    res.sendStatus(204);
})

// ACTION: handle and run new job
app.post('/jobs/:templateId', (req, res) => {
    multiUpload(req, res, function(err) {
        console.log("new job raw request body:", req.body, "\nand parems:", req.params)
        if (err) { // upload failed, send error
            console.error('Error occurred:', err)
            return res.sendStatus(422)
        }

        // upload finished here

        // get jobs folder directory
        var bfile // background file
        for (let i = 0; i < req.files.length; i++) {
            if (req.files[i].fieldname == "backgroundFile") {
                bfile = req.files[i]
            }
        }
        var dir = bfile.destination
        dir = path.dirname(dir) // dir is now the job's folder
        console.log("new job at location:", dir)

        // get iphone template, save as jT (jobTemplate)
        var jT // jobTemplate
        IphoneTemplate.findOne({ _id: req.params.templateId }).then((template) => {
            if (template) {
                jT = template
            } else {
                console.log("Job could not find Template with body: ", req.body)
                res.status(404).send("Template Does not exist in server")
                return
            }
        }).catch(error => {
            if (error.errors) {
                // 422
                let errorMessages = {}
                for (let e in error.errors) {
                    errorMessages[e] = error.errors[e].message
                    console.error("Error in job: ", e)
                }
                res.status(422).json(errorMessages)
                return
            } else {
                console.error("Error occurred while creating a template:", error)
                res.status(500).send("server error")
                return
            }
        }).then(() => {

            // files and template setup, now start ITIM
            var ITIM // setup ITIM to be platform specific
            if (process.platform == "win32") {
                ITIM = "ITIM.exe"
            } else {
                ITIM = "ITIM"
            }

            // copy ITIM executable to file destination
            fs.copyFile(ITIM, dir + path.sep + ITIM, function(err) {
                if (err) {
                    console.error('Error occurred:', err)
                    return res.sendStatus(422)
                }

                // platform specific execution
                if (process.platform == "win32") {
                    ITIM = "ITIM.exe"
                } else {
                    ITIM = "./ITIM"
                }

                ext = mime.extension(bfile.mimetype)
                if (ext == 'jpeg') { // jpeg unsupported, change to jpg
                    ext = 'jpg'
                }

                // run ITIM.exe in the job folder with the jobTemplate parameters
                exec("cd " + dir +
                    " && " + ITIM + " " +
                    ext + " " +
                    jT.phone_size_x + ' ' +
                    jT.phone_size_y + ' ' +
                    jT.app_size + ' ' +
                    jT.from_top + ' ' +
                    jT.from_left + ' ' +
                    jT.between_x + ' ' +
                    jT.between_y + ' ' +
                    jT.from_bottom + ' ' +
                    jT.from_left_dock + ' ' +
                    jT.max_apps + ' ' +
                    jT.dock_count,
                    function(err, stdout) {
                        if (err) {
                            console.error('exec error:', err)
                        }
                        console.log("ITIM completed: ", stdout)

                        // create directory as needed
                        if (!fs.existsSync("ZIPS")) { // make sure directory exists
                            fs.mkdirSync("ZIPS", { recursive: true }) // create if not
                        }

                        // create the zipper
                        const zipper = archiver('zip');
                        // throw error if zip file creation fails
                        zipper.on('error', function(err) {
                            throw err;
                        });

                        // prepare zip file and output log
                        const output = fs.createWriteStream("ZIPS" + path.sep + path.basename(dir) + ".zip")
                        output.on('finish', function() {
                            console.log('Job ' + path.basename(dir) + ' created zip, ' + zipper.pointer() + ' total bytes');

                            // zipping is done, delete dir
                            rimraf(dir, function() {
                                console.log(`${dir} deleted`);
                            })
                        });

                        // do the zipping
                        zipper.pipe(output)
                        zipper.directory(dir + path.sep + "output", false)
                        zipper.finalize()


                        // TODO setup and send zip download link to client

                        res.status(200)
                        res.json({ JOBID: parseInt(path.basename(dir)) })
                    }
                )
            })
        })
    })
})

// ACTION: Download zip file
app.get('/:jobId/download', function(req, res) {
    console.log("Download request params:", req.params)
    var filePath = "ZIPS"
    var fileName = req.params.jobId + ".zip"

    res.download(filePath + path.sep + fileName, (err) => {
        if (err) {
            console.log(err);
        }
    });
});

// ACTION: retrieve collection
app.get('/iphonetemplates', (req, res) => {
    console.log("retrieve collection raw request body:", req.body)
    IphoneTemplate.find().then((templates) => {
        res.json(templates)
    })
})

// ACTION: retrieve member
app.get('/iphonetemplates/:templateId', (req, res) => {
    console.log("retrieve member raw request body:", req.body)

    IphoneTemplate.findOne({ _id: req.params.templateId }).then((template) => {
        if (template) {
            res.json(template)
        } else {
            res.sendStatus(404)
        }
    }).catch(error => {
        console.error("DB query failed")
        res.sendStatus(400)
    })
})

// ACTION: delete member
app.delete('/iphonetemplates/:templateId', (req, res) => {
    console.log("delete member raw request body:", req.body)
    if (!req.user) {
        res.sendStatus(401)
        return
    }

    IphoneTemplate.findOne({ _id: req.params.templateId, user: req.user._id }).then((template) => {
        if (template) {
            IphoneTemplate.deleteOne({
                _id: req.params.templateId
            }).then(() => {
                res.sendStatus(204)
            })
        } else {
            res.sendStatus(404)
        }
    }).catch(error => {
        console.error("DB query failed")
        res.sendStatus(400)
    })
})

// ACTION: post member
app.post('/iphonetemplates', (req, res) => {
    console.log("post member raw request body:", req.body)
    if (!req.user) {
        res.sendStatus(401)
        return
    }

    var template = new IphoneTemplate({
        name: req.body.name,
        phone_size_x: parseInt(req.body.phone_size_x),
        phone_size_y: parseInt(req.body.phone_size_y),
        app_size: parseInt(req.body.app_size),
        from_top: parseInt(req.body.from_top),
        from_left: parseInt(req.body.from_left),
        between_x: parseInt(req.body.between_x),
        between_y: parseInt(req.body.between_y),
        from_bottom: parseInt(req.body.from_bottom),
        from_left_dock: parseInt(req.body.from_left_dock),
        max_apps: parseInt(req.body.max_apps),
        dock_count: parseInt(req.body.dock_count),
        user: req.user
    })

    template.save().then(() => {
        res.status(201).send(template)
    }).catch((error) => {
        if (error.code == 11000) {
            // 11000 is uniqueness error
            // handle specific database constraint here
        }
        if (error.errors) {
            // 422
            let errorMessages = {}
            for (let e in error.errors) {
                errorMessages[e] = error.errors[e].message
            }
            res.status(422).json(errorMessages)
        } else {
            console.error("Error occurred while creating a template:", error)
            res.status(500).send("server error")
        }
    })
})

// ACTION: replace member
app.put('/iphonetemplates/:templateId', (req, res) => {
    console.log("replace member raw request body:", req.body)
    if (!req.user) {
        res.sendStatus(401)
        return
    }

    var newTemplate = new IphoneTemplate({
        _id: req.params.templateId,
        name: req.body.name,
        phone_size_x: parseInt(req.body.phone_size_x),
        phone_size_y: parseInt(req.body.phone_size_y),
        app_size: parseInt(req.body.app_size),
        from_top: parseInt(req.body.from_top),
        from_left: parseInt(req.body.from_left),
        between_x: parseInt(req.body.between_x),
        between_y: parseInt(req.body.between_y),
        from_bottom: parseInt(req.body.from_bottom),
        from_left_dock: parseInt(req.body.from_left_dock),
        max_apps: parseInt(req.body.max_apps),
        dock_count: parseInt(req.body.dock_count),
        user: req.user
    })

    IphoneTemplate.findOne({ _id: req.params.templateId, user: req.user._id }).then((template) => {
        if (template) {
            IphoneTemplate.replaceOne({ _id: req.params.templateId }, newTemplate).then(() => {
                res.sendStatus(201)
            })
        } else {
            res.sendStatus(403)
        }
    }).catch(error => {
        if (error.code == 11000) {
            // 11000 is uniqueness error
            // handle specific database constraint here
            res.sendStatus(409)
        }
        if (error.errors) {
            // 422
            let errorMessages = {}
            for (let e in error.errors) {
                errorMessages[e] = error.errors[e].message
            }
            res.status(422).json(errorMessages)
        } else {
            console.error("Error occurred while creating a template:", error)
            res.status(500).send("server error")
        }
    })
})

// ACTION: post user
app.post('/users', (req, res) => {
    console.log("post member raw request body:", req.body)

    var user = new User({
        userName: req.body.userName,
    })

    user.setEncryptedPassword(req.body.password).then(function() {
        // promise has now been fulfilled
        user.save().then(() => {
            console.log("user created: " + req.body.userName)
            res.status(201).send("created")
        }).catch((error) => {
            if (error.code == 11000) {
                console.log("user uniqueness error: " + req.body.userName)
                    // 11000 is uniqueness error
                    // handle specific database constraint here
                res.status(409).send("server error")
                return
            }
            if (error.errors) {
                // 422
                let errorMessages = {}
                for (let e in error.errors) {
                    errorMessages[e] = error.errors[e].message
                }
                res.status(422).json(errorMessages)
            } else {
                console.error("Error occurred while creating a user:", error)
                res.status(500).send("server error")
            }
        })
    });
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})