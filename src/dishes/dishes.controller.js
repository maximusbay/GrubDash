const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");


function dishExists(req, res, next) {
    const { dishId } = req.params
    const foundDish = dishes.find((dish) => dish.id === String(dishId))

    if (foundDish) {
        res.locals.dish = foundDish
        return next()
    }
    next({
        status: 404,
        message: `Dish id not found: ${dishId}`
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
          message: `Dish must include a ${propertyName}`
      });
    };
}

function priceIsValidNumber(req, res, next) {
  const { data: { price }  = {} } = req.body;
  if (price <= 0 || !Number.isInteger(price)){
      return next({
          status: 400,
          message: `Dish must have a price that is an integer greater than 0`
      });
  }
  next();
}

function idValidation(req, res, next) {
  const { dishId } = req.params;
  const { data } = req.body;
  const id = data.id
  
  if (id && id !== dishId) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }

  next();
}
// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res) {
    res.json({ data: dishes})
}

function read(req, res) {
    res.json({ data: res.locals.dish });
}

function create(req, res) {
    const { data: { name, description, price, image_url} = {} } = req.body
    const newDish = {
        id: nextId(),
        name: name,
        description: description,
        price: price,
        image_url: image_url,
    }
    dishes.push(newDish)
    res.status(201).json({ data: newDish })
}

function update(req, res) {
    
    const { data: { name, description, price, image_url } = {} } = req.body;
   
    // Update the dish
    res.locals.dish = {
		id: res.locals.dish.id,
		name: name,
		description: description,
		price: price,
		image_url: image_url,
	}
    res.json({ data: res.locals.dish });
   
}


module.exports = {
    list,
    read: [dishExists, read],
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        priceIsValidNumber,
        create
    ],
    update: [
      dishExists,
      bodyDataHas("name"),
      bodyDataHas("description"),
      bodyDataHas("price"),
      bodyDataHas("image_url"),
      priceIsValidNumber,
      idValidation,
      update,
    ],
}