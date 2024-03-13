const express = require("express");
const cors = require("cors");


const PORT = process.env.PORT || 3001;

const app = express();

// enable frontend to call endpoints
app.use(cors());

// For parsing application/json
app.use(express.json());

// use API for IPFS
const apiRouter = require("./api/routes");
app.use("/api", apiRouter);

//if production give app static assets (e.g. favicon and all routes)
if(process.env.NODE_ENV === "production"){
  // allow app to use static files of build folder
  app.use(express.static(path.join(__dirname, "..", "vscms", "build")))

  // enable app to detect all url routes
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "vscms", "build", "index.html"));
  });  
};

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
