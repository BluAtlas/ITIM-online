// MOVE TO model.js LATER

const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
//mongoose.connect("mongodb+srv://web4200:krOnbLZkxjXG6fAk@cluster0.rw6lv.mongodb.net/iphonetemplatesdb?retryWrites=true&w=majority");
mongoose.connect("Enter valid MongoDB URL in model.js");

const iphoneTemplateSchema = mongoose.Schema({
    name: { type: String, required: [true, 'name is required as a string.'], unique: true },
    phone_size_x: { type: Number, required: [true, 'phone_size_x is required as a number'] },
    phone_size_y: { type: Number, required: [true, 'phone_size_y is required as a number'] },
    app_size: { type: Number, required: [true, 'app_size is required as a number'] },
    from_top: { type: Number, required: [true, 'from_top is required as a number'] },
    from_left: { type: Number, required: [true, 'from_left is required as a number'] },
    between_x: { type: Number, required: [true, 'between_x is required as a number'] },
    between_y: { type: Number, required: [true, 'between_y is required as a number'] },
    from_bottom: { type: Number, required: [true, 'from_bottom is required as a number'] },
    from_left_dock: { type: Number, required: [true, 'from_left_dock is required as a number'] },
    max_apps: { type: Number, required: [true, 'max_apps is required as a number'] },
    dock_count: { type: Number, min: 0, max: 4, required: [true, 'dock_count is required as a number in range [0,4]'] },
    user: { // users own templates
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }
});

const userSchema = mongoose.Schema({
    userName: {
        type: String,
        required: [true, "please specify a first name"],
        unique: true
    },
    encryptedPassword: {
        type: String,
        required: [true, "Please specify a password."]
    },
})

userSchema.methods.setEncryptedPassword = function (plainPassword) {

    let promise = new Promise((resolve, reject) => {
        // encrypt plainPassword
        bcrypt.hash(plainPassword, 12).then(hash => {
            // set hash on the model instance
            this.encryptedPassword = hash

            // resolve the promise HERE.
            // this calls then()
            resolve();
        })
    })

    return promise
}

userSchema.methods.verifyPassword = function (plainPassword) {

    let promise = new Promise((resolve, reject) => {
        // compare plainPassword against this.encryptedPassword
        bcrypt.compare(plainPassword, this.encryptedPassword).then(result => {
            resolve(result);
        })
    })

    return promise
}

const iphoneTemplateModel = mongoose.model('iphonetemplate', iphoneTemplateSchema)
const userModel = mongoose.model('user', userSchema)

module.exports = {
    iPhoneTemplate: iphoneTemplateModel,
    User: userModel
};