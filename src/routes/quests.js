const {randomAlphaNumeric} = require("../utils/randomUtils");
const express = require('express');
const router = express.Router();
const authRouter = require('./auth')
const {dateString} = require('../utils/dateUtils')

const {
    addNewCode,
    createQuest,
    deleteQuest,
    deleteSessionsForQuest,
    queryQuest,
    queryQuests,
    querySessions,
    queryCodes,
    questExists,
    updateQuest
} = require('../db/queries');

module.exports = db => {

    router.use(authRouter(db));

    function generateCodeForId(id) {
        return id + '/' + randomAlphaNumeric(7).toUpperCase();
    }

    router.route('/quests')
        .get(async (request, response) => {
            const quests = await queryQuests(db);
            response.send(quests);
        })
        .post(async (request, response) => {
            const {name, isTeamNameRequired, isPhoneRequired} = request.body;
            if (!name) {
                response.status(400).send({error: 'Name must be empty'});
                return;
            }
            let id = randomAlphaNumeric(5)

            while (await questExists(db, id)) {
                id = randomAlphaNumeric(5)
            }
            const code = {
                questId: id,
                code: generateCodeForId(id),
                isGiven: false
            }
            const entry = {id, name, isTeamNameRequired, isPhoneRequired};

            if (isTeamNameRequired === null || isTeamNameRequired === undefined) {
                entry.isTeamNameRequired = false
            }
            if (isPhoneRequired === null || isPhoneRequired === undefined) {
                entry.isPhoneRequired = false
            }

            try {
                await createQuest(db, entry)
                await addNewCode(db, code)
                response.send({error: false})
            } catch (e) {
                response.status(400).send({error: "unable to create quest or adding first code"})
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
            const {questId} = request.params;
            deleteQuest(db, questId)
                .catch(e => {
                    console.log(e);
                    response.status(400).send({error: 'Unable to delete quest'})
                })
                .then(() => deleteSessionsForQuest(db, questId))
                .catch(() => response.status(400).send({error: 'Unable to delete sessions for quest'}))
                .then(() => response.send({error: false}))
        })

    router.get('/quests/:questId/sessions', async (request, response) => {
        const sessions = await querySessions(db, request.params.questId)
        const answer = sessions.map(session => {
                const {created, finished} = session
                const time = Math.floor((session.updated - session.created) / 1000)
                return {
                    ...session, time,
                    createdDate: dateString(created),
                    finishedDate: finished ? dateString(finished) : null
                }
            }
        )
        response.send(answer);
    })

    router.route('/quests/:questId/codes')
        .get(async (request, response) => {
            const codes = await queryCodes(db, request.params.questId)
            response.send(codes);
        })
        .post(async (request, response) => {
            let questId = request.params.questId;
            const codeObj = {
                code: generateCodeForId(questId),
                questId: questId,
                isGiven: false
            }
            try {
                await addNewCode(db, codeObj)
                const codes = await queryCodes(db, questId)
                if (codes.map(it => it.code).includes(codeObj.code)) {
                    response.send({error: false, codes: codes})
                } else {
                    response.status(400).send({error: 'Unable to add new code'})
                }
            } catch (e) {
                console.log(e)
                response.status(400).send({error: 'Unable to add new code'})
            }
        })

    return router
}
