const {MongoClient, Server} = require('mongodb');

class DB {
    constructor() {
        this.db = 'quests';
        this.host = process.env.MONGO_QUESTS_HOST;
        this.port = process.env.MONGO_QUESTS_PORT;
        this.user = process.env.MONGO_QUESTS_USER;
        this.password = encodeURIComponent(process.env.MONGO_QUESTS_PASS);
    }

    getUrl() {
        return `mongodb://${this.user}:${this.password}@${this.host}:${this.port}/${this.db}`;
    }

    connect(callback) {
        MongoClient.connect(
            this.getUrl(),
            {useNewUrlParser: true, useUnifiedTopology: true},
            (err, client) => {
                if (err) {
                    console.log(err);
                } else {
                    const db = client.db(this.db);
                    callback(db);
                }
                process.on('SIGINT', () => {
                    client.close((err, result) => {
                        if (err) {
                            console.log("Error occurred while trying to close connection to db \n", err);
                        }
                        process.exit(0);
                    });
                });
            });
    }

}

exports.DB = DB;