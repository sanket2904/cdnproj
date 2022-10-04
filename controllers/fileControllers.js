require("../auth")
let B2 = require("backblaze-b2")
module.exports = (app, db, parse) => {
    app.get("/api/files",auth(db),async (req, res) => {
        let data = req.userData.account_id
        let accounts = await db.accounts.findOne({ _id: data })
        if (!accounts) {
            res.status(404).send({ message: "Account not found" })
            return
        }
        let files = accounts.files
        res.status(200).send({files: files})
    })

    app.post("/api/files",auth(db),async (req, res) => {
        let files = req.files
        console.log(req.userData)
        let account = await db.accounts.findOne({ _id: req.userData.account_id })
        let ress = []
        for (var file of files) {
            if (account.max_usage < (account.usage + (file.size / 1000000) )) {
                res.status(400).send({ message: "Max usage reached" })
                return
            }
            let fileEntry = new db.filesSchema({
                fileName: file.originalname,
                fileSize: file.size,
                fileType: file.mimetype,
                accountId: account._id,
                uploaded_at: new Date(),

            })
            account.usage += (file.size / 1000000)
            fileEntry.fileName = fileEntry._id.toString() + file.originalname 
            try {
                const b2 = new B2({
                    applicationKeyId: process.env.KEY_ID,
                    applicationKey: process.env.BACKBLAZE_APPLICATION
                })
                await b2.authorize()
                let bucket = await b2.getBucket({ bucketId: process.env.BUCKET_ID })
                let uploadUrl = await b2.getUploadUrl({bucketId: process.env.BUCKET_ID})
                let upload = await b2.uploadFile({
                   
                    fileName: fileEntry._id.toString()+file.originalname,
                    data: file.buffer,
                    uploadUrl: uploadUrl.data.uploadUrl,
                    uploadAuthToken: uploadUrl.data.authorizationToken
                })
                console.log(upload.data.fileId)
                fileEntry.fileId = await upload.data.fileId
                fileEntry.file_link = `${process.env.MAIN_DOMAIN}/${fileEntry._id.toString() + file.originalname}`
                ress.push(fileEntry)
                await fileEntry.save()
                account.files.push(fileEntry)
                await account.save()
            } catch (error) {
                console.log(error)
                res.status(500).send(error)
                return
            }
        }
        res.json(ress)
    })
    app.delete("/api/files/:id",auth(db),async (req, res) => {
        let data = req.params.id
        let account = await db.accounts.findOne({ _id: req.userData.account_id })
        let file = await db.filesSchema.findOne({ _id: data })
        if (!file) {
            
            res.status(404).send({ message: "File not found" })
            return
        }
        try {
            const b2 = new B2({
                applicationKeyId: process.env.KEY_ID,
                applicationKey: process.env.BACKBLAZE_APPLICATION
            })
            await b2.authorize()
            let bucket = await b2.getBucket({ bucketId: process.env.BUCKET_ID })
            
            console.log(file)
            let deleteFile = await b2.deleteFileVersion({
                fileName: file.fileName,
                fileId: file.fileId
            })
            
            delete await account.files
            await file.remove()
            let ffiles = await db.filesSchema.find({ accountId: account._id })
            console.log(ffiles)
            account.files = ffiles
            account.usage -= (file.fileSize / 1000000)
            
            
            await account.save()
            res.status(200).send({ message: "File deleted" })
        }
        catch(e) {
            console.log(e)
            res.status(500).send(e)
        }
    })
}

module.exports._api = {
    get: false,
    post: false,
    put: false,
    delete: false,
    socket: false,
    name: "filesschemas",
    endpoint: "/api/files",
}