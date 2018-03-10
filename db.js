const { MongoClient, Server } = require('mongodb');

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
        MongoClient.connect(this.getUrl(), (err, client) => {
            if (err) {
                console.log(err);
            } else {
                const db = client.db(this.db);
                callback(db);
            }
        });
    }

}

exports.DB = DB;