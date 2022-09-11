const jsonwebtoken = require("jsonwebtoken")
global.auth = (db) => {
    return async (req, res, next) => {
        try {
            
            if (req.query.api_key){
                
                let data = await db.accounts.findOne({ api_key: req.query.api_key})
                if(!data){
                    res.status(404).send({message: "Account not found"})
                    return
                }
                console.log(data)
                req.userData = {account_id: data._id, session_id: data.session._id}
                next()
            }
            let token = req.headers.authorization.split(" ")[1]
            let decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET)
            console.log(decoded)
            let session = await db.sessions.findOne({ _id: decoded.session_id })
            let account = await db.accounts.findOne({ _id: decoded.account_id })
            if (!session || !account) {
                res.status(401).send({ message: "Invalid token" })
                return
            }
            if (session.token !== token) {
                res.status(401).send({ message: "Invalid session" })
                session.active = false
                await session.save()
                return
            }

            req.userData = decoded
            next()
        } catch (error) {
            console.log(error)
            res.status(401).send({ message: "Auth failed" })
        }
    }
}
