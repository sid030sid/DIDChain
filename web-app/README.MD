# DIDChain wep app
This is the implementation of DIDChain as a web app.

## Run web app
1. Set up:
    - open terminal an move to this folder by running: `cd web-app`
    - run `npm install` inside to download packages for tests, backend and environment
    - run `cd frontend` and run `npm install` again to download packages for frontend
    - go back to folder `web-app` by running `cd ..`
    - add `.env` file in folder `web-app` and add environment variable `MORALIS_API_KEY` with your personal Moralis Web3 API Key as its value (get your key by following this [guide](https://docs.moralis.io/2.0/web3-data-api/evm/get-your-api-key))
    - add the same `.env` file in folder `backend`
    - add to the `env` in `backend` folder JWT for credential serivce API offered by Cheqd:
        - go to Swagger API of credential service: [link](https://credential-service.cheqd.net/swagger/#/Account/get_account_idtoken)
        - log in, run `get_account_idtoken` endpoint and copy the outputted ``idToken``
        - add environment variable: ``CHEQD_CREDENTIAL_SERVICE_TOKEN`` and set it to the outputted ``idToken`` value
2. Start running web app on localhost:
    - run `npm start` in folder `web-app` (this command automatically starts the backend and frontend)
3. Test app's tracing and tracking by entering ``did:cheqd:testnet:eb41cc0f-b773-440e-b675-0e4310368a52`` in [tracing and tracking form](http://localhost:3000/trace-and-track)
4. Eventual step in case of error: 
        `Invalid options object. Dev Server has been initialized using an options object that does not match the API schema. - options.allowedHosts[0] should be a non-empty string.`
    add a `.env` in the folder `frontend` and add `DANGEROUSLY_DISABLE_HOST_CHECK=true` as environment variable
5. Eventual step in case of error : `Unexpected error: JWTExpired: "exp" claim timestamp check failed`
    - update JWT in `env` file of `backend`:
        - go to Swagger API of credential service: [link](https://credential-service.cheqd.net/swagger/#/Account/get_account_idtoken)
        - log in, run `get_account_idtoken` endpoint and copy the outputted ``idToken``
        - add environment variable: ``CHEQD_CREDENTIAL_SERVICE_TOKEN`` and set it to the outputted ``idToken`` value

### Architecture
![alt Architecture DIDChain web app implementation](../screenshots/architecture.png)

### Frontend
#### UI for documenting supply chain events
![alt Frontend for documenting supply chain events](../screenshots/frontend_documenting_milk_production.png)

#### UI for tracing products and their compartments
![alt Frontend for tracing products and their compartments](../screenshots/frontend_trace_product.png)

## Tools
- DID:cheqd as DID method to digitally represent supply chain items on-chain
- Creation and management of DIDs via [Swagger API of Credential Service](https://credential-service.cheqd.net/swagger)
- IPFS for off-chain storage (uploads via Moralis API)
- React for web app's frontend
- Axios for HTTP request to internal and external APIs (e. g. to [CHEQD network API](https://resolver.cheqd.net/) to resolve DIDs)
- MUI for styled components in frontend
- Express for web app's backend
- Node as runtime environment

## Future Work
- change did creation from internal secret mode to client secret mode (switch from [Credential Service API](https://credential-service.cheqd.net/swagger) to [universal registrar api for Cheqd](https://did-registrar.cheqd.net/api-docs/#/))
- standardize the IPFS data for each supply chain event: producing, shipping, receiving and manufacturing (with the help of supply chain experts). Eventually think about specific domains who are willing to use VSCDMS for their supply chains and create domain specific standards for these domains.
- create an identity registrar so that VSCDMS can only be accessed as an offical supply chain entity

## Links
- Upload to IPFS via Moralis API: https://moralis.io/how-to-upload-files-to-ipfs-full-guide/