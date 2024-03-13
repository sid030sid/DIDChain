const router = require('express').Router();
const Moralis = require("moralis").default;
const axios = require('axios')
const fs = require('fs');
require("dotenv").config();

// function to add a line to a CSV file
const documentMeasurement = (path, line) => {
    // append the line to the CSV file
    fs.appendFile(path, (new Date()).toString()+","+line + '\n', (err) => {
        if (err) {
            console.error('Error appending to CSV ("'+path+'"):', err);
        } else {
            console.log('Line successfully added to: "'+path+'"');
        }
    });
}

// function to uplaod data in json format to IPFS
const uploadToIPFS = async (data) => {
    try {

        // start Moralis module if not done so far
        if(!Moralis.Core?.isStarted){
            await Moralis.start({
                apiKey: process.env.MORALIS_API_KEY
            });
        }
        
        // upload file to 
        const response = await Moralis.EvmApi.ipfs.uploadFolder({
            abi: [{
                path: "id-"+Math.random(),
                content: data
            }],
        });
        
        // get path to file in ipfs
        const ipfsLink = response.result[0].path

        // get offical cid of file in ipfs TODO in future--> not possible through moralis --> work around is to hash the file yourself and use it as a name and store in the path attribute for the uploadFolder function

        // return IPFS path to newly uploaded file
        if(ipfsLink !== ""){
            return(ipfsLink)
        }else{
            return(null)
        } 
    } catch (error) {
        console.log(error)
    }
}

// ENDPOINTS FOR TRACING AND TRACKING

// endpoint for tracing material or product based on its DID id
// return list of DID document versions and DID of used materials or products in first event if it is a manufacturing event
router.route('/tracing/:didId').get(async (req, res) => {
    try {
        // get data from body
        const didId = req.params.didId

        // start measurement
        const start = new Date()

        // resolve versions of DID document of item to be traced
        const resolveVersions = await axios.get("https://resolver.cheqd.net/1.0/identifiers/"+didId+"/versions",
        {
            headers : {
                Accept: '*/*'
            }
        })

        // get history of item (= product or materials)
        const history = []
        const didDocVersions = resolveVersions.data.contentStream.versions
        for(var i = 0; i < didDocVersions.length; i++){
            //get version and its versionId
            const version = didDocVersions[i]
            const versionId = version.versionId

            // resolve DID version
            const didResolution = await axios.get(
                "https://resolver.cheqd.net/1.0/identifiers/"+didId+"?versionId="+versionId,
                {
                    headers : {
                        Accept: "*/*"
                    }
                }
            )

            // get history of events of traced item
            const eventTime = didResolution.data.didDocumentMetadata.updated ? didResolution.data.didDocumentMetadata.updated : didResolution.data.didDocumentMetadata.created
            history.push({
                eventTime: eventTime,
                didResolution:"https://api.cheqd.network/cheqd/did/v2/"+didId+"?versionId="+versionId,
                eventMetadataInIPFS:didResolution.data.didDocument.service.find(i=>{return(i.id.includes("ipfs"))})?.serviceEndpoint[0]
            })
        }

        // get compartments used for item with didId
        // NOTE: if item is a material, compartments will be an empty list
        const firstDidDoc = history[history.length - 1] //get first version of did doc which is the last element in history array, it is the producing or manufacturing event
        const compartments = firstDidDoc?.service?.filter(i=>{return(i.id.includes("compartment"))}) // get DID ID of compartments TODO in future: optimize code by removing the one and only service endpoint with ipfs as suffix, all the rest are compartments

        // start measurement
        const end = new Date()

        // send history to requester and if product (send DID ID of compartments too)
        if(history.length > 0){

            // store measurement with scheme: implementationId, tracing, didId, historyLength, numberCompartments, executionTime
            const numberCompartments = compartments?.length > 0 ? compartments.length : 0
            const measurement ="didCheqdCredentialServiceAPI,tracing,"+didId+","+history.length+","+numberCompartments+","+(end.getTime()-start.getTime())
            documentMeasurement("../measurements/tracingMeasurements.csv", measurement)

            // send info to requester
            res.send({
                didId:didId,
                history:history,
                compartments:numberCompartments > 0 ? compartments : null
            })
        }else{
            res.send("ERROR: no history found!")
        }
    } catch (error) {
        error.response ? console.error(error.response.data) : console.error(error)
    }
})

