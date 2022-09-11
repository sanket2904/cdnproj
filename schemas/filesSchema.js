module.exports.filesSchema = {
    fileName: {type: String, required: true, unique: true},
    fileSize: {type: Number, required: true},
    fileType: {type: String},
    uploaded_at: {type: Date, default: Date.now},
    file_link: {type: String},
}

module.exports.graph = `
    files(accountId: ID!): [File]
    file(id: ID!,accountId: ID!): File
`
module.exports.graphQLSchema = `
    type File {
        fileName: String!
        fileSize: Int!
        fileType: String
        uploaded_at: String!
        file_link: String!
    }
`

module.exports.graphResolver = graphRoot

function graphRoot(db) {
    return {
        files: async (args) => {
            let account = await db.accounts.find({_id: args.accountId})
            return account[0].files
            
        },
        file: async (args) => {
            let account = await db.accounts.find({_id: args.accountId})
            let file = account[0].files.find((file) => file._id == args.id)
            return file
        }
    }
}






   

    
