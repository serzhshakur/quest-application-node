function randomAsciiChar(from, to) {
    return Math.floor(Math.random() * (to - from + 1) + from)
}

function randomBool() {
    const val = Math.floor(Math.random() * 10)
    return val % 2 > 0
}

module.exports.randomAlphaNumeric = (len) => {
    return Array(len)
        .fill()
        .map(() => {
            const rand = randomBool()
                ? randomAsciiChar(97, 122)
                : randomAsciiChar(48, 57)
            return String.fromCharCode(rand)
        })
        .join('')
}

function randomAlphabetic(len) {
    return Array(len)
        .fill()
        .map(() => {
            const rand = randomAsciiChar(97, 122) // a-z
            return String.fromCharCode(rand)
        })
        .join('')
}
