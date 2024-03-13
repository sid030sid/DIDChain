import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import axios from 'axios';
import TracingTable from './subcomponents/TracingTable';
import CompartmentSelector from './subcomponents/CompartmentSelector';


export default function InputForTracing(props) {

    // state variables
    const [history, setHistory] = React.useState([])
    const [compartments, setCompartments] = React.useState([])
    const [compartmentHistory, setCompartmentHistory] = React.useState([])

    const traceAndTrack = async (did, compartment) => {
        try {
            // get history of did aka list of its versions and list of its links to ipfs
            const tempHistory =  [] // to temporarily store relevant data of the DID history for user
            const resolveVersions = await axios.get(
                "https://resolver.cheqd.net/1.0/identifiers/"+did+"/versions",
                {
                    headers : {
                        Accept: '*/*'
                    }
                }
            )
            const versions = resolveVersions.data.contentStream.versions
            for(var i = 0; i < versions.length; i++){

                //getm version and its versionId
                const version = versions[i]
                const versionId = version.versionId

                // resolve DID
                const didResolution = await axios.get(
                    "https://resolver.cheqd.net/1.0/identifiers/"+did+"?versionId="+versionId,
                    {
                        headers : {
                            Accept: "*/*"
                        }
                    }
                ) 

                // extract relevant information from DID resolution object
                tempHistory.push({
                    didResolverURL:"https://resolver.cheqd.net/1.0/identifiers/"+did+"?versionId="+versionId,
                    service:didResolution.data.didDocument.service,
                    didDocumentMetadata:didResolution.data.didDocumentMetadata
                })
            }

            // get first version of did doc which is the last element in tempHistory array
            const firstDidDoc = tempHistory[tempHistory.length - 1]

            // if product aka if firstDidDoc has material endpoints in service
            const compartments = firstDidDoc.service.filter(i=>{return(i.id.includes("material"))})
            if(compartments?.length !== 0){
                setCompartments(compartments) //TODO in future: extend so that even compartments of compartments could be traced further so far only directly used compartments can be traced
            }

            // store history of DID based on type product or compartment 
            if(compartment){
                setCompartmentHistory(tempHistory)
            }else{
                setHistory(tempHistory)
            }
        } catch (error) {
            console.log(error)
        }
        
    }
    
    const handleSubmit = (event) => {
        event.preventDefault();

        // get data from tracing and tracking request form
        const data = new FormData(event.currentTarget);

        // trace and track item based on did
        traceAndTrack(data.get("DID"), false)
    };

    const traceAndTrackCompartment = (compartment) => {
        traceAndTrack(compartment, true)
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
                Trace and track your item!
            </Typography>
            
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="DID"
                    label="DID"
                    name="DID"
                    autoFocus
                    helperText="To test, enter: did:cheqd:testnet:eb41cc0f-b773-440e-b675-0e4310368a52"
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                >
                    Trace
                </Button>
            </Box>
            {history?.length === 0 ? 
                ""
                :
                <Box>
                    <TracingTable events={history}></TracingTable>
                    {
                        compartments?.length > 0 ?
                            <Box
                                sx={{
                                marginTop: 8,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                marginBottom: 2
                                }}
                            >
                                <Typography component="h1" variant="h5" sx={{marginBottom:3}}>
                                    Trace and track further...
                                </Typography>
                                <CompartmentSelector compartments={compartments} traceAndTrackCompartment={(compartment)=>traceAndTrackCompartment(compartment)}></CompartmentSelector>
                            </Box>
                            : ""
                    }
                    {  
                        compartmentHistory?.length > 0?
                            <TracingTable events={compartmentHistory}></TracingTable>
                        :
                        ""
                    }
                </Box>
            }
        </Box>
        </Container>
    );
}