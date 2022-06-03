const fsp = require("fs").promises;
const uglify = require("uglify-js");
const zlip = require("zlib");

const DEFAULT_ENV = "dev";

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

function extendDefinition(definition, definitions){
    console.log(`Build definition "${definition.name}" extends "${definition.extends}"...`);
    let parentDefinition = definitions.filter(def => def.name == definition.extends);
    if(parentDefinition.length === 1){
        parentDefinition = parentDefinition[0];
    }
    else if(parentDefinition.length > 1){
        throw `Parent definition ("${definition.extends}") for build "${definition.name}" is ambiguous (more than one with the same name)`;
    }
    else {
        throw `Could not find parent definition "${definition.extends}" for build "${definition.name}"`;
    }
    if(parentDefinition.extends)
        parentDefinition = extendDefinition(parentDefinition, definitions);
    // Just so that this can be guaranteed to be at least an empty array
    if(!definition.overrideProperties)
        definition.overrideProperties = [];
    for(const [key, value] of Object.entries(parentDefinition)){
        if(definition.overrideProperties.includes(key))
            continue;
        if(typeof definition[key] === "undefined")
            definition[key] = value;
        else{
            if(Array.isArray(value)){
                definition[key] = value.concat(value, definition[key])
            }
            else{
                // Unless overridden, parent takes precedence
                if(key !== "name")
                    definition[key] = value;
            }
        }
    }
    return definition;
}

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

    let env;
    if(process.argv.length > 3)
        env = process.argv[3];
    else
        env = DEFAULT_ENV;

    for(let definition of defs){
        if(typeof definition.extends !== "undefined"){
            try{
                definition = extendDefinition(definition, defs);
            }
            catch(ex){
                console.error(ex);
                continue;
            }
        }
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
        if(!definition.envs.includes(env)){
            console.log(`Skipping build definition "${definition.name}" because it does not match the current environment`);
            continue;
        }
        await handler(definition);
    }
}

main();