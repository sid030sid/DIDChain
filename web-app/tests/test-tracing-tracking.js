const axios = require("axios")

const toBeTracedItem = "did:cheqd:testnet:eb41cc0f-b773-440e-b675-0e4310368a52"

const testTracingAndTracking = () => {

    // resolve DID of item to be traced and tracked
    axios.get("https://api.cheqd.network/cheqd/did/v2/"+toBeTracedItem)
    .then(res => {

        console.log(res.data)
        const didDoc = res.data.value.did_doc
        const didDocMeta = res.data.value.metadata

        // print out tile of test
        console.log("TEST 1: tracking")
        
        // print tracking information
        const eventTime = didDocMeta.updated ? didDocMeta.updated : didDocMeta.created
        console.log({
            eventTime: eventTime,
            didResolution:"https://api.cheqd.network/cheqd/did/v2/"+toBeTracedItem,
            eventMetadataInIPFS:didDoc.service.find(i=>{return(i.id.includes("ipfs"))})?.service_endpoint[0],
            previousEvent:"https://api.cheqd.network/cheqd/did/v2/"+toBeTracedItem+"?versionId="+didDocMeta.previous_version_id,
        })

        // print out title of test
        console.log("TEST 2: tracing")
        axios.get(
            "https://resolver.cheqd.net/1.0/identifiers/"+toBeTracedItem+"/versions",
            {
                headers : {
                    Accept: '*/*'
                }
            }
        ).then(res2 => {
            
            // resolve all versions individually
            const versions = res2.data.contentStream.versions
            for(var i = 0; i < versions.length; i++){

                //get version and its versionId
                const version = versions[i]
                const versionId = version.versionId

                // resolve DID version
                axios.get(
                    "https://resolver.cheqd.net/1.0/identifiers/"+toBeTracedItem+"?versionId="+versionId,
                    {
                        headers : {
                            Accept: "*/*"
                        }
                    }
                ).then(didResolution => {

                    // print history event of traced item
                    const eventTime = didResolution.data.didDocumentMetadata.updated ? didResolution.data.didDocumentMetadata.updated : didResolution.data.didDocumentMetadata.created
                    console.log({
                        eventTime: eventTime,
                        didResolution:"https://api.cheqd.network/cheqd/did/v2/"+toBeTracedItem+"?versionId="+versionId,
                        eventMetadataInIPFS:didResolution.data.didDocument.service.find(i=>{return(i.id.includes("ipfs"))})?.serviceEndpoint[0]
                    })
                })
                .catch(err3 => {
                    console.log(err3)
                })
            }
        }).catch(err2 => {
            console.log(err2)
        })
    }).catch(err => {
        console.log(err)
    })
}

testTracingAndTracking()