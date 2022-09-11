module.exports.sessions = {

    accountId : {type: String, required: true},
    createdAt : {type: Date, default: Date.now},
    expireAt : {type: Date},
    active : {type: Boolean, default: true},
    token : {type: String, required: true, unique: true}


}