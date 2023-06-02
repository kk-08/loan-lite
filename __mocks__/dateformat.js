module.exports = jest.fn((date, formatString) => {
    //Should return string only
    return `${date}|${formatString}`;
});