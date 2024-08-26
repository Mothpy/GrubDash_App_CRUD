const router = require("express").Router();
const controller = require("./dishes.controller");
const methodNotAllowed = require("../errors/methodNotAllowed");
const notFound = require("../errors/notFound");
const errorHandler = require("../errors/errorHandler");

// route for dishes list 
router.route("/")
    .get(controller.list)       // list all dishes
    .post(controller.create)    // create a new dish 
    .all(methodNotAllowed);

// route for dishId 
router.route("/:dishId")
    .get(controller.read)       // get a dish by ID 
    .put(controller.update)     // update a dish by ID 
    .all(methodNotAllowed);

module.exports = router;
