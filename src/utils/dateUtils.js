module.exports.dateString =
    (date) => new Date(date).toLocaleString("en-gb", {hour12: false})
