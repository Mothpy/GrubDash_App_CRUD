const router = require("express").Router();
const controller = require("./orders.controller");
const methodNotAllowed = require("../errors/methodNotAllowed");
const notFound = require("../errors/notFound");
const errorHandler = require("../errors/errorHandler");

// TODO: Implement the /orders routes needed to make the tests pass

router
  .route("/")
  .get(controller.list)          // list all orders 
  .post(controller.create)      // create new order 
  .all(methodNotAllowed);
router
  .route("/:orderId")
  .get(controller.read)         // read an order by ID
  .put(controller.update)       // update an order by ID 
  .delete(controller.destroy)   // delete an order by ID 
  .all(methodNotAllowed);

module.exports = router;