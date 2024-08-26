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
      id, // Order ID (not typically provided for new orders)
      deliverTo, // Delivery address
      mobileNumber, // Contact number
      status, // Order status (optional)
      dishes = [({ id, name, description, image_url, price, quantity } = {})],
    } = {},
  } = req.body;

  // Create a new order object with a generated ID
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };

  // Add the new order to the orders array
  orders.push(newOrder);
  
  // Respond with the newly created order
  res.status(201).json({ data: newOrder });
  console.log(newOrder);
}

// Read a specific order by ID
function read(req, res) {
  const foundOrder = res.locals.order;
  res.json({ data: foundOrder });
}

// Update an existing order
function update(req, res) {
  const orderToUpdate = res.locals.order;
  const {
    data: {
      deliverTo, // Updated delivery address
      mobileNumber, // Updated contact number
      status, // Updated status
      dishes = [({ id, name, description, image_url, price, quantity } = {})],
    } = {},
  } = req.body;

  // Update the order properties
  orderToUpdate.deliverTo = deliverTo;
  orderToUpdate.mobileNumber = mobileNumber;
  orderToUpdate.status = status;
  orderToUpdate.dishes = dishes;

  // Respond with the updated order data
  res.json({ data: orderToUpdate });
}

// Delete an order by ID
function destroy(req, res) {
  const { id } = res.locals.order;
  const index = orders.findIndex((order) => order.id === id);
  
  // Remove the order from the array if found
  if (index > -1) {
    orders.splice(index, 1);
  }
  
  // Respond with a 204 No Content status
  res.sendStatus(204);
}

// Middleware functions-------------------------------

// Check if the request body contains a specific property
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Order must include a ${propertyName}` });
  };
}

// Validate the properties of the dishes in the order
function dishProperties(req, res, next) {
  const {
    data: {
      dishes = ([{ name, description, image_url, price, quantity } = {}] = []),
    } = {},
  } = req.body;

  if (!dishes || !Array.isArray(dishes) || dishes.length === 0) {
    // If dishes is not an array or is an empty array
    return next({ status: 400, message: `Order must include a dish` });
  }

  // Check if each dish has a valid quantity
  for (let i in dishes) {
    if (
      !dishes[i].quantity ||
      !Number.isInteger(dishes[i].quantity) ||
      dishes[i].quantity < 1
    ) {
      return next({
        status: 400,
        message: `Dish ${dishes[i].id} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  
  // If all checks pass, proceed to the next middleware
  return next();
}

// Check if the order exists based on the orderId parameter
function orderExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  
  // If the order doesn't exist, return a 404 error
  next({
    status: 404,
    message: `Order id not found: ${req.params.orderId}`,
  });
}

// Check if the order's status is "pending" before allowing deletion
function orderStatus(req, res, next) {
  const { id } = res.locals.order;
  const foundOrder = orders.find((order) => order.id === id);
  if (foundOrder.status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending.",
    });
  }
  return next();
}

// Check if the order ID in the request body matches the orderId parameter
function matchIds(req, res, next) {
  const orderId = req.params.orderId;
  const { data: { id } = {} } = req.body;
  
  if (!id) {
    // If there is no ID in the body, proceed
    return next();
  } else if (id !== orderId) {
    // If the ID in the body doesn't match the orderId, return a 400 error
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  } else {
    return next();
  }
}

// Prevent changes to an order if it has been delivered
function orderDelivered(req, res, next) {
  const order = res.locals.order;
  if (order.status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }
  return next();
}

// Validate the order status in the request body
function statusInvalid(req, res, next) {
  const { data: { status } = {} } = req.body;

  // List of valid statuses
  const validStatuses = ["pending", "preparing", "out-for-delivery", "delivered"];
  
  // Check if the status is valid
  if (validStatuses.includes(status)) {
    return next();
  } else {
    return next({ status: 400, message: "Order status invalid" });
  }
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
