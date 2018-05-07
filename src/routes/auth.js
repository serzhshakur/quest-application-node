const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const { getUser } = require('../dbUtils');

const JWT_SECRET_TOKEN = process.env.JWT_SECRET_TOKEN
const TOKEN_EXPIRATION_PERIOD = '20h'

module.exports = db => {
    router.route('/login')
        .post(async (req, res) => {
            const { username, password } = req.body;
            const userData = await getUser(db, username);

            if (!userData) {
                res.status(401).send('no such user');
            }

            const isPasswordCorrect = bcrypt.compareSync(password, userData.password);

            if (isPasswordCorrect) {
                const payload = {
                    username: userData.username,
                    id: userData.id
                }
                const token = jwt.sign(payload, JWT_SECRET_TOKEN, { expiresIn: TOKEN_EXPIRATION_PERIOD });
                res.status(200).send({ token })
            } else {
                res.status(401).send('incorrect password');
            }
        })

    router.use((req, res, next) => {
        var token = req.headers['x-access-token'];
        if (token) {
            jwt.verify(token, JWT_SECRET_TOKEN, err => {
                if (!err) {
                    next();
                } else {
                    res.status(403).send(`${err.name}: ${err.message}`);
                }
            })
        } else {
            res.status(401).send('Authorization failed! No token provided!');
        }
    })

    return router;
}