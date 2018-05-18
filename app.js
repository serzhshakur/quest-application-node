const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const questsRoute = require('./src/routes/quests');

const { DB } = require('./src/db');
const {
    createSessionAndGetId,
    queryQuest,
    queryQuestion,
    querySessionInfo,
    questExists,
    queryQuestIntro,
    queryQuestFinalWords,
    updateSession
} = require('./src/dbUtils');

const PORT = process.env.PORT || 8080;


app.use(bodyParser.text({
    type: "text/plain"
}));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser())

// https://stackoverflow.com/questions/42710057/fetch-cannot-set-cookies-received-from-the-server
let corsOptions = {
    credentials: true
}

if (process.env.CORS_ORIGIN) {
    corsOptions.origin = process.env.CORS_ORIGIN
}

app.use(cors(corsOptions));

//Frontend:
app.use(express.static('public'))

new DB().connect(db => {

    app.route('/questions')
        .get(async (request, response) => {
            const sessionId = request.cookies.id;
            const { questionIndex, questId, wrongAnswers, hintRetrievals } = await querySessionInfo(db, sessionId);
            const { questions } = await queryQuest(db, questId);
            const isEnd = questions.length === questionIndex;
            const body = { isEnd };
            if (!isEnd) {
                const { text, images } = questions[questionIndex];
                Object.assign(body, { text, images, wrongAnswers, hintRetrievals })
            }
            response.send(body);
        })

        .post(async (request, response) => {
            const userAnswer = request.body;
            const sessionId = request.cookies.id;
            let { questionIndex, questId, wrongAnswers } = await querySessionInfo(db, sessionId);
            const { answer } = await queryQuestion(db, questId, questionIndex);
            if (answer.toLowerCase() === userAnswer.toLowerCase()) {
                questionIndex++;
            } else {
                wrongAnswers++;
            }
            updateSession(db, sessionId, { questionIndex, wrongAnswers })
                .then(() => response.status(200).send({
                    wrongAnswers,
                    questionNumber: questionIndex
                })
                )
        })

    app.get('/questions/intro/', async (request, response) => {
        const sessionId = request.cookies.id;
        let { questId } = await querySessionInfo(db, sessionId);
        const intro = await queryQuestIntro(db, questId);
        response.send(intro);
    })

    app.get('/questions/final/', async (request, response) => {
        const sessionId = request.cookies.id;
        let { questId } = await querySessionInfo(db, sessionId);
        const finalWords = await queryQuestFinalWords(db, questId);
        response.send(finalWords);
    })

    app.get('/questions/hint/', async (request, response) => {
        const sessionId = request.cookies.id;
        let { questionIndex, questId, hintRetrievals } = await querySessionInfo(db, sessionId);
        const { hint } = await queryQuestion(db, questId, questionIndex);
        updateSession(db, sessionId, { 'hintRetrievals': ++hintRetrievals })
            .then(() => response.send({ hint, hintRetrievals }));
    })

    app.post('/sign-in', async (request, response) => {
        const questId = request.body;
        if (questId) {
            const exists = await questExists(db, questId);
            if (exists) {
                const sessionId = await createSessionAndGetId(db, questId);
                response.cookie('id', sessionId);
                response.status(200).send('ok');
            } else {
                response.status(400).send("Incorrect id provided");
            }
        }
    })

    app.use('/admin', questsRoute(db));

    app.get('*', (request, response) => response.sendfile('./public/index.html'));

    app.listen(PORT);

})
