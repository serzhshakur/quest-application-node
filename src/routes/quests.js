const express = require('express');
const router = express.Router();
const authRouter = require('./auth')

const {
    createQuest,
    deleteQuest,
    deleteSessionsForQuest,
    queryQuest,
    queryQuests,
    questExists,
    updateQuest
} = require('../dbUtils');

module.exports = db => {

    router.use(authRouter(db));

    router.route('/quests')
        .get(async (request, response) => {
            const quests = await queryQuests(db);
            response.send(quests);
        })
        .post(async (request, response) => {
            const { id, name } = request.body;
            if (!id || !name) {
                response.status(400).send({ error: 'Neither id nor name must be empty' });
                return;
            }
            const doesExist = await questExists(db, id);
            if (doesExist) {
                response.status(409).send({ error: "Quest with this id already exist" });
            } else {
                createQuest(db, request.body).then(() => response.send({ error: false }))
            }
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
        .delete(async (request, response) => {
            const { questId } = request.params;
            deleteQuest(db, questId)
                .catch(e => { console.log(e); response.status(400).send({ error: 'Unable to delete quest' }) })
                .then(() => deleteSessionsForQuest(db, questId))
                .catch(() => response.status(400).send({ error: 'Unable to delete sessions for quest' }))
                .then(() => response.send({ error: false }))
        })

    return router
}