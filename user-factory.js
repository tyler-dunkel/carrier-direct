var md5 = require('md5');
var constants = require('./constants');

module.exports = {
    createUser: function(details, adminPassword) {
        if (adminPassword && md5(adminPassword) === constants[`password:${process.env.NODE_ENV || 'dev'}`]) { //use a hashed password to see if user is admin
            return new Admin(details || {});
        } else {
            return new User(details || {});
        }
    },
    adminClass: Admin
};

/**
 *
 * @param details
 * @constructor User
 */
function User(details) {
    this.timeout = null;
    this.history = [];
    this.cash = details.cash || 0;
    this.products = [];
}

/**
 *
 * @param machine - {Object} The machine the user is interacting with
 * @param amount - {Number} The coin to be added in cents
 */
User.prototype.addCoinToMachine = function(machine, amount) {
    if (this.cash >= amount) {
        var machineTotal = machine.addChange(amount);
        if (machineTotal) {
           this.cash -= amount;
           this.history.push({
               action: 'addCoin',
               data: {
                   amount: amount
               }
           });
        }
    }
};

/**
 *
 * @param machine - {Object} The machine the user is interacting with
 * @param compartment - {String} the name of the product in that compartment to price check
 */
User.prototype.checkCompartmentPrice = function(machine, compartment) {
    const product = machine.getCompartmentPrice(compartment);
    if (product !== null) {
        this.history.push({
            action: 'checkPrice',
            data: {
                compartment: compartment,
                product: product
            }
        });
    }
    return product;
};

/**
 *
 * @param machine - {Object} The machine the user is interacting with
 * @param compartment - {Number} Id of the compartment to buy from the machine
 */
User.prototype.buyProduct = function(machine, compartment) {
    const resultOfMachine = machine.buttonPress(compartment);
    if (resultOfMachine.product) {
        this.products.push(resultOfMachine.product);
        this.cash += this.convertChangeToCash(resultOfMachine.change);
        this.history.push({
            'action': 'buyProduct',
            data: {
                product: resultOfMachine.product
            }
        });
        return null;
    } else {
        return resultOfMachine.message;
    }
}

User.prototype.convertChangeToCash = function(change) {
    let cash = 0;
    change.fifty > 0 ? cash += 50*change.fifty : cash += 0;
    change.quarter > 0 ? cash += 25*change.quarter : cash += 0;
    change.dime > 0 ? cash += 10*change.dime : cash += 0;
    change.nickel > 0 ? cash += 5*change.nickel : cash += 0;
    change.penny > 0 ? cash += 1*change.penny : cash += 0;
    return cash;
}

/**
 *
 * @param amount - amount of cash to add to the user
 */
User.prototype.addCashToUser = function(amount) {
    console.log('adding cash to user');
    console.log(amount);
    if (!isNaN(amount)) {
        !isNaN(this.cash) ? this.cash += amount : this.cash = amount;
    }
};

/**
 *
 * @param details
 * @constructor
 */
function Admin(details) {
    User.call(this, details);
    this.adminId = null;
}

/**
 *
 * @type {User}
 * setting the prototype and fixing the constructor class
 */
Admin.prototype = Object.create(User.prototype);
Admin.prototype.constructor = Admin;

/**
 *
 * @param machine - {Object} The machine the user is interacting with
 * @param products - {Array} products to load into the machine
 */
Admin.prototype.loadProducts = function(machine, products) {
    machine.loadProducts(products);
    this.history.push({
        action: 'loadProducts',
        data: products
    });
};

/**
 *
 * @param machine - {Object} The machine the user is interacting with
 * @param compartmentsToChange - {Array} array of compartment ids to change the price of
 * @param price - {Number} price to set the compartments to in cents
 */
Admin.prototype.setCompartmentPrice = function(machine, compartmentsToChange, price) {
    machine.setCompartmentPrice(compartmentsToChange, price);
    this.history.push({
        action: 'setPrice',
        data: {
            compartments: compartmentsToChange,
            price: price
        }
    });
};

/**
 *
 * @param machine - {Object} The machine the user is interacting with
 */
Admin.prototype.getMoneyFromMachine = function(machine) {
    var cashFromMachine = machine.dispenseMoneyInMachine();
    this.cash += cashFromMachine;
    this.history.push({
        action: 'getMoneyFromMachine',
        data: {
            cash: cashFromMachine
        }
    });
};

/**
 *
 * @return {Number}
 */
Admin.prototype.countMoney = function() {
    this.history.push({
       action: 'countMoney',
       data: {
           cash: this.cash
       }
    });
    return this.cash;
};