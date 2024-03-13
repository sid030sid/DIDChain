const router = require('express').Router();
const Moralis = require("moralis").default;
require("dotenv").config();

router.route('/upload').post(async (req, res)=>{
    try {

        // start Moralis module if not done so far
        if(!Moralis.Core?.isStarted){
            await Moralis.start({
                apiKey: process.env.MORALIS_API_KEY,
            });
        }
        
        // upload file to 
        const response = await Moralis.EvmApi.ipfs.uploadFolder({
            abi: [{
                path:"controller-"+Math.random(),
                content:req.body.data
            }],
        });
        
        // get path to file in ipfs
        const ipfsLink = response.result[0].path

        // get offical cid of file in ipfs TODO --> not possible through moralis --> work around is to hash the file yourself and use it as a name and store in th path attribute for the uploadF>older function

        // send response to frontend
        if(ipfsLink !== ""){
            res.send(ipfsLink)
        }else{
            res.send("ERROR")
        }
        
    } catch (error) {
        console.log(error)
    }
})

module.exports = router;