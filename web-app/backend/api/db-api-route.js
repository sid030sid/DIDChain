const router = require('express').Router();
const { readFile } = require('fs');

// endpoint for getting all DIDs created by GoDiddy API through this app
router.route("/get").get(async (req, res)=>{
    try {

        readFile("./db.json", (error, data) => {
            if (error) {
              console.log(error);
              return;
            }
            const parsedData = JSON.parse(data);

            // send lsit of DIDs to frontend
            if(parsedData){
                res.send(parsedData)
            }else{
                res.send("ERROR")
            }
            
        });
    } catch (error){
        error.response ? console.error(error.response.data) : console.error(error)
    }
})

module.exports = router;