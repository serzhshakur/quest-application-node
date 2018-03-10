const { ObjectID } = require('mongodb');

function queryQuest(db, questId) {
    return db.collection('questions')
        .find({ 'id': questId }).toArray()
        .then(array => array[0])
        .catch(err => console.error(`Error while quering quest with id ${questId}`));
}

module.exports.queryQuest = queryQuest;

module.exports.queryQuestion = (db, questId, questionIndex) => {
    return queryQuest(db, questId)
        .then(quest => quest.questions[questionIndex]);
}

module.exports.queryQuestIntro = (db, questId) => {
    return queryQuest(db, questId)
        .then(quest => quest.intro);
}

module.exports.queryQuestFinalWords = (db, questId) => {
    return queryQuest(db, questId)
        .then(quest => quest.finalWords);
}

module.exports.questExists = (db, questId) => {
    return db.collection('questions')
        .find({ 'id': questId }).count()
        .catch(err => console.error("error while counting quests"))
        .then(count => count > 0)
}

module.exports.querySessionInfo = (db, sessionId) => {
    return session = db.collection('sessions')
        .find({ '_id': new ObjectID(sessionId) }).toArray()
        .catch(err => console.error(`Error while trying to get question info for session id ${sessionId}`))
        .then(array => array[0]);
}

module.exports.createSessionAndGetId = (db, questId) => {
    return db.collection('sessions')
        .insertOne(
            {
                'questId': questId,
                'questionIndex': 0,
                'wrongAnswers': 0,
                'hintRetrievals': 0
            })
        .catch(err => console.error(`Error while creating session for quest id ${questId}`))
        .then((r) => r.insertedId.toString())
}

module.exports.updateSession = (db, sessionId, newValues) => {
    return db.collection('sessions')
        .updateOne({ '_id': new ObjectID(sessionId) }, { "$set": newValues })
        .catch(err => console.error(`Error updating session ${sessionId}: `, err))
        .then(() => console.log(`successfully updated a session ${sessionId} with values ${JSON.stringify(newValues)}`));
}