// endpoint for tracking item, i. e. getting current DID document version and its metadata
router.route('/tracking/:didId').get(async (req, res) => {
    try {
        // get data from body
        const didId =  req.params.didId

        // resolve DID of item to be traced and tracked
        const didResolution = await axios.get("https://resolver.cheqd.net/1.0/identifiers/"+didId,
        {
            headers : {
                Accept: '*/*'
            }
        })

        // print history event of traced item
        const eventTime = didResolution.data.didDocumentMetadata.updated ? didResolution.data.didDocumentMetadata.updated : didResolution.data.didDocumentMetadata.created
        const response = {
            eventTime:eventTime,
            didResolution:"https://api.cheqd.network/cheqd/did/v2/"+didId,
            eventMetadataInIPFS:didResolution.data.didDocument.service.find(i=>{return(i.id.includes("ipfs"))})?.serviceEndpoint[0]
        }

        // send history to requester and if product (send DID ID of compartments too)
        if(didResolution){
            // send info to requester
            res.send(response)
        }else{
            res.send("ERROR: tracking failed, current DID document not found!")
        }
    } catch (error) {
        error.response ? console.error(error.response.data) : console.error(error)
    }
})

// middleware which enables http requests performed by following endpoints to bypass CORS policy issue of Credential Service API
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

// ENDPOINTS FOR DOCUMENTING
// TODO in future: all of these endpoints require to first upload the event metadata for ipfs --> create middle ware

// endpoint for documenting producing event
// TODO: test it
router.route('/documenting/producing').post(async (req, res)=>{
    try {

        // start measurement
        const start = new Date()

        // get data from request body
        const eventMetadata = req.body.eventMetadata
        
        // upload event metadata into ipfs
        const startIpfsUpload = new Date()
        const ipfsPath = await uploadToIPFS(eventMetadata)
        const endIpfsUpload = new Date()
        
        //const ipfsPath = "https://ipfs.moralis.io:2053/ipfs/QmXTGaZ1Dm5w6V91Hj8vhHfZvqfnCBM2xZRLhLVd1C25jE/id-0.8412473795869364"

        if(ipfsPath){
            // create service value of document of to be created DID 
            const services = [
                {
                    "idFragment": "ipfs",
                    "type": "LinkedDomains",
                    "serviceEndpoint": [ipfsPath]
                }
            ]

            // prepare API request for DID creation
            const token = process.env.CHEQD_CREDENTIAL_SERVICE_TOKEN
            const url = 'https://credential-service.cheqd.net/did/create';
            //const data = 'network=testnet&identifierFormatType=uuid&verificationMethodType=Ed25519VerificationKey2020&service='+encodeURIComponent(JSON.stringify(services))+'&key=&%40context=https%3A%2F%2Fwww.w3.org%2Fns%2Fdid%2Fv1'
            const data = {
                network:"testnet",
                identifierFormatType:"uuid",
                verificationMethodType:"Ed25519VerificationKey2020",
                service: services,
                key:"",
                context:"https://www.w3.org/Fns/did/Fv1"
            }
            
            const headers = {
                'accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${token}`
            };

            // create DID using Credential service API offered by Cheqd
            const resCreateDid = await axios.post(url, data, { headers })

            // end measurement
            const end = new Date()
            
            // send did document to requester and write execution time to measurements.txt
            if(resCreateDid){

                // store measurement with scheme: implementationId, event, executionTime
                const didId = resCreateDid.data.did
                const measurement ="didCheqdCredentialServiceAPI,producing,"+didId+","+(end.getTime()-start.getTime())+","+(endIpfsUpload.getTime()-startIpfsUpload.getTime())
                documentMeasurement("../measurements/eventDocumentingTimeMeasurements.csv", measurement)

                // send did doc of new did to requester
                res.send(resCreateDid.data)
            }else{
                res.send("ERROR: DID creation failed!")
            }
        }else{
            res.send("Error: IFPS upload failed!")
        }
    } catch (error) {
        error.response ? console.error(error.response.data) : console.error(error)
    }
})

