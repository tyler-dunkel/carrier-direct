var assert = require('assert');
var userFactory = require('./user-factory');
var VendingMachine = require('./vending-machine');
var chai = require('chai');
var mockData = require('./mock-data');
var expect = chai.expect;

describe('User Creation', function() {
   it('should create a user with 0 cash', function() {
       const user = userFactory.createUser();
       expect(user).to.be.a('Object');
       expect(user.cash).to.equal(0);
    });
   it('should create a user with 100 cents', function() {
       const user = userFactory.createUser({cash: 100});
       expect(user).to.be.a('Object');
       expect(user.cash).to.equal(100);
   });
});

describe('All Test Cases', function() {
    beforeEach(function() {
        admin = userFactory.createUser({}, 'dev-password');
        vend = new VendingMachine();
    });
    describe('case 1', function() {
        it('should allow user to buy twix', function() {
            admin.loadProducts(vend, mockData.mockProducts);
            const user = userFactory.createUser({cash: 100});
            let i = 0;
            while (i < 3) {
                user.addCoinToMachine(vend, 25);
                i++;
            }
            const product = user.checkCompartmentPrice(vend, 'twix');
            expect(product.price).to.equal(75);
            expect(user.products.length).to.equal(0);
            expect(user.cash).to.equal(25);
            expect(vend.moneyInTransaction).to.equal(75);
            expect(product.amount).to.equal(5);
            user.buyProduct(vend, product.slot);
            expect(user.products.length).to.equal(1);
            expect(user.products[0].name).to.equal('twix');
            expect(user.products[0].amount).to.equal(1);
            expect(vend.compartments[product.slot].amount).to.equal(4);
            expect(vend.moneyInDrawer).to.equal(75);
        });
    });
    describe('case 2', function() {
        it('should allow user to leave money in the machine', function() {
            admin.loadProducts(vend, mockData.mockProducts);
            const user = userFactory.createUser({cash: 100});
            let i = 0;
            while (i < 4) {
                user.addCoinToMachine(vend, 25);
                i++;
            }
            expect(user.cash).to.equal(0);
            expect(vend.moneyInTransaction).to.equal(100);
            const product = user.checkCompartmentPrice(vend, 'twix');
            user.buyProduct(vend, product.slot);
            expect(user.products.length).to.equal(1);
            expect(user.products[0].name).to.equal('twix');
            expect(user.products[0].amount).to.equal(1);
            expect(vend.compartments[product.slot].amount).to.equal(4);
            expect(vend.moneyInDrawer).to.equal(75);
            expect(user.cash).to.equal(25);
        });
    });
    describe('case 3', function() {
        it('should allow user to attempt purchase without enough money', function() {
            admin.loadProducts(vend, mockData.mockProducts);
            const user = userFactory.createUser({cash: 100});
            let i = 0;
            while (i < 5) {
                user.addCoinToMachine(vend, 10);
                i++;
            }
            expect(user.cash).to.equal(50);
            expect(vend.moneyInTransaction).to.equal(50);
            const product = user.checkCompartmentPrice(vend, 'twix');
            const result = user.buyProduct(vend, product.slot);
            expect(user.products.length).to.equal(0);
            expect(vend.moneyInTransaction).to.equal(50);
            expect(vend.compartments[product.slot].amount).to.equal(5);
            expect(result).to.equal(mockData.mockMessages.caseThree.message);
        });
    });
    describe('case 4', function() {
        it('should allow user to deposit 5 dollars in quarters', function() {
            admin.loadProducts(vend, mockData.mockProducts);
            const user = userFactory.createUser({cash: 500});
            const userTwo = userFactory.createUser({cash: 0});
            let i = 0;
            while (i < 20) {
                user.addCoinToMachine(vend, 25);
                i++;
            }
            expect(user.cash).to.equal(0);
            expect(vend.moneyInTransaction).to.equal(500);
            const twix = userTwo.checkCompartmentPrice(vend, 'twix');
            const spk = userTwo.checkCompartmentPrice(vend, 'Sour Patch Kids');
            const warhead = userTwo.checkCompartmentPrice(vend, 'Atomic Warheads');
            expect(twix.price).to.equal(75);
            expect(spk.price).to.equal(200);
            expect(warhead.price).to.equal(50);
            const result = userTwo.buyProduct(vend, warhead.slot);
            expect(result).to.equal(null);
            expect(userTwo.products.length).to.equal(1);
            expect(userTwo.products[0].name).to.equal('Atomic Warheads');
            expect(userTwo.products[0].amount).to.equal(1);
            expect(userTwo.cash).to.equal(450);
            let j = 0;
            while (j < 3) {
                userTwo.addCoinToMachine(vend, 25);
                j++;
            }
            userTwo.buyProduct(vend, twix.slot);
            expect(userTwo.products.length).to.equal(2);
            expect(userTwo.products[1].name).to.equal('twix');
            expect(userTwo.products[1].amount).to.equal(1);
            expect(vend.moneyInDrawer).to.equal(125);
        });
    });
    describe('case 5', function() {
        it('should pass case 5', function() {
            admin.loadProducts(vend, mockData.mockProducts);
            const user = userFactory.createUser({cash: 500});
            const userTwo = userFactory.createUser({cash: 500});
            let i = 0;
            while (i < 20) {
                user.addCoinToMachine(vend, 25);
                i++;
            }
            expect(vend.moneyInTransaction).to.equal(500);
            expect(user.cash).to.equal(0);
            expect(admin.cash).to.equal(0);
            admin.getMoneyFromMachine(vend);
            expect(admin.cash).to.equal(500);
            expect(vend.moneyInTransaction).to.equal(0);
            const compartments = new Array(vend.compartments.length).fill().map(function(_, i) {
                return i;
            });
            const twix = admin.checkCompartmentPrice(vend, 'twix');
            const spk = admin.checkCompartmentPrice(vend, 'Sour Patch Kids');
            const warhead = admin.checkCompartmentPrice(vend, 'Atomic Warheads');
            expect(twix.price).to.equal(75);
            expect(spk.price).to.equal(200);
            expect(warhead.price).to.equal(50);
            for (let j = 0; j < compartments.length; j++) {
                const price = vend.compartments[j].price;
                admin.setCompartmentPrice(vend, [j], price + 10);
            }
            expect(twix.price).to.equal(85);
            expect(spk.price).to.equal(210);
            expect(warhead.price).to.equal(60);
            const product = userTwo.checkCompartmentPrice(vend, 'twix');
            let h = 0;
            while (h < 4) {
                userTwo.addCoinToMachine(vend, 25);
                h++;
            }
            expect(vend.moneyInTransaction).to.equal(100);
            expect(userTwo.cash).to.equal(400);
            expect(userTwo.products.length).to.equal(0);
            userTwo.buyProduct(vend, product.slot);
            expect(userTwo.products.length).to.equal(1);
            expect(userTwo.products[0].name).to.equal('twix');
            let k = 0;
            while (k < 4) {
                userTwo.addCoinToMachine(vend, 25);
                k++;
            }
            userTwo.buyProduct(vend, product.slot);
            expect(userTwo.products.length).to.equal(2);
            expect(userTwo.products[1].name).to.equal('twix');
            let l = 0;
            while (l < 4) {
                userTwo.addCoinToMachine(vend, 25);
                l++;
            }
            userTwo.buyProduct(vend, product.slot);
            expect(userTwo.products.length).to.equal(3);
            expect(userTwo.products[0].name).to.equal('twix');
            admin.getMoneyFromMachine(vend);
            expect(admin.countMoney()).to.equal(755);
        });
    });
    describe('case 6', function() {
        it('should pass all of case 6', function() {
            admin.loadProducts(vend, mockData.mockProductsCaseSix);
            const user = userFactory.createUser({cash: 500});
            const userTwo = userFactory.createUser({cash: 500});
            const product = user.checkCompartmentPrice(vend, 'twix');
            let i = 0;
            while (i < 3) {
                user.addCoinToMachine(vend, 25);
                i++;
            }
            user.buyProduct(vend, product.slot);
            expect(user.products.length).to.equal(1);
            expect(user.products[0].name).to.equal('twix');
            let j = 0;
            while (j < 3) {
                user.addCoinToMachine(vend, 25);
                j++;
            }
            user.buyProduct(vend, product.slot);
            expect(user.products.length).to.equal(2);
            expect(user.products[1].name).to.equal('twix');
            let h = 0;
            while (h < 3) {
                userTwo.addCoinToMachine(vend, 25);
                h++;
            }
            const productTwo = userTwo.buyProduct(vend, product.slot);
            expect(productTwo).to.equal(mockData.mockMessages.caseSix.message);
            expect(vend.moneyInTransaction).to.equal(75);
            const spk = userTwo.checkCompartmentPrice(vend, 'Sour Patch Kids');
            let l = 0;
            while (l < 5) {
                userTwo.addCoinToMachine(vend, 25);
                l++;
            }
            expect(vend.moneyInTransaction).to.equal(200);
            const productThree = userTwo.buyProduct(vend, spk.slot);
            expect(productThree).to.equal(null);
            expect(userTwo.products.length).to.equal(1);
            expect(userTwo.products[0].name).to.equal('Sour Patch Kids');
        });
    })
});