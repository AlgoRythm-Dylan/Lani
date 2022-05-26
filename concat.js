const fs = require('fs');
const fsp = fs.promises;

const jsOutputs = ['./build/lani.js', './docs/lani/lani.js', './playground/lani/lani.js'];
const jsFiles = [
    './core.js',
    './data.js',
    './dialog.js',
    './context.js',
    './extras.js',
    './icon.js',
    './paginator.js',
    //'./caching.js',
    
    './animations.js',
    './animations/bubbles.js',
    './animations/dot-grid.js',
    './animations/tree.js',

    './tables/core.js',
    './tables/element.js'
    
    //'./tables/table.js',
];

const cssOutputs = ['./build/lani.css', './docs/lani/lani.css', './playground/lani/lani.css'];
const cssFiles = [
    './core.css',
    './dialogs.css',
    './tables/tables.css'
];

const copyFiles = {
    "./src/templates.html": [
        "./build/templates.html",
        "./docs/lani/templates.html",
        "./playground/lani/templates.html"
    ]
}

async function main(){
    try{
        console.log('Beginning JS concatenation...');
        for(let j = 0; j < jsOutputs.length; j++){
            let output = jsOutputs[j];
            let handle = fs.createWriteStream(output);
            for(let i = 0; i < jsFiles.length; i++) {
                let file = jsFiles[i];
                handle.write(await fsp.readFile(`./src/${file}`) + '\n', err => {
                    if(err)
                        console.log(`Error writing file ${file}: ${err}`);
                });
            };
            handle.close();
        }
        console.log('JS files concatenated');
    }
    catch(ex){
        console.error(`Error building Lani JS: ${ex}`);
    }
    try{
        console.log('Beginning CSS concatenation...');
        for(let j = 0; j < cssOutputs.length; j++){
            let output = cssOutputs[j];
            let handle = fs.createWriteStream(output);
            for(let i = 0; i < cssFiles.length; i++) {
                let file = cssFiles[i];
                handle.write(await fsp.readFile(`./src/${file}`) + '\n', err => {
                    if(err)
                        console.log(`Error writing file ${file}: ${err}`);
                });
            };
            handle.close();
        }
        console.log('CSS files concatenated');
    }
    catch(ex){
        console.error(`Error building Lani CSS: ${ex}`);
    }
    try{
        for(const [key, value] of Object.entries(copyFiles)){
            for(file of value)
                await fsp.copyFile(key, file);
        }
    }
    catch(ex){
        console.error(`Error copying files: ${ex}`);
    }
}

main();