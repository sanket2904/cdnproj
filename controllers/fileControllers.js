


require("../auth")
let B2 = require("backblaze-b2")
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });





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
            let fileEntry = new db.filesSchema({
                fileName: file.originalname,
                fileSize: file.size,
                fileType: file.mimetype,
                uploaded_at: new Date(),

            })
            
          
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