Lani.installedModules.push("lani-testing");

Lani.UnitTestError = class extends Error {
    constructor(message){
        super(message);
    }
}

Lani.assertEqual = (a, b) => {
    if(a !== b)
        throw new Lani.UnitTestError(`${a} is not equal to ${b}`);
}

Lani.UnitTest = class {
    constructor(){
        
    }
    evaluate(){

    }
};

Lani.PerformanceTest = class {
    constructor(){
        this.iterations = 1000000;
        this.start = null;
        this.end = null;
    }
    test(){

    }
    get time(){
        return this.end - this.start;
    }
}

Lani.UnitTests = [];
Lani.PerformanceTests = [];