// endpoint for documenting shipping event
// TODO: test it
router.route('/documenting/shipping').post(async (req, res)=>{
    try {

        // start measurement
        const start = new Date()

        // get req body data 
        const didId = req.body.didId
        const newController = req.body.newController
        const eventMetadata = req.body.eventMetadata 

        
        // upload event metadata into ipfs
        const startIpfsUpload = new Date()
        const ipfsPath = await uploadToIPFS(eventMetadata)
        const endIpfsUpload = new Date()
        
        //const ipfsPath = "https://ipfs.moralis.io:2053/ipfs/QmXTGaZ1Dm5w6V91Hj8vhHfZvqfnCBM2xZRLhLVd1C25jE/id-0.8412473795869364"


        if(ipfsPath){
            // create new did document version with...
            // 1. new DID ID unter controller attribute
            // 2. new link to ipfs file under service attribute
            // 3. service attribute not having any compartments listed (if the DID represents a product)
            const currentDidResObj = await axios.get( // get current did resolution object
                "https://resolver.cheqd.net/1.0/identifiers/"+didId, 
                {headers:{"Accept" : "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"}}
            )
            var currentDidDoc = currentDidResObj.data.didDocument // get current did document
            currentDidDoc.service = [ // overwrite service value and update endpoint of service with id: "...#ipfs"
                {
                    "id": didId+"#ipfs",
                    "type": "LinkedDomains",
                    "serviceEndpoint": [
                        ipfsPath                        
                    ]
                }
            ]
            currentDidDoc.controller = [newController] // change controller
            
            // prepare API request for DID update
            const data = {
                did: didId,
                service: "",
                verificationMethod: "",
                authentication: "",
                didDocument: currentDidDoc       
            }
            const token = process.env.CHEQD_CREDENTIAL_SERVICE_TOKEN
            const url = 'https://credential-service.cheqd.net/did/update';
            const headers = {
                'accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${token}`
            };

            // create DID using Credential service API offered by Cheqd
            const resUpdateDid = await axios.post(
                url, 
                data, 
                { headers }
            )

            // end measurement
            const end = new Date()
            
            // send did document of updated did to requester and write measurement to disk
            if(resUpdateDid){

                // store measurement with scheme: implementationId, event, didId, executionTime, ipfsUploadTime
                const measurement ="didCheqdCredentialServiceAPI,shipping,"+didId+","+(end.getTime()-start.getTime())+","+(endIpfsUpload.getTime()-startIpfsUpload.getTime())
                documentMeasurement("../measurements/eventDocumentingTimeMeasurements.csv", measurement)

                // send to requester
                res.send(resUpdateDid.data)
            }else{
                res.send("ERROR: DID update")
            }
        }else{
            res.send("ERROR: IPFS upload failed!")
        }
    } catch (error) {
        error.response ? console.error(error.response.data) : console.error(error)
    }
})

// endpoint for documenting receiving event
router.route('/documenting/receiving').post(async (req, res)=>{
    try {

        // start measurement
        const start = new Date()

        // get req body data 
        const didId = req.body.didId
        const eventMetadata = req.body.eventMetadata 

        
        // upload event metadata into ipfs
        const startIpfsUpload = new Date()
        const ipfsPath = await uploadToIPFS(eventMetadata)
        const endIpfsUpload = new Date()
        //const ipfsPath = "https://ipfs.moralis.io:2053/ipfs/QmXTGaZ1Dm5w6V91Hj8vhHfZvqfnCBM2xZRLhLVd1C25jE/id-0.8412473795869364"


        if(ipfsPath){
            // create new did document version with...
                // 1. new link to ipfs file under service attribute
                const currentDidResObj = await axios.get( // get current did resolution object
                "https://resolver.cheqd.net/1.0/identifiers/"+didId, 
                {headers:{"Accept" : "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"}}
            )
            var currentDidDoc = currentDidResObj.data.didDocument // get current did document
            currentDidDoc.service = [ // overwrite service value and update endpoint of service with id: "...#ipfs"
                {
                    "id": didId+"#ipfs",
                    "type": "LinkedDomains",
                    "serviceEndpoint": [
                        ipfsPath                        
                    ]
                }
            ]
            
            // prepare API request for DID update
            const data = {
                did: didId,
                service: "",
                verificationMethod: "",
                authentication: "",
                didDocument: currentDidDoc       
            }
            const token = process.env.CHEQD_CREDENTIAL_SERVICE_TOKEN
            const url = 'https://credential-service.cheqd.net/did/update';
            const headers = {
                'accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${token}`
            };

            // create DID using Credential service API offered by Cheqd
            const resUpdateDid = await axios.post(
                url, 
                data, 
                { headers }
            )

            // end measurement
            const end = new Date()
            
            // send did document of updated did to requester and write measurement to disk
            if(resUpdateDid){

                // store measurement with scheme: implementationId, event, didId, executionTime, ipfsUploadTime
                const measurement ="didCheqdCredentialServiceAPI,receiving,"+didId+","+(end.getTime()-start.getTime())+","+(endIpfsUpload.getTime()-startIpfsUpload.getTime())
                documentMeasurement("../measurements/eventDocumentingTimeMeasurements.csv", measurement)

                // send to requester
                res.send(resUpdateDid.data)
            }else{
                res.send("ERROR: DID update")
            }
        }else{
            res.send("ERROR: IPFS upload failed!")
        }
    } catch (error) {
       error.response ? console.error(error.response.data) : console.error(error)
    }
})

