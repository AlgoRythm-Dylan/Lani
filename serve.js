const express = require('express');
const PORT = 1234;
const app = express();

let folder = process.argv[2];
if(!folder)
    folder = "playground";

app.use(express.static(__dirname + `/${folder}`, {extensions: ["html"]}));

app.listen(PORT);
console.log(`Now listening on port ${PORT}`);