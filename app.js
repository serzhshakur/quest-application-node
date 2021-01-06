const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const questsRoute = require('./src/routes/adminApi');

const {DB} = require('./src/db/db');
const {
    createSessionAndGetId,
    queryQuest,
    queryQuestion,
    querySessionInfo,
    isCodeAlreadyUsed,
    isCodeExists,
    questExists,
    queryQuestIntro,
    queryQuestFinalWords,
    updateSession,
    updateCodeState,
    finishSession
} = require('./src/db/queries');

const PORT = process.env.PORT || 8080;

// https://stackoverflow.com/questions/42710057/fetch-cannot-set-cookies-received-from-the-server
let corsOptions = {
    credentials: true
}

if (process.env.CORS_ORIGIN) {
    corsOptions.origin = process.env.CORS_ORIGIN
}

app
    .use(bodyParser.text({
        type: "text/plain"
    }))
    .use(bodyParser.urlencoded({
        extended: true
    }))
    .use(bodyParser.json())
    .use(cookieParser())
    .use(cors(corsOptions))
    //Frontend:
    .use(express.static('public'))

new DB().connect(db => {

    app.route('/questions')
        .get(async (request, response) => {
            const sessionId = request.cookies.id;
            const {
                questionIndex,
                questId,
                wrongAnswers,
                hintRetrievals
            } = await querySessionInfo(db, sessionId);
            const {questions} = await queryQuest(db, questId);
            const isEnd = questions.length === questionIndex;
            const body = {isEnd, questionNumber: questionIndex};
            if (!isEnd) {
                const {text, images} = questions[questionIndex];
                Object.assign(body, {text, images, wrongAnswers, hintRetrievals})
            }
            response.status(200).send(body);
        })

        .post(async (request, response) => {
            const userAnswer = request.body;
            const sessionId = request.cookies.id;
            let {questionIndex, questId, wrongAnswers} = await querySessionInfo(db, sessionId);
            const {answer} = await queryQuestion(db, questId, questionIndex);
            if (answer.toLowerCase().trim() === userAnswer.toLowerCase().trim()) {
                questionIndex++;
            } else {
                wrongAnswers++;
            }
            updateSession(db, sessionId, {questionIndex, wrongAnswers})
                .then(() => response.status(200).send({
                        wrongAnswers,
                        questionNumber: questionIndex
                    })
                )
        })

    app.get('/questions/intro/', async (request, response) => {
        const sessionId = request.cookies.id;
        if (!sessionId) {
            response.status(400).send({error: 'session id is null'});
        }
        let {questId} = await querySessionInfo(db, sessionId);
        const intro = await queryQuestIntro(db, questId);
        response.send(intro);
    })

    app.get('/questions/final/', async (request, response) => {
        const sessionId = request.cookies.id;
        const {created, finished, ...sessionInfo} = await finishSession(db, sessionId)
        const time = Math.floor((finished - created) / 1000);
        const finalWords = await queryQuestFinalWords(db, sessionInfo.questId);
        const result = {...finalWords, time, ...sessionInfo};
        response.send(result);
    })

    app.get('/questions/hint/', async (request, response) => {
        const sessionId = request.cookies.id;
        let {questionIndex, questId, hintRetrievals} = await querySessionInfo(db, sessionId);
        const {hint} = await queryQuestion(db, questId, questionIndex);
        updateSession(db, sessionId, {'hintRetrievals': ++hintRetrievals})
            .then(() => response.send({hint, hintRetrievals}));
    })

    app.post('/sign-in', async (request, response) => {
        const questCode = request.body;
        if (questCode && /\S*\/\S*/.test(questCode)) {
            const questId = questCode.split('/')[0]
            const questDoesExist = await questExists(db, questId)
            if (!questDoesExist) {
                response.status(400).send("Incorrect id provided")
                return
            }
            const codeDoesExist = await isCodeExists(db, questCode)
            if (!codeDoesExist) {
                response.status(400).send("Incorrect id provided")
                return
            }
            const isAlreadyUsed = await isCodeAlreadyUsed(db, questCode)
            if (!isAlreadyUsed) {
                const sessionId = await createSessionAndGetId(db, questId, questCode);
                await updateCodeState(db, questId,
                    {code: questCode, isGiven: true}
                )
                response.cookie('id', sessionId);
                response.send();
            } else {
                response.status(400).send({error: "Код уже был использован"});
            }
        } else response.status(400).send({error: "Incorrect id provided"});
    })

    app.route('/session')
        .put(async (request, response) => {
            const sessionId = request.cookies.id;
            const {name, phone} = request.body
            const {questId} = await querySessionInfo(db, sessionId)
            const {isTeamNameRequired, isPhoneRequired} = await queryQuest(db, questId)

            if (isTeamNameRequired && (!name || name.trim().length === 0)) {
                response.status(400).send({error: 'название команды не указано'});
            }
            if (isPhoneRequired) {
                if (!phone) {
                    response.status(400).send({error: 'телефон обязателен'});
                }
                if (!/\+?[0-9]{0,3}\W*(?:\d+\W*)+(\d{1,2})$/.test(phone)) {
                    response.status(400).send({error: 'телефон не соответствует формату'});
                }
            }

            updateSession(db, sessionId, {name, phone})
                .then(() => response.send())
        })
        .get(async (request, response) => {
            const sessionId = request.cookies.id
            if (!sessionId) {
                response.status(401).send()
            }
            querySessionInfo(db, sessionId)
                .then(result =>
                    result ? response.send(result) : response.status(401).send()
                )
        })
        .delete(async (request, response) => {
            response.clearCookie('id');
            response.send()
        })

    app.use('/my-admin', questsRoute(db));

    app.get('*', (request, response) => response.sendFile('./public/index.html'));

    app.listen(PORT);

})