// endpoint for documenting manufacturing event
router.route('/documenting/manufacturing').post(async (req, res)=>{
    try {

        // start measurement
        const start = new Date()

        // get data from request body
        const eventMetadata = req.body.eventMetadata
        const listOfCompartments = req.body.listOfCompartments // list of DID IDs corresponding to materials or products used as compartments for manufacturing

        // upload event metadata into ipfs
        const startIpfsUpload = new Date()
        const ipfsPath = await uploadToIPFS(eventMetadata)
        const endIpfsUpload = new Date()

        if(ipfsPath){
            // create service value of document of to be created DID 
            const services = [
                {
                    "idFragment": "ipfs",
                    "type": "LinkedDomains",
                    "serviceEndpoint": [ipfsPath]
                }
            ]

             // add compartment endpoints which store DID of materials and products used for manufactured product
             var idx = 0
             for(const compartment of listOfCompartments){ 
                 services.push(
                     {
                         "idFragment": "compartment-"+idx,
                         "type": "LinkedDomains",
                         "serviceEndpoint": [compartment]  // id of did respresenting material or product used for manufacturing (=compartment)
                     }
                 )
                 idx++
             }

            // prepare API request for DID creation
            const token = process.env.CHEQD_CREDENTIAL_SERVICE_TOKEN
            const url = 'https://credential-service.cheqd.net/did/create';
            //const data = 'network=testnet&identifierFormatType=uuid&verificationMethodType=Ed25519VerificationKey2020&service='+encodeURIComponent(JSON.stringify(services))+'&key=&%40context=https%3A%2F%2Fwww.w3.org%2Fns%2Fdid%2Fv1'
            const data = {
                network:"testnet",
                identifierFormatType:"uuid",
                verificationMethodType:"Ed25519VerificationKey2020",
                service: services,
                key:"",
                context:"https://www.w3.org/Fns/did/Fv1"
            }
            const headers = {
                'accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${token}`
            };

            // create DID using Credential service API offered by Cheqd
            const resCreateDid = await axios.post(url, data, { headers })

            // end measurement
            const end = new Date()
            
            // send did document to requester and write execution time to disk
            if(resCreateDid){
                // store measurement with scheme: implementationId, event, didId, numberCompartments executionTime, ipfsUploadTime
                const didId = resCreateDid.data.did
                const measurement ="didCheqdCredentialServiceAPI,manufacturing,"+didId+","+listOfCompartments.length+","+(end.getTime()-start.getTime())+","+(endIpfsUpload.getTime()-startIpfsUpload.getTime())
                documentMeasurement("../measurements/manufacturingTimeMeasurements.csv", measurement)
                
                // send did doc of new did to requester
                res.send(resCreateDid.data)
            }else{
                res.send("ERROR: DID creation failed!")
            }
        }else{
            res.send("Error: IFPS upload failed!")
        }
    } catch (error) {
        error.response ? console.error(error.response.data) : console.error(error)
    }
})

module.exports = router;