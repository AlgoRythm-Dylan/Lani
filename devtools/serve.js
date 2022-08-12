const express = require('express');
const path = require("path");
const bodyParser = require("body-parser");
const fsp = require("fs").promises;
const crypto = require("crypto");
const PORT = 1234;
const app = express();

let uuid = () => crypto.randomBytes(16).toString("hex");

let folder = process.argv[2];
if(!folder)
    folder = "playground";

app.use(express.static(__dirname + `/${folder}`, {extensions: ["html"]}));
app.use(bodyParser.json())

function getDataPath(file){
    return path.join(__dirname, "data", file);
}

app.get("/tcgo-pkmn", (request, response) => {
    response.sendFile(getDataPath("tcgo-pkmn.json"));
});

app.post("/tcgo-pkmn", async (request, response) => {
    let existing = JSON.parse(await fsp.readFile(getDataPath("tcgo-pkmn.json")));
    request.body.UUID = uuid();
    existing.push(request.body);
    await fsp.writeFile(getDataPath("tcgo-pkmn.json"), JSON.stringify(existing));
    response.send(existing);
});

app.delete("/tcgo-pkmn", async (request, response) => {
    let UUID = request.query["UUID"];
    if(typeof UUID === 'undefined' || UUID === null){
        response.sendStatus(400);
        return;
    }
    let existing = JSON.parse(await fsp.readFile(getDataPath("tcgo-pkmn.json")));
    existing = existing.filter(card => card.UUID != UUID);
    await fsp.writeFile(getDataPath("tcgo-pkmn.json"), JSON.stringify(existing));
    response.send(existing);
});

app.patch("/tcgo-pkmn", async (request, response) => {
    let UUID = request.query["UUID"];
    if(typeof UUID === 'undefined' || UUID === null){
        response.sendStatus(400);
        return;
    }
    let existing = JSON.parse(await fsp.readFile(getDataPath("tcgo-pkmn.json")));
    for(let i = 0; i < existing.length; i++){
        if(existing[i].UUID == UUID){
            Object.assign(existing[i], request.body);
        }
    }
    await fsp.writeFile(getDataPath("tcgo-pkmn.json"), JSON.stringify(existing));
    response.send(existing);
});

app.listen(PORT);
console.log(`Now listening on port ${PORT}`);