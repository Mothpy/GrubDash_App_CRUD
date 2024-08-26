const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Utility function to generate unique IDs for new dishes
const nextId = require("../utils/nextId");

// Handlers -------------------------------------------------------------------------------------

// List all dishes
function list(req, res) {
    res.json({ data: dishes });
}

// Create a new dish
function create(req, res) {
    const { data: { name, description, price, image_url } = {} } = req.body;

    // Create a new dish object with a unique ID
    const newDish = {
        id: nextId(),
        name,
        description,
        price,
        image_url,
    };

    // Add the new dish to the dishes array
    dishes.push(newDish);

    // Respond with the newly created dish
    res.status(201).json({ data: newDish });
    console.log(newDish);
}

// Retrieve a specific dish by ID
function read(req, res) {
    const foundDish = res.locals.dish;
    res.json({ data: foundDish });
}

// Update an existing dish
function update(req, res, next) {
    const foundDish = res.locals.dish;
    const { data: { id, name, description, price, image_url } = {} } = req.body;

    // Update the dish's properties with the new data
    foundDish.name = name;
    foundDish.description = description;
    foundDish.price = price;
    foundDish.image_url = image_url;

    // Respond with the updated dish
    res.json({ data: foundDish });
}

// Middleware -----------------------------------------------------------------------------------

// Middleware to check if a specific property exists in the request body
function bodyDataHas(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[propertyName]) {
            return next();
        }
        next({ status: 400, message: `Dish must include a ${propertyName}` });
    };
}

// Middleware to validate that the price is an integer greater than 0
function hasPrice(req, res, next) {
    const { data: { price } = {} } = req.body;
    if (price <= 0 || !Number.isInteger(price)) {
        return next({
            status: 400,
            message: "Dish must have a price that is an integer greater than 0",
        });
    } else {
        next();
    }
}

// Middleware to check if a dish exists based on the dishId parameter
function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish) {
        res.locals.dish = foundDish;
        return next();
    }
    next({
        status: 404,
        message: `Dish not found: ${dishId}`,
    });
}

// Middleware to ensure the ID in the request body matches the dishId parameter
function idMatch(req, res, next) {
    const { data: { id } = {} } = req.body;
    const { dishId } = req.params;
    if (id) {
        if (dishId !== id) {
            return next({
                status: 400,
                message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
            });
        } else {
            next();
        }
    }
    next();
}

// Exports --------------------------------------------------------------------------------------

module.exports = {
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        hasPrice,
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        create,
    ],
    read: [dishExists, read],
    update: [
        dishExists,
        bodyDataHas("name"),
        bodyDataHas("description"),
        hasPrice,
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        idMatch,
        update,
    ],
    list,
};
