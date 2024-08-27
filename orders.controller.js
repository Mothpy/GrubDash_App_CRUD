const path = require("path");

// Load the existing orders data from a file
const orders = require(path.resolve("src/data/orders-data"));

// Function to generate unique IDs for new orders
const nextId = require("../utils/nextId");

// Handlers for the /orders routes-------------------------------------------------------------------------

// List all orders
function list(req, res) {
  res.json({ data: orders });
}

// Create a new order
function create(req, res) {
  const {
    data: {
      deliverTo,
      mobileNumber,
      status,
      dishes,
    } = {},
  } = req.body;

  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };

  orders.push(newOrder);

  res.status(201).json({ data: newOrder });
}

// Read a specific order by ID
function read(req, res) {
  res.json({ data: res.locals.order });
}

// Update an existing order
function update(req, res) {
  const orderToUpdate = res.locals.order;
  const {
    data: {
      deliverTo,
      mobileNumber,
      status,
      dishes,
    } = {},
  } = req.body;

  orderToUpdate.deliverTo = deliverTo;
  orderToUpdate.mobileNumber = mobileNumber;
  orderToUpdate.status = status;
  orderToUpdate.dishes = dishes;

  res.json({ data: orderToUpdate });
}

// Delete an order by ID
function destroy(req, res) {
  const { id } = res.locals.order;
  const index = orders.findIndex((order) => order.id === id);

  if (index > -1) {
    orders.splice(index, 1);
  }

  res.sendStatus(204);
}

// Middleware functions-------------------------------

// Check if the request body contains a specific property
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (!data[propertyName]) {
      return next({ status: 400, message: `Order must include a ${propertyName}` });
    }
    next();
  };
}

// Validate the properties of the dishes in the order
function dishProperties(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  if (!dishes || !Array.isArray(dishes) || dishes.length === 0) {
    return next({ status: 400, message: `Order must include a dish` });
  }

  for (let i in dishes) {
    if (!dishes[i].quantity || !Number.isInteger(dishes[i].quantity) || dishes[i].quantity < 1) {
      return next({
        status: 400,
        message: `Dish ${dishes[i].id} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  next();
}

// Check if the order exists based on the orderId parameter
function orderExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (!foundOrder) {
    return next({ status: 404, message: `Order id not found: ${orderId}` });
  }
  res.locals.order = foundOrder;
  next();
}

// Check if the order's status is "pending" before allowing deletion
function orderStatus(req, res, next) {
  const { status } = res.locals.order;
  if (status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending.",
    });
  }
  next();
}

// Check if the order ID in the request body matches the orderId parameter
function matchIds(req, res, next) {
  const orderId = req.params.orderId;
  const { data: { id } = {} } = req.body;

  if (id && id !== orderId) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  }
  next();
}

// Prevent changes to an order if it has been delivered
function orderDelivered(req, res, next) {
  const { status } = res.locals.order;
  if (status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }
  next();
}

// Validate the order status in the request body
function statusInvalid(req, res, next) {
  const { data: { status } = {} } = req.body;
  const validStatuses = ["pending", "preparing", "out-for-delivery", "delivered"];

  if (!validStatuses.includes(status)) {
    return next({ status: 400, message: "Order status invalid" });
  }
  next();
}

// Exports -------------------------------------------------------------------------------
module.exports = {
  list,
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    dishProperties,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    matchIds,
    orderDelivered,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    bodyDataHas("status"),
    statusInvalid,
    dishProperties,
    update,
  ],
  destroy: [orderExists, orderStatus, destroy],
};
