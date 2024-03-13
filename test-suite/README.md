# Test suite for benchmarking DIDChain

## Set up
1. Set up test suite
    1. Create `.env` file in folder `test-suite/tests-and-results/server` and declare the following environment variables:
        - ``MORALIS_API_KEY``: set thie variable to the API key after creating an account on moralis, like [so](https://docs.moralis.io/web3-data-api/evm/get-your-api-key#step-2-get-api-key)
        - ``CHEQD_CREDENTIAL_SERVICE_TOKEN``: set this variable to the JWT API key returned by the `/account/idToken` GET request in the [Swagger](https://credential-service.cheqd.net/swagger/#/Account/get_account_idtoken) of the `Credential Service API for cheqd network` (login required first)
        
        NOTE: since it is a JWT, one needs to update this variable once the JWT token expires.
        1. 
    2. Open new terminal
    3. Move from project root folder to folder `tests-and-results` by running `cd test-suite/tests-and-results`
    4. Intstall all packages by running `npm install` (Used Node.js version: v20.8.1)
    5. Verify correctness of set up by runnning `npm start` (Terminal should output: `Server listening on 3001`)
2. Set up virtual environment with packages from `requirements.txt` installed (using Python 3.12.0). For instance, in Windows and in `VS Code`:
    1. Open new terminal (Comand prompt)
    2. Move from project root folder to folder `tests-suite` by running `cd test-suite`
    3. Create virtual environment, named `.venv`: run `py -m venv .venv`
    4. Activate virtual environment `.venv`: run `.venv\Scripts\activate`
    5. Install required packages: run `pip install -r requirements.txt` (once `.venv` is active)
    6. Restart `VS Code`

## Run benchmarks
1. Run DIDChain:
    1. Open new terminal
    2. Move from project root folder to folder `tests-and-results` by running `cd test-suite/tests-and-results`
    3. Run `npm start` to run DIDChain server
2. Run tests and create measurements:
    1. Open new terminal
    2. Move from project root folder to folder `tests-and-results` by e. g. `cd test-suite/tests-and-results`
    3. Run `npm run benchmarking`, ultimately leading to the `measurements` folder being populated.
4. Analyse test measuremnts and thus reproduce figures and evaluation results described in paper:
    1. Run all cells inside `benchmarking.ipynb`
    2. Examine output of cells and content of folder `plots` for analysis
    

## How to reproduce benchmarks for each implementation?
1. reproduce measuremnts for implementation based on DIDs of type Cheqd with the help of Cheqd's Credential Service API:
    1. navigate to folder of implementation by running `cd did-cheqd-credential-service-api`
    2. intstall all packages by running `npm install` (Used Node.js version: v20.8.1)
    3. create `.env` file in folder `did-cheqd-credential-service-api` and declare the following environment variables:
        - ``MORALIS_API_KEY``: set thie variable to the API key after creating an account on moralis, like [so](https://docs.moralis.io/web3-data-api/evm/get-your-api-key#step-2-get-api-key)
        - ``CHEQD_CREDENTIAL_SERVICE_TOKEN``: set this variable to the JWT API key returned by the `/account/idToken` GET request in the [Swagger](https://credential-service.cheqd.net/swagger/#/Account/get_account_idtoken) of the ``Credential Service API for cheqd network`` (login required first)
        
        NOTE: since it is a JWT, one needs to update this variable once the JWT token expires.
    4. run `npm start` while being inside the folder `cd did-cheqd-credential-service-api` to start the implementation which essentialy is an api for documenting supply chain events using the ``Credential Service API for cheqd network``
    5. open new terminal and run `npm run benchmarking`. This comand will run the benchmarking script for this implementation, ultimately leading to the ``measurements`` folder being populated.
2. navigate back to root folder of repo
3. install python packages, listed in `requirements.txt` (with Python 3.12.0)
4. run all cells inside `benchmarking.ipynb` which will create figures in the folder `plots`