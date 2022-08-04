Lani.installedModules.push("lani-testing");

Lani.TestError = class extends Error {
    constructor(message){
        super(message);
    }
}

Lani.assertEqual = (a, b) => {
    if(a != b)
        throw new Lani.TestError(`${a} should be equal to ${b}`);
}

Lani.assertStrictlyEqual = (a, b) => {
    if(a !== b)
        throw new Lani.TestError(`${a} should be strictly equal to ${b}`);
}

Lani.assertInequal = (a, b) => {
    if(a == b)
        throw new Lani.TestError(`${a} should not be equal to ${b}`);
}

Lani.assertStrictlyInequal = (a, b) => {
    if(a === b)
        throw new Lani.TestError(`${a} should not be strictly equal to ${b}`);
}

Lani.assertGreaterThan = (a, b) => {
    if(!(a > b))
        throw new Lani.TestError(`${a} should be greater than ${b}`);
}

Lani.assertLessThan = (a, b) => {
    if(!(a < b))
        throw new Lani.TestError(`${a} should be less than ${b}`);
}

Lani.assertGreaterThanEq = (a, b) => {
    if(!(a >= b))
        throw new Lani.TestError(`${a} should be greater than or equal to ${b}`);
}

Lani.assertLessThanEq = (a, b) => {
    if(!(a <= b))
        throw new Lani.TestError(`${a} should be less than or equal to ${b}`);
}

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