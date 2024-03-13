const axios = require("axios")

// url to custom API
const url = "http://localhost:3001/api/"

// function to docuement a supply chain event using the API which holds business logic and is proxy API for crdential service API for cheqd network
const documentEvent = async (event, data) => {
    // perform documentation
    const res = await axios.post(url+event, data)
    if(res.data.did){
        console.log("Successfull "+event+" for DID:"+res.data.did)
        return res.data.did
    }else{
        return ""
    }
}

// fucntion to delay a process in an async function
function delay(milliseconds){
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}

// MEASUREMENTS

// measure documenting manufacturing time depending on number of compartments (= degree of node)
// NOTE: what is the maximum number of compartments a product can list in its initial DID doc?
// According to the CTO of Cheqd, the block size of 200 KB limits the DID doc in theory. 
// In practice, other transactions are processed and stored in the same block as well, leading
// to a max available block storage size of 100 to 150 KB in reality.
const measureTimeDocumentingManufacturingDependingOnDegreeOfNodes = async () => {

    // perform documentation of manufacturing for different amount of used compartments: 
    // 1, 2, 3, ..., 100 compartments
    const numberCompartments = (Array.from({length: 100}, (_, i) => i + 1))
    for(var i = 0; i < numberCompartments.length ; i++){

        // create list of compartments (NOTE: always the same compartment is listed)
        const compartments = new Array(numberCompartments[i]).fill("did:cheqd:testnet:eb41cc0f-b773-440e-b675-0e4310368a52"); //abitrarily chosed did to be listed as compartment

        // NOTE: for statistical significance each product's manufacturing event should have been documented 30 times. this, however, led to errors like:
        // 1. Internal error: Error: Error: cosmos_transaction: Failed to create DID. Reason: out of gas in location: WritePerByte; gasWanted: 360000, gasUsed: 377088: out of gas
        // 2. { error: 'too many parameters' }
        // 3. { error: 'request entity too large' }
        // 4. 'Internal error: Error: Error: Broadcasting transaction failed with code 32 (codespace: sdk). Log: account sequence mismatch, expected 138, got 137: incorrect account sequence'
        const didId = documentEvent("documenting/manufacturing", {
            eventMetadata : {
                eventAttribute1:"val", 
            },
            listOfCompartments: compartments
        })

        if(didId === ""){
            break
        }

        // wait 10 seconds to not overload laptop and thus distort measurement
        // also essential so that Cheqd's underlying interaction with Cosmos Blockchain does not lead to
        // Error: Broadcasting transaction failed with code 32 (codespace: sdk). Log: account sequence mismatch, expected 204, got 203: incorrect account sequence
        await delay(10000)
    }
}

// measure tracing time depending on number of supply chain events
const measureTracingTimeDependingNumberSupplyChainEvents = async () => {

    // create material and document its producing
    const didId = await documentEvent("documenting/producing", {
        eventMetadata : {
            event:"producing",
            eventAttribute1:"val", 
        }
    })
    
    // wait 10 seconds to not distort measurments and avoid Cosmo's internal error: account sequence mismatch
    await delay(10000)

    // perform tracing
    const resTrace = await axios.get(url+"tracing/"+didId)
        
    // transfer ownership of material between two supply chain entities depending on length of supply chain
    const numberOwnershipChanges = 500 // over 1000 supply chain events in total
    for(var j=1; j<numberOwnershipChanges; j++){
        // determine new controller based on index being even or not
        var newController = "did:cheqd:testnet:ff3bcbff-7640-4432-9b96-869ed9c9832e" //if even
        if(j%2 == 1){
            newController = "did:cheqd:testnet:6a61cb7e-a768-4579-9920-23dd68736056" //controller if uneven
        }

        // ship material 
        documentEvent("documenting/shipping", {
            eventMetadata : {
                event:"shipping",
                eventAttribute1:"val", 
            },
            didId: didId,
            newController : newController
        })

        // wait 10 seconds to not distort measurments and avoid Cosmo's internal error: account sequence mismatch
        await delay(10000)
    
        // perform tracing
        const resTraceAfterShipping = await axios.get(url+"tracing/"+didId)

        // receive material
        documentEvent("documenting/receiving", {
            eventMetadata : {
                event:"receiving",
                eventAttribute1:"val", 
            },
            didId: didId
        })

        // wait 10 seconds to not distort measurments and avoid Cosmo's internal error: account sequence mismatch
        await delay(10000)

        // perform tracing
        const resTraceAfterReceiving = await axios.get(url+"tracing/"+didId)
    } 
} 

const measureDocumentationTimeForEachEvent = async () => {
    n = 30 // set number of tests
    const newController = "did:cheqd:testnet:ff3bcbff-7640-4432-9b96-869ed9c9832e"

    const materialDidIds = []

    // document producing, shipping and receiving
    for(var i = 0; i < n; i++){
        
        // document producing
        const didId = await documentEvent("documenting/producing", {
            eventMetadata : {
                event:"producing",
                eventAttribute1:"val", 
            }
        })

        // store material DID IDs for manufacturing
        materialDidIds.push(didId)

        // ship material 
        documentEvent("documenting/shipping", {
            eventMetadata : {
                event:"shipping",
                eventAttribute1:"val", 
            },
            didId: didId,
            newController : newController
        })

        // wait 10 seconds to not distort measurments and avoid Cosmo's internal error: account sequence mismatch
        await delay(10000)

        // receive material
        documentEvent("documenting/receiving", {
            eventMetadata : {
                event:"receiving",
                eventAttribute1:"val", 
            },
            didId: didId
        })
        
        // wait 10 seconds to not distort measurments and avoid Cosmo's internal error: account sequence mismatch
        await delay(10000)
    }
    
    // wait 10 seconds to not distort measurments and avoid Cosmo's internal error: account sequence mismatch
    await delay(10000)

    // document manufacturing
    for(var i = 0; i < n; i++){
        const didId = documentEvent("documenting/manufacturing", {
            eventMetadata : {
                eventAttribute1:"val", 
            },
            listOfCompartments: materialDidIds.slice(0,2)
        })

        // wait 10 seconds to not distort measurments and avoid Cosmo's internal error: account sequence mismatch
        await delay(10000)
    }
}

// PERFORM MEASUREMENTS
//measureTimeDocumentingManufacturingDependingOnDegreeOfNodes()
//measureTracingTimeDependingNumberSupplyChainEvents()
measureDocumentationTimeForEachEvent() 