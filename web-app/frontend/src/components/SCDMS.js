import * as React from 'react';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import axios from 'axios';
import AddMetadataPopUpForm from './subcomponents/AddMetadataPopUpForm';
import { TextField } from '@mui/material';

export default function SCDMS(props) {

    // state variables
    const [event, setEvent] = React.useState("producing")
    const [did, setDid] = React.useState("") //only needed when event === "producing" or "shipping"
    const [metadata, setMetadata] = React.useState([])
    const [material, setMaterial] = React.useState("")
    const [materials, setMaterials] = React.useState([])
    const [newController, setNewController] = React.useState("")

    const documentEventWithGoDiddy = async () => {

        //TODO in future: if did is given by user check if it exits and if he or she is controller and if he or she is registered supply chain entity

        //retrieve all even info and put it in one json obj
        const eventInformationObj = {
            "event":event,
            "metadata":Object.fromEntries(metadata)
        }

        //uplaod file to ipfs
        const res = await axios.post("/api-ipfs/upload", {data : eventInformationObj})

        //get ipfs path
        const ipfsPath = res.data //TODO in future: extract IPFS CID from Moralis url for IPFS file

        //call backend depending on the supply chain event
        if(event === "producing"){

            // create local did doc of newly produced raw material
            const didDoc =  {
                "@context": "https://www.w3.org/ns/did/v1",
                "authentication": [],
                "service": [
                    {
                        "id": "#ipfs",
                        "type": "LinkedDomains",
                        "serviceEndpoint": ipfsPath
                    }
                ],
                /*
                "verificationMethod": [{
                    "id": "#key-1",
                    "type": "Ed25519VerificationKey2020",
                    "publicKeyMultibase": "z6MkqNYCAsi4HgtFNivi7TaVc5v1rebyrhEGKBHAsHusaeqQ"
                }]
                */
            }
            const data = {
                event : event,
                didDoc : didDoc
            }
            
            // create did with local did doc as did doc via goddidy api
            const didCreationRes = await axios.post(
                '/api-did/create', 
                data
            )
            if(didCreationRes){
                alert("Your newly created DID has ID: "+didCreationRes.data.didDocument.id)
            }
        }else{
            if(event === "shipping"){
                // check if controller is using app or make request and let error --> TODO in future

                // get current did document--> TODO in future: retrieve did doc immediately when value of state variable did changes
                const currentDidResObj = await axios.get("https://resolver.cheqd.net/1.0/identifiers/"+did, {headers:{"Accept" : "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"}})
                var currentDidDoc = currentDidResObj.data.didDocument

                

                /* update local did doc of to be updated did for shipping event
                    1. update service with id: "...#ipfs"
                    2. update controller to be newController --> TODO in future?
                */
                currentDidDoc.service = [ // update endpoint of service with id: "...#ipfs"
                    {
                      "id": did+"#ipfs",
                      "type": "LinkedDomains",
                      "serviceEndpoint": [
                        ipfsPath                        
                      ]
                    }
                ]

                // get verfication method of newController
                const didResObjNewController = await axios.get("https://resolver.cheqd.net/1.0/identifiers/"+newController, {headers:{"Accept" : "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"}})
                const didDocNewController = didResObjNewController.data.didDocument
                const verifMethodNewController = didDocNewController.verificationMethod[0] // TODO in future: make code more robust by looking for verification method with suffix "#key-1" in id value of verification method
                verifMethodNewController.id = did + "#key-2" // change the id

                // perform update of controller 
                //currentDidDoc.controller = [newController] // change controller to newController 
                //currentDidDoc.verificationMethod = [verifMethodNewController] //replace verificationMethod with the one given in did doc of newController
                currentDidDoc.verificationMethod.push(verifMethodNewController)

                // prepare data for backend
                const data = {
                    did: did,
                    didDocOp: ["setDidDocument"],
                    didDoc : currentDidDoc // this is the locally updated version of the current did doc
                }

                console.log(data)
                
                // update did by setting local did doc as the new did doc via goddidy api
                const didCreationRes = await axios.post(
                    '/api-did/update', 
                    data
                )

                if(didCreationRes){
                    alert("Successful dodcumentation of shipping event. Verify by tracing and tracking DID: "+ did)
                }
                console.log(didCreationRes)
            }else{
                if(event === "receiving"){
                    // get current did document--> TODO in future: retrieve did doc immediately when value of state variable did changes
                    const currentDidResObj = await axios.get("https://resolver.cheqd.net/1.0/identifiers/"+did, {headers:{"Accept" : "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"}})
                    var currentDidDoc = currentDidResObj.data.didDocument

                    /* update local did doc of to be updated did for receiving event
                        1. update service with id: "...#ipfs"
                    */
                    currentDidDoc.service = [ // update endpoint of service with id: "...#ipfs"
                        {
                        "id": did+"#ipfs",
                        "type": "LinkedDomains",
                        "serviceEndpoint": [
                            ipfsPath                        
                        ]
                        }
                    ]
                    
                    // prepare data for backend
                    const data = {
                        did: did,
                        didDocOp: ["setDidDocument"],
                        didDoc : currentDidDoc, // this is locally updated version of the current did doc
                    }

                    // update did by setting local did doc as the new did doc via goddidy api
                    const didCreationRes = await axios.post(
                        '/api-did/update', 
                        data
                    )

                    if(didCreationRes){
                        alert("Successful dodcumentation of shipping event. Verify by tracing and tracking DID: "+ did)
                    }
                    console.log(didCreationRes)
                }else{ //case of manufacturing

                    // create service endpoints to reference metadata stored on IPFS
                    const serviceEndpoints = [
                        {
                            "id": "#ipfs",
                            "type": "LinkedDomains",
                            "serviceEndpoint": ipfsPath
                        }
                    ]

                    // add material endpoints which store DID of materials used for manufactured product
                    var idx = 0
                    for(const _material in materials){ 
                        serviceEndpoints.push(
                            {
                                "id": "#material-"+idx,
                                "type": "LinkedDomains",
                                "serviceEndpoint": _material // id of did respresenting material used for manufacturing
                            }
                        )
                        idx++
                    }

                    // create local did doc of newly produced raw material
                    const didDoc =  {
                        "@context": "https://www.w3.org/ns/did/v1",
                        "authentication": [],
                        "service": serviceEndpoints
                    }
                    const data = {
                        event : event,
                        didDoc : didDoc
                    }
                    
                    // create did with local did doc as did doc via goddidy api
                    const didCreationRes = await axios.post(
                        '/api-did/create', 
                        data
                    )
                    if(didCreationRes){
                        alert("Your newly created DID has ID: "+didCreationRes.didDocument.id)
                    }
                }
            }
        }
    }

    // document using Cheqd's credential serivce API which creates DIDs in internal secret mode
    const documentWithCheqdCredentialService = async () => {

        //TODO in future: if did is given by user check if it exits and if he or she is controller and if he or she is registered supply chain entity
        
        //retrieve all even info and put it in one json obj
        const eventInformationObj = {
            "event":event,
            "metadata":Object.fromEntries(metadata)
        }

        //uplaod file to ipfs
        const res = await axios.post("/api-ipfs/upload", {data : eventInformationObj})

        //get ipfs path
        const ipfsPath = res.data //TODO in future: extract IPFS CID from Moralis url for IPFS file

        if(event === "producing"){

            // create endpoints for services in did doc
            const serviceEndpoints = [
                {
                    "idFragment": "ipfs",
                    "type": "LinkedDomains",
                    "serviceEndpoint": [ipfsPath]
                }
            ]

            // create did
            const didCreationRes = await axios.post("/api-credential-service/create", {services:serviceEndpoints})

            if(didCreationRes){
                alert("Your newly created DID has ID: "+didCreationRes.data.did)
            }
        }else{
            if(event === "shipping"){
                // check if controller is using app or make request and let error --> TODO in future

                // get current did document--> TODO in future: retrieve did doc immediately when value of state variable did changes
                const currentDidResObj = await axios.get("https://resolver.cheqd.net/1.0/identifiers/"+did, {headers:{"Accept" : "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"}})
                var currentDidDoc = currentDidResObj.data.didDocument

                /* update local did doc of to be updated did for shipping event
                    1. update service with id: "...#ipfs"
                    2. update controller to be newController --> TODO in future (once Cheqd bug fixed)
                */
                currentDidDoc.service = [ // update endpoint of service with id: "...#ipfs"
                    {
                      "id": did+"#ipfs",
                      "type": "LinkedDomains",
                      "serviceEndpoint": [
                        ipfsPath                        
                      ]
                    }
                ]

                // get verfication method of newController
                    //const didResObjNewController = await axios.get("https://resolver.cheqd.net/1.0/identifiers/"+newController, {headers:{"Accept" : "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"}})
                    //const didDocNewController = didResObjNewController.data.didDocument
                    //const verifMethodNewController = didDocNewController.verificationMethod[0] // TODO in future: make code more robust by looking for verification method with suffix "#key-1" in id value of verification method
                    //verifMethodNewController.id = currentDidDoc.verificationMethod[0].id // keep the current id of the only verification method

                // perform update of controller
                currentDidDoc.controller = [newController] // change controller to newController 
                    //currentDidDoc.verificationMethod = [verifMethodNewController] //replace verificationMethod with the one given in did doc of newController
                    //console.log(currentDidDoc)

                // prepare data for request to backend
                const data = {
                    did: did,
                    service: '',
                    verificationMethod: '',
                    authentication: '',
                    didDocument: currentDidDoc // this is locally updated version of the current did doc
                };

                // update did by setting local did doc as the new did doc via credential service API
                const didCreationRes = await axios.post(
                    '/api-credential-service/update', 
                    data
                )

                if(didCreationRes){
                    alert("Successful documentation of shipping event. Verify by tracing and tracking DID: "+ did)
                }
            }else{
                if(event === "receiving"){
                    // get current did document--> TODO in future: retrieve did doc immediately when value of state variable did changes
                    const currentDidResObj = await axios.get("https://resolver.cheqd.net/1.0/identifiers/"+did, {headers:{"Accept" : "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"}})
                    var currentDidDoc = currentDidResObj.data.didDocument

                    /* update local did doc of to be updated did for receiving event
                        1. update service with id: "...#ipfs"
                    */
                    currentDidDoc.service = [ // update endpoint of service with id: "...#ipfs"
                        {
                        "id": did+"#ipfs",
                        "type": "LinkedDomains",
                        "serviceEndpoint": [
                            ipfsPath                        
                        ]
                        }
                    ]

                    // prepare data for request to backend
                    const data = {
                        did: did,
                        service: '',
                        verificationMethod: '',
                        authentication: '',
                        didDocument: currentDidDoc // this is locally updated version of the current did doc
                    };

                    // update did by setting local did doc as the new did doc via credential service API
                    const didCreationRes = await axios.post(
                        '/api-credential-service/update', 
                        data
                    )

                    if(didCreationRes){
                        alert("Successful documentation of receiving event. Verify by tracing and tracking DID: "+ did)
                    }
                }else{ //case of manufacturing

                    // create service endpoints to reference metadata stored on IPFS
                    const serviceEndpoints = [
                        {
                            "idFragment": "ipfs",
                            "type": "LinkedDomains",
                            "serviceEndpoint": [ipfsPath]
                        }
                    ]

                    // add material endpoints which store DID of materials used for manufactured product
                    var idx = 0
                    for(const _material of materials){ 
                        serviceEndpoints.push(
                            {
                                "idFragment": "material-"+idx,
                                "type": "LinkedDomains",
                                "serviceEndpoint": [_material]  // id of did respresenting material used for manufacturing
                            }
                        )
                        idx++
                    }

                    // create did
                    const didCreationRes = await axios.post("/api-credential-service/create", {services: serviceEndpoints})

                    if(didCreationRes){
                        alert("Your newly created DID has ID: "+didCreationRes.data.did)
                    }
                }
            }
        }
    }

    return (
        <Container component="main">
        <Box
            sx={{
            marginTop: 8,
            marginBottom: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            }}
        >
            <Typography component="h1" variant="h5">
                Document your supply chain event!
            </Typography>
            <Box sx={{ mt: 1 }}>
                <FormControl fullWidth sx={{marginTop: 4}}>
                    <InputLabel id="event-selector">Event</InputLabel>
                    <Select
                        id="event-selector"
                        value={event}
                        label="Event"
                        onChange={(e)=>setEvent(e.target.value)}
                    >
                        <MenuItem value={"producing"}>Producing</MenuItem>
                        <MenuItem value={"shipping"}>Shipping</MenuItem>
                        <MenuItem value={"receiving"}>Receiving</MenuItem>
                        <MenuItem value={"manufacturing"}>Manufacturing</MenuItem>
                    </Select>
                </FormControl>
                {
                    event === "shipping" | event === "receiving" ?
                    <TextField
                        margin="normal"
                        fullWidth
                        id="DID"
                        label="DID"
                        name="DID"
                        value={did}
                        onChange={(e) => setDid(e.target.value)}
                        helperText="Scan the QR code of your item to get its DID"
                    />
                    :
                    ""
                }
                {
                    event === "shipping" ?
                    <TextField
                        margin="normal"
                        fullWidth
                        id="New Controller"
                        label="New controller"
                        name="New Controller"
                        value={newController}
                        onChange={(e) => setNewController(e.target.value)}
                        helperText="DID of new owner of item"
                    />
                    :
                    ""
                }
                {
                    event === "manufacturing" ? 
                    <Box sx={{display: 'flex', flexDirection: 'column', marginTop: 4}}>
                            <Typography component="h1" variant="h6">
                                List materials used for manufacturing!
                            </Typography>
                            <Box>
                                {
                                    materials?.length > 0 ?
                                        
                                        <Box>
                                            {
                                                materials.map((item, idx) =>(
                                                    <Box key={idx}>
                                                        <Chip label={item} variant="outlined" onDelete={()=>setMaterials([...materials.slice(0, idx), ...materials.slice(idx + 1)])} />
                                                    </Box>
                                                ))
                                            }
                                        </Box>
                                        
                                    :
                                    ""
                                }
                                <Box>
                                    <TextField 
                                        label="DID material"
                                        margin="normal"
                                        fullWidth
                                        value={material}
                                        onChange={(e) => setMaterial(e.target.value)}
                                    ></TextField>
                                    <Button onClick={()=>{setMaterials([...materials, material]); setMaterial("")}}>Add material</Button>
                                </Box>  
                            </Box> 
                        </Box>
                    :
                    ""
                }
                {
                    (event !== "" & (event === "producing" | event === "manufacturing")) | (did !== "") ?
                        <Box sx={{display: 'flex', flexDirection: 'column', marginTop: 4}}>
                            <Typography component="h1" variant="h6">
                                Describe your event!
                            </Typography>
                            <Box>
                                {
                                    metadata?.length > 0 ?
                                        
                                        <Box>
                                            {
                                                metadata.map((item, idx) =>(
                                                    <Box key={idx}>
                                                        <Chip key={idx} label={item[0] + " : " + item[1]} variant="outlined" onDelete={()=>setMetadata([...metadata.slice(0, idx), ...metadata.slice(idx + 1)])} />
                                                    </Box>
                                                ))
                                            }
                                        </Box>
                                        
                                    :
                                    ""
                                }  
                                <AddMetadataPopUpForm addEventInfo={(eventInfo)=>setMetadata([...metadata, eventInfo])}></AddMetadataPopUpForm>
                            </Box>
                            {
                                metadata?.length > 0 ?
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        sx={{ mt: 3, mb: 2 }}
                                        onClick={documentWithCheqdCredentialService}
                                    >
                                        Document
                                    </Button>
                                :
                                ""
                            }   
                        </Box>
                    :
                    ""
                }
            </Box>
        </Box>
        </Container>
    );
}