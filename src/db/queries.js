const {ObjectID} = require('mongodb');

function queryQuest(db, questId) {
    return db.collection('questions')
        .find({'id': questId})
        .project({_id: false}).toArray()
        .then(array => array[0])
        .catch(err => console.error(`Error while querying quest with id ${questId}`));
}

module.exports.queryQuest = queryQuest;

module.exports.queryQuestion = (db, questId, questionIndex) => {
    return queryQuest(db, questId)
        .then(quest => quest.questions[questionIndex]);
}

module.exports.queryQuestIntro = (db, questId) => {
    return queryQuest(db, questId)
        .then(({intro, isTeamNameRequired, isPhoneRequired}) => {
            return {intro, isTeamNameRequired, isPhoneRequired}
        });
}

module.exports.queryQuestFinalWords = (db, questId) => {
    return queryQuest(db, questId)
        .then(quest => quest.finalWords);
}

module.exports.questExists = (db, questId) => {
    return db.collection('questions')
        .find({'id': questId}).count()
        .catch(err => console.error("error while counting quests\n", err))
        .then(count => count > 0)
}

module.exports.queryCodes = (db, questId) => {
    return db.collection('questCodes')
        .find({questId: questId})
        .project({_id: false}).toArray()
        .catch(err => console.error("error while counting quest codes\n", err))
}

module.exports.isCodeExists = (db, questCode) => {
    return db.collection('questCodes')
        .find({code: questCode}).count()
        .catch(err => console.error("error while counting quest codes\n", err))
        .then(count => count > 0)
}

module.exports.isCodeAlreadyUsed = (db, questCode) => {
    const params = {
        questCode,
        finished: {'$ne': null}
    }
    return db.collection('sessions')
        .find(params).count()
        .catch(err => console.error("error while counting sessions\n", err))
        .then(count => count > 0)
}

module.exports.querySessionInfo = (db, sessionId) => {
    return db.collection('sessions')
        .find({'_id': new ObjectID(sessionId)})
        .project({_id: 0}).toArray()
        .catch(err => console.error(`Error while trying to get question info for session id ${sessionId}\n`, err))
        .then(array => array[0]);
}

module.exports.createSessionAndGetId = (db, questId, questCode) => {
    return db.collection('sessions')
        .insertOne(
            {
                'questId': questId,
                'questCode': questCode,
                'questionIndex': 0,
                'wrongAnswers': 0,
                'hintRetrievals': 0,
                "created": new Date(),
                "updated": new Date()
            })
        .catch(err => console.error(`Error while creating session for quest id ${questCode}\n`, err))
        .then((r) => r.insertedId.toString())
}

module.exports.updateSession = (db, sessionId, newValues) => {
    return db.collection('sessions')
        .updateOne({'_id': new ObjectID(sessionId)},
            {
                "$set": newValues,
                '$currentDate': {
                    'updated': true
                }
            }
        )
        .catch(err => console.error(`Error updating session ${sessionId}: `, err))
        .then(() => console.log(`successfully updated a session ${sessionId} with values ${JSON.stringify(newValues)}`));
}

module.exports.finishSession = (db, sessionId) => {
    return db.collection('sessions')
        .findOneAndUpdate({'_id': new ObjectID(sessionId)},
            {
                '$currentDate': {
                    'finished': true
                }
            },
            {
                returnOriginal: false,
                projection: {_id: false}
            }
        )
        .catch(err => console.error(`Error updating session ${sessionId}: `, err))
        .then(result => result.value);
}

/// Admin stuff

module.exports.queryQuests = db => {
    return db.collection('questions')
        .find({})
        .project({_id: false}).toArray()
        .catch(err => console.error("Error while querying quests:\n", err));
}

module.exports.createQuest = (db, quest) => {
    return db.collection('questions')
        .insertOne(quest)
        .catch(err => console.error(`Error while creating quest ${quest}`, err))
}

module.exports.deleteQuest = (db, questId) => {
    return db.collection('questions')
        .deleteOne({id: questId})
}

module.exports.deleteSessionsForQuest = (db, questId) => {
    return db.collection('questions')
        .deleteMany({questId})
}

function updateQuest(db, questId, newValues) {
    return db.collection('questions')
        .findOneAndUpdate(
            {id: questId},
            {"$set": newValues},
            {
                returnOriginal: false,
                projection: {_id: false}
            }
        )
        .catch(err => console.error(`Error updating quest ${questId}: `, err))
        .then(result => result.value);
}

module.exports.updateQuest = updateQuest

module.exports.addNewCode = async (db, newCode) => {
    return db.collection('questCodes')
        .insertOne(newCode)
        .catch(err => console.error(`Error inserting code ${newCode.code}: \n`, err))
        .then(result => result.value);
}

module.exports.updateCodeState = (db, questId, codeValues) => {
    return db.collection('questCodes')
        .findOneAndUpdate(
            {code: codeValues.code},
            {"$set": codeValues},
            {
                returnOriginal: false,
                projection: {_id: false}
            }
        )
        .catch(err => console.error(`Error editing code ${codeValues.code}: `, err))
        .then(result => result.value);
}

module.exports.querySessions = (db, questId) => {
    return db.collection('sessions')
        .find({'questId': questId})
        .sort({'updated': -1})
        .project({_id: false}).toArray()
        .catch(err => console.error("Error while querying sessions:\n", err));
}

module.exports.getUser = (db, username) => {
    return db.collection('users')
        .find({'username': username})
        .project({_id: false})
        .toArray()
        .catch(err => console.error(`Error getting a user ${username}: `, err))
        .then(arr => arr[0])
}