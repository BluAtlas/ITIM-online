//const SERVER_ROOT = "http://localhost:8080"
//const SERVER_ROOT = "https://itim-host.herokuapp.com"
const SERVER_ROOT = "Enter valid website URL in app.js"

var app = new Vue({
    el: '#app',
    data: {
        // validation
        errors: {},
        // view variables
        pageCounter: 0,
        // 1 : mainView
        // 2 : uploadView
        // 3 : arrangeView
        // 4 : processingView
        // 5 : completeView
        welcomeView: false,
        backButtonView: true,

        // Page Edits
        pageDescription: "Getting Started",
        pageDescriptions: [
            "Getting Started",
            "Getting Started",
            "Upload",
            // "Arrange Icons",
            "Processing",
            "Complete"
        ],

        // Upload Variables
        uploadIphoneIdSelected: null,
        uploadIphoneTemplates: [],
        uploadBackgroundFile: null,
        uploadIconFiles: [],

        // uploadLogin Variables
        inputUserName: "",
        inputUserPassword: "",

        // UploadEdit Variables
        uploadEditing: false,
        uploadTemplateEditing: false,
        uploadLogin: false,
        inputTemplateName: "",
        inputPhoneSizeX: "",
        inputPhoneSizeY: "",
        inputAppSize: "",
        inputFromTop: "",
        inputFromLeft: "",
        inputBetweenX: "",
        inputBetweenY: "",
        inputFromBottom: "",
        inputFromLeftDock: "",
        inputMaxApps: "",
        inputDockCount: "",
        templateEditSaveButton: "Replace Template",
        deleteTemplateIf: true,

        // Job Variable
        JOBID: null,

    },
    methods: {
        // mainView Methods
        mainButtonClick: function () {
            this.pageContinue()
        },

        // uploadView Methods
        uploadContinue: function () {
            var data = new FormData();

            // append background file
            data.append('name', Math.round(Math.random() * 1E16)) // name is our unique identifier
            data.append('backgroundFile', this.uploadBackgroundFile);

            // append icons
            for (let i = 0; i < this.uploadIconFiles.length; i++) {
                data.append("icon-" + i, this.uploadIconFiles[i])
            }

            fetch(SERVER_ROOT + '/jobs/' + this.uploadIphoneIdSelected, { // send job here
                credentials: "include",
                method: 'POST',
                body: data
            }).then((response) => { // receive job here
                response.json().then((data) => {
                    console.log('Upload Received. response:', data);
                    this.JOBID = data.JOBID
                    this.pageContinue();
                });
            });

            console.log("Continue button pressed.");
            this.pageContinue();
            this.uploadBackgroundFile = null;
            this.uploadIconFiles = [];
            this.uploadEditing = false;
            this.uploadTemplateEditing = false;
        },

        // uploadLogin Methods
        validateUser: function () {
            this.errors = {};

            // check name
            // if name 0 length
            if (this.inputUserName.length == 0) {
                this.errors.userName = "Please Enter a Username";
            }

            // check password
            if (this.inputUserPassword.length == 0) {
                this.errors.userPassword = "Please Enter a Password";
            }

            return this.newUserIsValid;
        },
        uploadLoginCreateUser: function () {
            if (!this.validateUser()) {
                return;
            }

            var data = "userName=" + encodeURIComponent(this.inputUserName);
            data += "&password=" + encodeURIComponent(this.inputUserPassword);

            fetch(SERVER_ROOT + "/users", {
                credentials: "include",
                method: 'POST',
                body: data,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).then((response) => {
                if (response.status == 201) {
                    // user was created successfully
                    this.errors = {};
                    this.errors.fetchFailed = "User Created, Please Login."
                } else if (response.status == 409) {
                    this.errors = {};
                    this.errors.fetchFailed = "Unable to Create, User Already Exists"

                } else {
                    console.error("Create Failed, Server Error.")
                    this.errors = {};
                    this.errors.fetchFailed = "Create Failed, Server Error."
                }
            }).catch(() => { // no response from server
                console.log("Create Failed, Server did not respond.")
                this.errors = {};
                this.errors.fetchFailed = "Create Failed, Server did not respond.";
            });

        },
        uploadLoginTryLogin: function () {

            if (!this.validateUser()) {
                return;
            }

            var data = "username=" + encodeURIComponent(this.inputUserName);
            data += "&password=" + encodeURIComponent(this.inputUserPassword);

            fetch(SERVER_ROOT + "/session", {
                credentials: "include",
                method: 'POST',
                body: data,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).then((response) => {
                if (response.status == 201) {
                    this.fetchTemplatesFromServer();
                    this.uploadLogin = false;
                    this.uploadEditing = true;
                } else {
                    this.errors = {};
                    this.errors.fetchFailed = "Failed, Bad Login"
                }
            }).catch(() => {
                console.log("Login Failed, Server did not respond.")
                this.errors = {};
                this.errors.fetchFailed = "Login Failed, Server did not respond.";
            });
        },
        uploadLogout: function () {

            fetch(SERVER_ROOT + "/session", {
                credentials: "include",
                method: 'Delete',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).then((response) => {
                if (response.status == 204) {
                    this.uploadLogin = true;
                    this.uploadEditing = false;
                } else {
                    this.errors = {};
                    this.errors.fetchFailed = "Failed to Logout, Not logged in?"
                }
            }).catch(() => {
                console.log("Logout Failed, Server did not respond.")
                this.errors = {};
                this.errors.fetchFailed = "Logout Failed, Server did not respond.";
            });
        },

        // uploadEditView Methods
        uploadEditSwitchTemplateView: function () {
            // if were in any editing views, leave
            if (this.uploadEditing || this.uploadLogin || this.uploadTemplateEditing) {
                this.uploadEditing = false;
                this.uploadLogin = false;
                this.uploadTemplateEditing = false;
                return
            }
            // check if logged in
            fetch(SERVER_ROOT + '/session/', { // send job here
                credentials: "include",
                method: "GET"
            }).then((response) => {
                if (response.status == 200) { // if logged in, show all templates page
                    this.fetchTemplatesFromServer();
                    this.uploadTemplateEditing = false;
                    this.uploadLogin = false;
                    this.uploadEditing = true;
                } else { // if not logged in, show login page
                    this.uploadLogin = true;
                    this.uploadEditing = false;
                    this.uploadTemplateEditing = false;
                }
            })
            // if not logged in:
            // this.uploadEditing = false;
            // this.uploadLogin = true;

            // if logged in:
            // this.fetchTemplatesFromServer();
            // this.uploadTemplateEditing = false;
            // this.uploadEditing = !this.uploadEditing;
        },
        uploadEditOnEditButton: function (template) {
            this.uploadEditing = false;
            this.uploadTemplateEditing = true;
            this.deleteTemplateIf = true;
            this.templateEditSaveButton = "Replace Template";

            // fill with template data
            this.inputTemplateName = template.name;
            this.inputPhoneSizeX = template.phone_size_x;
            this.inputPhoneSizeY = template.phone_size_y;
            this.inputAppSize = template.app_size;
            this.inputFromTop = template.from_top;
            this.inputFromLeft = template.from_left;
            this.inputBetweenX = template.between_x;
            this.inputBetweenY = template.between_y;
            this.inputFromBottom = template.from_bottom;
            this.inputFromLeftDock = template.from_left_dock;
            this.inputMaxApps = template.max_apps;
            this.inputDockCount = template.dock_count;
        },
        checkIfNewTemplate: function () {
            // if name exists
            if (this.uploadIphoneTemplates.find((template) => {
                return template.name == this.inputTemplateName
            })) {
                this.templateEditSaveButton = "Replace Template"
                this.deleteTemplateIf = true;
            } else {
                this.templateEditSaveButton = "Create Template"
                this.deleteTemplateIf = false;
            }
        },
        newTemplate: function () {
            this.uploadEditing = false;
            this.uploadTemplateEditing = true;
            this.deleteTemplateIf = false;

            this.templateEditSaveButton = "Create Template";
            this.inputTemplateName = "";
            this.inputPhoneSizeX = "";
            this.inputPhoneSizeY = "";
            this.inputAppSize = "";
            this.inputFromTop = "";
            this.inputFromLeft = "";
            this.inputBetweenX = "";
            this.inputBetweenY = "";
            this.inputFromBottom = "";
            this.inputFromLeftDock = "";
            this.inputMaxApps = "";
            this.inputDockCount = "";
        },
        validateTemplate: function () {
            this.errors = {};

            // check name
            // if name 0 length
            if (this.inputTemplateName.length == 0) {
                this.errors.templateName = "Please specify a name for your template.";
            }

            // check phone size x
            if (this.inputPhoneSizeX.length == 0) {
                this.errors.templatePhoneSizeX = "Phone Size X must not be empty.";
            }
            if (isNaN(this.inputPhoneSizeX)) {
                this.errors.templatePhoneSizeX = "Phone Size X must be a positive number.";
            } else if (parseInt(this.inputPhoneSizeX) < 1) {
                this.errors.templatePhoneSizeX = "Phone Size X must be a positive number.";
            }

            // check phone size y
            if (this.inputPhoneSizeY.length == 0) {
                this.errors.templatePhoneSizeY = "Phone Size Y must not be empty.";
            }
            if (isNaN(this.inputPhoneSizeY)) {
                this.errors.templatePhoneSizeY = "Phone Size Y must be a positive number.";
            } else if (parseInt(this.inputPhoneSizeY) < 1) {
                this.errors.templatePhoneSizeY = "Phone Size Y must be a positive number.";
            }

            // check app size
            if (this.inputAppSize.length == 0) {
                this.errors.templateAppSize = "App Size must not be empty.";
            }
            if (isNaN(this.inputAppSize)) {
                this.errors.templateAppSize = "App Size must be a positive number.";
            } else if (parseInt(this.inputAppSize) < 1) {
                this.errors.templateAppSize = "App Size must be a positive number.";
            }

            // check From Top
            if (this.inputFromTop.length == 0) {
                this.errors.templateFromTop = "From Top must not be empty.";
            }
            if (isNaN(this.inputFromTop)) {
                this.errors.templateFromTop = "From Top must be a positive number.";
            } else if (parseInt(this.inputFromTop) < 1) {
                this.errors.templateFromTop = "From Top must be a positive number.";
            }

            // check from left
            if (this.inputFromLeft.length == 0) {
                this.errors.templateFromLeft = "From Left must not be empty.";
            }
            if (isNaN(this.inputFromLeft)) {
                this.errors.templateFromLeft = "From Left must be a positive number.";
            } else if (parseInt(this.inputFromLeft) < 1) {
                this.errors.templateFromLeft = "From Left must be a positive number.";
            }

            // check between x
            if (this.inputBetweenX.length == 0) {
                this.errors.templateBetweenX = "Between X must not be empty.";
            }
            if (isNaN(this.inputBetweenX)) {
                this.errors.templateBetweenX = "Between X must be a positive number.";
            } else if (parseInt(this.inputBetweenX) < 1) {
                this.errors.templateBetweenX = "Between X must be a positive number.";
            }

            // check between y
            if (this.inputBetweenY.length == 0) {
                this.errors.templateBetweenY = "Between Y must not be empty.";
            }
            if (isNaN(this.inputBetweenY)) {
                this.errors.templateBetweenY = "Between Y must be a positive number.";
            } else if (parseInt(this.inputBetweenY) < 1) {
                this.errors.templateBetweenY = "Between Y must be a positive number.";
            }

            // check from bottom
            if (this.inputFromBottom.length == 0) {
                this.errors.templateFromBottom = "From Bottom must not be empty.";
            }
            if (isNaN(this.inputFromBottom)) {
                this.errors.templateFromBottom = "From Bottom must be a positive number.";
            } else if (parseInt(this.inputFromBottom) < 1) {
                this.errors.templateFromBottom = "From Bottom must be a positive number.";
            }

            // check from left dock
            if (this.inputFromLeftDock.length == 0) {
                this.errors.templateFromLeftDock = "From Left Dock must not be empty.";
            }
            if (isNaN(this.inputFromLeftDock)) {
                this.errors.templateFromLeftDock = "From Left Dock must be a positive number.";
            } else if (parseInt(this.inputFromLeftDock) < 1) {
                this.errors.templateFromLeftDock = "From Left Dock must be a positive number.";
            }

            // check max apps
            if (this.inputMaxApps.length == 0) {
                this.errors.templateMaxApps = "Max Apps must not be empty.";
            }
            if (isNaN(this.inputMaxApps)) {
                this.errors.templateMaxApps = "Max Apps must be a positive number.";
            } else if (parseInt(this.inputMaxApps) < 1) {
                this.errors.templateMaxApps = "Max Apps must be a positive number.";
            }

            // check dock count
            if (this.inputDockCount.length == 0) {
                this.errors.templateDockCount = "Dock Count must not be empty.";
            }
            if (isNaN(this.inputDockCount)) {
                this.errors.templateDockCount = "Dock Count must be a number between 0-4.";
            } else if (parseInt(this.inputDockCount) < 0 || parseInt(this.inputDockCount) > 4) {
                this.errors.templateDockCount = "Dock Count must be a number between 0-4.";
            }

            return this.newTemplateIsValid;
        },
        saveTemplate: function () {
            // utilize the "this" keyword

            if (!this.validateTemplate()) {
                return;
            }

            // setup data for fetch
            var data = "name=" + encodeURIComponent(this.inputTemplateName);
            data += "&phone_size_x=" + encodeURIComponent(this.inputPhoneSizeX);
            data += "&phone_size_y=" + encodeURIComponent(this.inputPhoneSizeY);
            data += "&app_size=" + encodeURIComponent(this.inputAppSize);
            data += "&from_top=" + encodeURIComponent(this.inputFromTop);
            data += "&from_left=" + encodeURIComponent(this.inputFromLeft);
            data += "&between_x=" + encodeURIComponent(this.inputBetweenX);
            data += "&between_y=" + encodeURIComponent(this.inputBetweenY);
            data += "&from_bottom=" + encodeURIComponent(this.inputFromBottom);
            data += "&from_left_dock=" + encodeURIComponent(this.inputFromLeftDock);
            data += "&max_apps=" + encodeURIComponent(this.inputMaxApps);
            data += "&dock_count=" + encodeURIComponent(this.inputDockCount);

            // check if we are replacing or updating
            var t; // save template found in case of replace
            if (this.uploadIphoneTemplates.find((template) => { // if template exists
                t = template;
                return template.name == this.inputTemplateName;
            })) {
                // change to put instead of post
                fetch(SERVER_ROOT + "/iphonetemplates/" + t._id, {
                    credentials: "include",
                    method: 'PUT',
                    body: data,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }).then((response) => {
                    // reload the list of pets
                    if (response.status == 201) {
                        this.fetchTemplatesFromServer();
                        this.cancelTemplate();
                    } else if (response.status == 403) {
                        console.error("Replace Failed, You are not the owner of this template.");
                        this.errors = {};
                        this.errors.fetchFailed = "Replace Failed, You are not the owner of this template.";
                    } else {
                        console.error("Replace Failed, Server Error.");
                        this.errors = {};
                        this.errors.fetchFailed = "Replace Failed, Server Error.";
                    }
                }).catch(() => {
                    console.log("Replace Failed, Server did not respond.")
                    this.errors = {};
                    this.errors.fetchFailed = "Replace Failed, Server did not respond.";
                });
            } else { // new template, posting
                fetch(SERVER_ROOT + "/iphonetemplates", {
                    credentials: "include",
                    method: 'POST',
                    body: data,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }).then((response) => {
                    // reload the list of pets
                    if (response.status == 201) {
                        this.fetchTemplatesFromServer();
                        this.cancelTemplate();
                    } else if (response.status == 403) {
                        console.error("Replace Failed, You are not the owner of this template.");
                        this.errors = {};
                        this.errors.fetchFailed = "Replace Failed, You are not the owner of this template.";
                    } else {
                        console.error("Create Failed, Server Error.");
                        this.errors = {};
                        this.errors.fetchFailed = "Create Failed, Server Error.";
                    }
                }).catch(() => {
                    console.log("Create Failed, Server did not respond.")
                    this.errors = {};
                    this.errors.fetchFailed = "Create Failed, Server did not respond.";
                });
            }
        },
        deleteTemplate: function () {
            var t; // save template found in case of replace
            if (this.uploadIphoneTemplates.find((template) => { // if template exists
                t = template;
                return template.name == this.inputTemplateName;
            })) {
                // change to put instead of post
                fetch(SERVER_ROOT + "/iphonetemplates/" + t._id, {
                    method: 'DELETE',
                }).then((response) => {
                    // reload the list of pets
                    if (response.status == 204) {
                        this.fetchTemplatesFromServer();
                        this.cancelTemplate();
                    } else {
                        console.log("Delete Failed, Server Error.")
                        this.errors = {};
                        this.errors.fetchFailed = "Delete Failed, Server Error.";
                    }
                }).catch(() => {
                    console.log("Delete Failed, Server did not respond")
                    this.errors = {};
                    this.errors.fetchFailed = "Delete Failed, Server did not respond.";
                });
            } else { // new template, posting
                console.log("Delete Failed, Template does not exist.")
                this.errors = {};
                this.errors.fetchFailed = "Delete Failed, Template does not exist."
            }
        },
        cancelTemplate: function () {
            this.fetchTemplatesFromServer();
            this.uploadTemplateEditing = false;
            this.uploadEditing = true;
            this.errors = {};
        },

        // complete Methods
        completeDownload: function () {
            console.log("Download started");
            var a = document.createElement("a");
            a.href = SERVER_ROOT + "/" + this.JOBID + "/download";
            a.setAttribute("download", "output.zip");
            a.click();
        },

        // page Methods
        pageContinue: function () {
            this.pageCounter++;
            this.pageDescription = this.pageDescriptions[this.pageCounter];
        },
        pageBack: function () {
            this.uploadBackgroundFile = null;
            this.uploadIconFiles = [];
            this.uploadEditing = false;
            this.JOBID = null
            this.uploadTemplateEditing = false;
            if (this.pageCounter == 4) { // if upload complete screen, skip processing screen
                this.pageCounter -= 2;
            } else if (this.pageCounter > 1) {
                this.pageCounter--;
                this.pageDescription = this.pageDescriptions[this.pageCounter];
            }
        },

        // database Methods
        fetchTemplatesFromServer: function () {
            fetch(SERVER_ROOT + "/iphonetemplates").then((response) => {
                response.json().then((data) => {
                    this.uploadIphoneTemplates = data;
                });
            });
        },

        // file upload Methods
        uploadSelectBackgroundFile: function (event) {
            this.uploadBackgroundFile = event.target.files[0];
            console.log(this.uploadBackgroundFile);
        },
        uploadSelectIconFiles: function (event) {
            this.uploadIconFiles = [];
            for (let i = 0; i < event.target.files.length; i++) {
                this.uploadIconFiles.push(event.target.files[i])
            }
            console.log(this.uploadIconFiles);
        },
    },
    computed: {
        TemplateNameIsInvalid: function () {
            return !!this.errors.templateName;
        },
        TemplatePhoneSizeXIsInvalid: function () {
            return !!this.errors.templatePhoneSizeX;
        },
        TemplatePhoneSizeYIsInvalid: function () {
            return !!this.errors.templatePhoneSizeY;
        },
        TemplateAppSizeIsInvalid: function () {
            return !!this.errors.templateAppSize;
        },
        TemplateFromTopIsInvalid: function () {
            return !!this.errors.templateFromTop;
        },
        TemplateFromLeftIsInvalid: function () {
            return !!this.errors.templateFromLeft;
        },
        TemplateBetweenXIsInvalid: function () {
            return !!this.errors.templateBetweenX;
        },
        TemplateBetweenYIsInvalid: function () {
            return !!this.errors.templateBetweenY;
        },
        TemplateFromBottomIsInvalid: function () {
            return !!this.errors.templateFromBottom;
        },
        TemplateFromLeftDockIsInvalid: function () {
            return !!this.errors.templateFromLeftDock;
        },
        TemplateMaxAppsIsInvalid: function () {
            return !!this.errors.templateMaxApps;
        },
        TemplateDockCountIsInvalid: function () {
            return !!this.errors.templateDockCount;
        },
        FetchFailed: function () {
            return !!this.errors.fetchFailed
        },
        newTemplateIsValid: function () {
            return Object.keys(this.errors).length == 0;
        },
        UserNameIsInvalid: function () {
            return !!this.errors.userName;
        },
        UserPasswordIsInvalid: function () {
            return !!this.errors.userPassword;
        },
        newUserIsValid: function () {
            return Object.keys(this.errors).length == 0;
        }
    },
    created: function () {
        console.log("App is loaded and ready.");
        this.fetchTemplatesFromServer();
    },
    mounted: function () {
        this.welcomeView = true;
        setTimeout(() => { this.welcomeView = false; }, 1000);
        setTimeout(() => { this.pageCounter = 1; }, 2800);
    },
    beforeDestroy: function () { },
});