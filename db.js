const { MongoClient, Server } = require('mongodb');

class DB {
    constructor() {
        this.client = MongoClient;
        this.host = process.env.MONGO_QUESTS_HOST;
        this.port = process.env.MONGO_QUESTS_PORT;
        this.user = process.env.MONGO_QUESTS_USER;
        this.password = process.env.MONGO_QUESTS_PASS;
    }

    getUrl() {
        return `mongodb://${this.user}:${this.password}@${this.host}:${this.port}/quests`
    }

    connect(callback) {
        this.client.connect(this.getUrl(), (err, db) => {
            if (err) {
                console.log(err);
            } else {
                callback(db);
            }
        });
    }

}

exports.DB = DB;