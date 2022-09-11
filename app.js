let DB = require("@sanket2904/package")
let db = new DB({mongo:process.env.MONGO_URI})
let app = require("@sanket2904/package/server")
app({db:db,port:process.env.PORT})