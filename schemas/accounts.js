const files = require("./filesSchema");
const sessions = require("./sessions");
module.exports.accounts = {
    userName: {type: String, unique: true},
    password: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    firstName: {type: String},
    lastName: {type: String},
    role: {type: String, default: "user"},
    created: {type: Date, default: Date.now},
    updated: {type: Date, default: Date.now},
    api_key: {type: String, required: true, unique: true},
    active: {type: Boolean, default: true},
    usage: {type: Number, default: 0},
    max_usage: {type: Number, default: 1024},
    files: [{type: files.filesSchema}],
    session: {type: sessions.sessions}
}

module.exports.graph = `
    account(id: ID!): account
`
module.exports.graphQLSchema = `
    type account {
        userName: String!
        password: String!
        email: String!
        firstName: String!
        lastName: String!
        role: String
        created: String!
        updated: String!
        api_key: String!
        active: Boolean!
        usage: Int!
        max_usage: Int!
        files: [File]
    }
`
module.exports.graphResolver = (db) => {
    return {
        account: async (args) => {
            
            let file = await db.account.find({ _id: args.id })
            return file
        }
    }
}