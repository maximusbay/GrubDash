const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

function orderExists(req, res, next) {
    const { orderId } = req.params
    const foundOrder = orders.find((order) => order.id === String(orderId))

    if (foundOrder) {
        res.locals.order = foundOrder
        return next()
    }
    next({
        status: 404,
        message: `Order id not found: ${orderId}`
    })
}

function bodyDataHas(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName]) {
        return next();
      }
      next({
          status: 400,
          message: `Must include a ${propertyName}`
      });
    };
}

function validateOrderId(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (foundOrder) {
    const { data = {} } = req.body;
    if (data.id && data.id !== orderId) {
      return next({
        status: 400,
        message: `Order id does not match route id. Order: ${data.id}, Route: ${orderId}.`,
      });
    }

    res.locals.order = foundOrder;
    return next();
  }

  next({
    status: 404,
    message: `Order id does not exist: ${orderId}`,
  });
}

function validateDishes(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  if (!Array.isArray(dishes) || dishes.length === 0) {
    return next({
      status: 400,
      message: "Order must include a non-empty 'dishes' array",
    });
  }

  for (let i = 0; i < dishes.length; i++) {
    const dish = dishes[i];
    if (!dish.quantity || dish.quantity <= 0 || !Number.isInteger(dish.quantity)) {
      return next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0`,
      });
    }
  }

  next();
}

function validateStatus(req, res, next) {
  const { data: { status } = {} } = req.body;

  // Check if 'status' is valid
  const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
  if (!validStatus.includes(status)) {
    return next({
      status: 400,
      message: `Invalid 'status' value. Must be one of: ${validStatus.join(", ")}`,
    });
  }

  next();
}

function validateDestroy(req, res, next) {
	if(res.locals.order.status !== "pending") {
		return next({
			status: 400,
			message: "An order cannot be deleted unless it is pending",
		});
	}

	next();
}

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res) {
  res.json({ data: orders })
}

function read(req, res) {
    res.json({ data: res.locals.order });
}

function create(req, res) {
    const { data: { deliverTo, mobileNumber, status, dishes} = {} } = req.body
    const newOrder = {
        id: nextId(),
        deliverTo: deliverTo,
        mobileNumber: mobileNumber,
        status: status,
        dishes: dishes,
    }
    orders.push(newOrder)
    res.status(201).json({ data: newOrder })
}

function update(req, res) {
   
    const { data: { deliverTo, mobileNumber, status, dishes} = {} } = req.body
   
    // Update the dish
   res.locals.order = {
		id: res.locals.order.id,
		deliverTo: deliverTo,
		mobileNumber: mobileNumber,
		dishes: dishes,
		status: status,
	}

    res.json({ data: res.locals.order });
    }


function destroy(req, res) {
  const index = orders.indexOf(res.locals.order)
  // `splice()` returns an array of the deleted elements, even if it is one element
  const deletedOrder = orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  read: [orderExists, read],
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"), 
    bodyDataHas("dishes"),
    validateDishes,
    create
  ],
  update: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"), 
    bodyDataHas("status"),
    bodyDataHas("dishes"),
    validateOrderId,
    validateStatus,
    validateDishes,
    update
  ],
  destroy: [orderExists, validateDestroy, destroy]
}