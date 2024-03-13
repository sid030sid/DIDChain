const axios = require("axios")

const toBeUploadedJson = {
    "hey": "this",
    "is": "a",
    "test": "ok?!"
}

const testUploadToIpfsEndpoint = () => {

    // print out title of test
    console.log("TEST 1: uploading files to IPFS")

    // upload json to ipfs
    axios.post("http://localhost:3001/api-ipfs/upload/", {data : toBeUploadedJson})
    .then(res => {

        // download freshly uploaded json from ipfs
        const ipfsPath = res.data
        axios.get(ipfsPath).then(res2 => {

            // assure of upload and download content is same
            const uploadedJson = JSON.stringify(toBeUploadedJson)
            const downloadedJson = JSON.stringify(res2.data)
            console.log("Uploaded JSON file:", uploadedJson)
            console.log("Downloaded JSON file:", downloadedJson)
            console.log("Upload to IPFS successful:", downloadedJson.includes(uploadedJson))
        }).catch(err2 => {
            console.log(err2)
        })
    }).catch(err => {
        console.log(err)
    })
}

testUploadToIpfsEndpoint()