const express = require('express');
const router = express.Router();
const authRouter = require('./auth')

const {
    createQuest,
    queryQuest,
    queryQuests,
    updateQuest
} = require('../dbUtils');

module.exports = db => {

    router.use(authRouter(db));

    router.route('/quests')
        .get(async (request, response) => {
            const quests = await queryQuests(db);
            response.send(quests);
        })
        .post((request, response) => {
            createQuest(db, request.body).then(() => response.send())
        })

    router.route('/quests/:questId')
        .get(async (request, response) => {
            const quest = await queryQuest(db, request.params.questId);
            response.send(quest);
        })
        .put(async (request, response) => {
            const quest = await updateQuest(db, request.params.questId, request.body);
            response.send(quest);
        })

    return router
}