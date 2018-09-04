'use strict';
//TODO: work on moving some variables to being private with accessors
const userFactory = require('./user-factory');
const constants = require('./constants');
const _ = require('lodash');

const Admin = userFactory.adminClass;

/**
 * @Class VendingMachine
 * @description - A class for users to interface with by which to purchase products and discover product prices. Also allows for an admin user to add products
 *
 */
function VendingMachine(products) {
    this.compartments = products || []; //compartments for each product to go into.
    this.moneyInTransaction = 0; //money in the current user's transaction
    this.moneyInDrawer = 0; //The money that has been 'earned' by the vending machine
    this.history = []; //history of product bought from the machine
}

/**
 * @function _compareProductPriceToTotal
 * @param product - {Object} the selected product
 * @return Boolean
 */
VendingMachine.prototype.compareProductPriceToMoneyInTransaction = function(product) {
    //product.price always in cents even if the cost is over $1
    return product.price <= this.moneyInTransaction;
};

/**
 * @function _printProductDetails
 * @param product - {Object} the selected product
 * @param keys - {Array} the keys of the product to print
 * @private
 */
VendingMachine.prototype._printProductDetails = function(product, keys) {
    keys.forEach(function(key) {
        if (product.hasOwnProperty(key)) {
            console.log(key);
        }
    });
};

/**
 * @function _handleNoProductFound
 */
VendingMachine.prototype.handleNoProductFound = function() {
    return {
        product: null,
        change: null,
        message: 'Please make another selection.'
    };
};

/**
 *
 * @param buttonNumber - {Number} the button number a user enters corresponding to a product number
 * @private
 */
VendingMachine.prototype._handleUserButtonFlow = function(buttonNumber) {
    if (!this.compartments.length > 0) {
        return "sorry vending machine is empty!";
    }
    const product = _.find(this.compartments, function(product) { return product.slot === buttonNumber });

    if (product && product.amount > 0) {
        return this.compareProductPriceToMoneyInTransaction(product) ? this.dispenseProduct(product) : this.handleNeedMoreMoney(product);
    }
    return this.handleNoProductFound(buttonNumber);
};

/**
 *
 * @param product
 * @return {String}
 */
VendingMachine.prototype.handleNeedMoreMoney = function(product) {
    const difference = product.price - this.moneyInTransaction;
    const priceInDollars = difference / 100;
    return {
        product: null,
        change: null,
        message: `Please add ${priceInDollars.toLocaleString("en-US", {style:"currency", currency:"USD"})}`
    };
};

/**
 * @function buttonPress
 * @param buttonNumber - {Number} the button number a user enters corresponding to a product number or special command
 */
VendingMachine.prototype.buttonPress = function(buttonNumber) {
    if (isNaN(buttonNumber)) {
        return console.log('please enter a valid number');
    }
        return this._handleUserButtonFlow(buttonNumber);
};

/**
 *@function addChange
 * @param amount - amount of money to add to the current transaction
 */
VendingMachine.prototype.addChange = function(amount) {
    if (constants.ACCEPTABLE_CHANGE.indexOf(amount) > -1) {
        return this.moneyInTransaction += amount;
    }
    return false;
};

/**
 *
 * @param compartmentId
 * @return {Number}
 */
VendingMachine.prototype.getCompartmentPrice = function(compartmentName) {
    const product = _.find(this.compartments, function(product) { return product.name === compartmentName });
    return product ? product : null;
};

/**
 *
 * @param slots - array of slots to change the price of
 * @param price
 */
VendingMachine.prototype.setCompartmentPrice = function(slots, price) {
    var _this = this;
    slots.forEach(function(slot) {
        const product = _.find(_this.compartments, function(product) { return product.slot === slot });
        if (product) {
            product.price = price
        }
    });
};

/**
 *
 * @param products
 */
VendingMachine.prototype.loadProducts = function(products) {
    const _this = this;
    const mappedProducts = products.map(function(product) {
        return {
            name: product.name,
            price: product.price,
            amount: product.amount > 10 ? 10 : product.amount
        }
    });

    mappedProducts.forEach(function(prod) {
        const productAlreadyPresent = _.find(_this.compartments, function(productInMachine) { return prod.name === productInMachine.name});
        const vendingMachineFull = _this.compartments > 10;
        if (!productAlreadyPresent && !vendingMachineFull) {
            prod.slot = _this.compartments.length;
            return _this.compartments.push(prod);
        }
        if (productAlreadyPresent && (productAlreadyPresent.amount + prod.amount) < 10) {
            productAlreadyPresent.amount += prod.amount;
        }
    });
};

/**
 *
 * @return {Number} - cash from the machine given by money in the drawer and any money left over in a transaction
 */
VendingMachine.prototype.dispenseMoneyInMachine = function() {
  const cash = this.moneyInDrawer + this.moneyInTransaction;
  this.moneyInDrawer = this.moneyInTransaction = 0;
  return cash;
};

/**
 *
 * @param product
 * @return {{product: Object, change: Number}}
 */
VendingMachine.prototype.dispenseProduct = function(product) {
    this.moneyInTransaction -= product.price;
    this.moneyInDrawer += product.price;
    product.amount -= 1;
    this.history.push({
        action: 'dispenseProduct',
        data: {
            product
        }
    });
    var productToReturn = _.clone(product);
    productToReturn.amount = 1;
    return {
        product: productToReturn,
        change: this.dispenseChange(),
        message: null
    };
};

/**
 *
 * @return {{fifty: Number, quarter: Number, dime: Number, nickel: Number, penny: Number}}
 */
VendingMachine.prototype.dispenseChange = function() {
    const coins = {
        fifty: 0,
        quarter: 0,
        dime: 0,
        nickel: 0,
        penny: 0
    };

    while (this.moneyInTransaction > 0) {
        while (this.moneyInTransaction >= 50) {
            coins.fifty++;
            this.moneyInTransaction -= 50;
        }
        while (this.moneyInTransaction >= 25) {
            coins.quarter++;
            this.moneyInTransaction -= 25;
        }
        while (this.moneyInTransaction >= 10) {
            coins.dime++;
            this.moneyInTransaction -= 10;
        }
        while (this.moneyInTransaction >= 5) {
            coins.nickel++;
            this.moneyInTransaction -= 5;
        }
        while (this.moneyInTransaction >= 1) {
            coins.penny++;
            this.moneyInTransaction -= 1;
        }
    }

    return coins;
};

module.exports = VendingMachine;