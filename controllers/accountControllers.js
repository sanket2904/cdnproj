let {generateApiKey} = require("generate-api-key")
const argon2 = require("argon2")
const jsonwebtoken = require("jsonwebtoken")
module.exports = (app,db,parse) => {
    app.post("/api/create_account", async (req,res) => {
        try {
            let data = req.body 
            data.created = new Date()
            data.updated = new Date()
            let date = new Date()
            date.setDate(date.getDate() + 7)
            data.password = await argon2.hash(req.body.password)
            data.api_key = generateApiKey({pool:"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,.;:",length:64})
            let account = new db.accounts(data)
            let tbc = {  accountId: account._id, createdAt: new Date(), expireAt: date}
            let session = new db.sessions(tbc)
            let token = jsonwebtoken.sign({ account_id: account._id, session_id: session._id }, process.env.JWT_SECRET)
            session.token = token
            account.session = session;
            await session.save()
            await account.save()
            res.status(201).send({session: session})
        } catch (error) {
            if(error.code == 11000){
                res.status(409).send({message:"Account already exists"})
                return
            }
            console.log(error)
            res.status(500).send(error)
        }
       
    })

    app.post("/api/login",async (req,res) => {
        try {
            let account;
            if (req.body.userName) {
                account = await db.accounts.findOne({ userName: req.body.userName })
                
                if(!account){
                    res.status(404).send({message:"Account not found"})
                }
            }
            else if (req.body.email) {
             account = await db.accounts.findOne({ email: req.body.email })
                if(!account){
                    res.status(404).send({message:"Account not found"})
                }
            }


            try {
                let oldSession;
                if (account.session) oldSession = await db.sessions.deleteOne({ _id: account.session._id })
                let passwordMatch = await argon2.verify(account.password, req.body.password)
                if (!passwordMatch) {
                    res.status(401).send({message:"Invalid password"})
                    return 
                }
                let date = new Date()
                date.setDate(date.getDate() + 7)
                let session = new db.sessions({accountId: account._id, createdAt: new Date(), expireAt: date})
                let token = jsonwebtoken.sign({account_id:account._id,session_id: session._id},process.env.JWT_SECRET)

                
                session.token = token
                account.session = session
                await session.save()
                await account.save()
                res.status(200).send({session: session})
                return
            } catch (error) {
                console.log(error)
                res.status(401).send({message:"Invalid password"})
                return
            }
            
            // let token = parse.User._generateSessionToken(account.api_key)
        } catch (error) {
            console.log(error)
            res.status(500).send(error)
        }
    })
    

}

module.exports._api = {
    get: false,
    post:false,
    put:false,
    delete:false,
    socket:false,
    name: "accounts",
    endpoint:"/api/create_account",
}