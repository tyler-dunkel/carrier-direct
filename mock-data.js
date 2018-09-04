var mockProducts = [
    {
        name: 'Sour Patch Kids',
        price: 200,
        amount: 10
    },
    {
        name: 'twix',
        price: 75,
        amount: 5
    },
    {
        name: 'Atomic Warheads',
        price: 50,
        amount: 3
    }
];

var mockProductsCaseSix = [
    {
        name: 'Sour Patch Kids',
        price: 200,
        amount: 2
    },
    {
        name: 'twix',
        price: 75,
        amount: 2
    },
    {
        name: 'Atomic Warheads',
        price: 50,
        amount: 2
    }
];

mockMessages = {
    caseThree: {
        message: 'Please add $0.25'
    },
    caseSix: {
        message: 'Please make another selection.'
    }
};

module.exports = {
    mockProducts: mockProducts,
    mockMessages: mockMessages,
    mockProductsCaseSix: mockProductsCaseSix
};