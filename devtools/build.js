const fsp = require("fs").promises;
const uglify = require("uglify-js");
const zlip = require("zlib");

async function copy(definition){
    console.log("Starting build task...");
    if(definition.inputs.length !== 1){
        console.error(`Error: copy build needs an input list of exactly 1 item`);
        return;
    }
    console.log(`Reading "${definition.inputs[0]}"...`);
    let input = await fsp.readFile(definition.inputs[0]);
    for(let output of definition.outputs){
        console.log(`Writing to "${output}"...`);
        await fsp.writeFile(output, input);
    }
    await post(definition, input);
    console.log("Build task complete");
}

async function concat(definition){
    console.log("Starting build task...");
    let buffer = null;
    for(let input of definition.inputs){
        console.log(`Reading "${input}"...`);
        if(buffer)
            buffer = Buffer.concat([buffer, Buffer.from("\n"), await fsp.readFile(input)]);
        else
            buffer = await fsp.readFile(input);
    }
    for(let output of definition.outputs){
        console.log(`Writing to "${output}"...`);
        await fsp.writeFile(output, buffer);
    }
    await post(definition, buffer);
    console.log("Build task complete");
}

async function post(definition, buffer){
    if(!definition.post)
        return;
    if(definition.post.includes("minify-js")){
        console.log("Performing post-processing: minify-js");
        let minified = uglify.minify(buffer.toString("UTF-8"));
        if(minified.error){
            console.error(`Could not minify JS: ${minified.error}`);
        }
        else{
            for(let output of definition.outputs){
                let fileName = output;
                if(fileName.endsWith(".js")){
                    fileName = fileName.slice(0, -3) + ".min.js";
                }
                console.log(`Writing to "${fileName}"...`);
                await fsp.writeFile(fileName, minified.code);
            }
        }
    }
}

let handlers = {
    "copy": copy,
    "concat": concat
};

async function main(){
    console.log("Starting build...");
    let defs;

    try{
        defs = JSON.parse(await fsp.readFile(process.argv[2]));
    }
    catch(ex){
        console.error(`Error reading build definition file: ${ex}`);
        return;
    }

    for(let definition of defs){
        if(definition.enabled !== true){
            console.log(`Skipping disabled definition "${definition.name}"`);
            continue;
        }
        console.log(`Executing build definition "${definition.name}"`);
        let handler = handlers[definition.mode];
        if(!handler){
            console.error(`Cannot find handler for build type "${definition.mode}". Skipping build`);
            continue;
        }
        await handler(definition);
    }
}

main();