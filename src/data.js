/*

    Data container / operations module

*/
Lani.installedModules.push("lani-data");

Lani.DataSetExporters = {};

Lani.DataSetExporter = class {
    constructor(dataSet, fileName="download"){
        this.dataSet = dataSet;
        this.fileName = fileName;
    }
    async export(){

    }
    finish(blob){
        Lani.downloadBlob(blob, this.fileName);
    }
}

Lani.CSVDataSetExporter = class extends Lani.DataSetExporter {
    constructor(dataSet, fileName="download.csv"){
        super(dataSet, fileName);
    }
    async export(){

    }
}

Lani.DataSetExporters["text/csv"] = Lani.CSVDataSetExporter;

Lani.DataRow = class {
    constructor(data, key=null){
        this.data = data;
        this.key = key;
    }
}

Lani.DataSet = class {
    constructor(){
        this.isGrouped = false;

        this.rows = [];
    }
    // create from a raw array
    static from(arr){
        let set = new Lani.DataSet();
        for(let item of arr){
            set.rows.push(new Lani.DataRow(item));
        }
        return set;
    }
    slice(start, end){
        let set = new Lani.DataSet();
        set.isGrouped = this.isGrouped;
        set.rows = this.rows.slice(start, end);
        return set;
    }
    toArray(){
        
    }
    filter(filterList){
        for(let filter of filterList)
            for(let i = 0; i < this.rows.length; i++)
                if(!filter.meetsCondition(this.rows[i].data))
                    this.removeAt(i--);
    }
    group(groupList){

    }
    sort(sortList){

    }
    at(i){
        return this.rows[i];
    }
    removeAt(i){
        this.rows.splice(i, 1);
    }
    get length(){
        return this.rows.length;
    }
    async export(fileName, fileType){
        let exporterClass = Lani.DataSetExporters[fileType];
        if(!exporter)
            throw "No export generator found for file type " + fileType;
        let exporter = new exporterClass(this, fileName);
        await exporter.export();
    }
}

/*

    Lani DataSource mutations

    1) Filters
    2) Grouping
    3) Sorting
    4) Paging

*/

// Base filter class
Lani.Filter = class {
    constructor(){
        this.column = null;
        this.value = null;
    }
    meetsCondition(data){
        return data[this.column] === this.value;
    }
}

Lani.SortDirection = {
    Asc: "Ascending",
    Desc: "Descending"
};

Lani.Sort = class {
    constructor(column, direction = null){
        this.column = column;
        this.direction = direction ?? Lani.SortDirection.Desc;
    }
}

Lani.Paginator = class {
    constructor(){
        this.page = 1; // You start at page 1 of a book
        this.itemsPerPage = 10;
        this.scroll = 0; // Scroll = skip

        this.enabled = true;

        this.count = null;
    }
    get indices(){
        let start = this.scroll + ((this.page - 1) * this.itemsPerPage);
        let end = this.scroll + (this.page * this.itemsPerPage);
        if(this.count !== null)
            if(end > this.count)
                end = this.count;
        return { start, end };
    }
    get pages(){
        if(this.count === null)
            return null;
        return Math.ceil(this.count / this.itemsPerPage);
    }
}

Lani.DataSourceReturnType = {
    Array: "Array",
    DataSet: "DataSet"
};

// Base / abstract data source class
Lani.DataSource = class {
    constructor(){
        this.filters = [];
        this.groups = [];
        this.sorts = [];
        this.paginator = new Lani.Paginator();
        this.paginator.enabled = false;

        // Generally, DataSources are used by Lani
        this.returnType = Lani.DataSourceReturnType.DataSet;
    }
    async update(){ }
    async get(){ }
}

// Data source class for arrays
Lani.InMemoryDataSource = class extends Lani.DataSource {
    constructor(array){
        super();
        this.paginator.enabled = false;
        this.array = array;
        this.product = null;
    }
    async get(update = true){
        if(update)
            await this.update();
        if(this.paginator === null || !this.paginator.enabled)
            return this.product;
        let indices = this.paginator.indices;
        return this.product.slice(indices.start, indices.end);
    }
    setArray(array){
        this.array = array;
        this.update();
    }
    async update(){
        this.product = Lani.DataSet.from(this.array);
        this.product.filter(this.filters);
        this.product.group(this.groups);
        this.product.sort(this.sorts);
        if(this.returnType === Lani.DataSourceReturnType.Array)
            this.product = this.product.toArray();
        this.paginator.length = this.product.length;
        return this.product;
    }
}

Lani.DownloadedDataSource = class extends Lani.DataSource {
    constructor(source=null){
        this.source = source;
        this.fetchOptions = {};
        this.data = null;
    }
    async get(){
        if(this.data === null)
            await this.download();
    }
    async download(){
        if(this.source === null)
            throw "Tried to download from a null source";
        this.data = Lani.DataSet.from(
            await (
                await fetch(this.source, this.fetchOptions)
            ).json()
        );
    }
}


/*
    Data elements get information about each other,
    for example, when one item adds a filter, when
    the data source is updated, etc. The idea is to
    use them to create charts.
*/
Lani.DataElement = class extends Lani.Element {
    constructor(){
        super();
    }
}

/*
    A group of related DataElements which
    will recieve information and updates from
    each other
*/
Lani.DataDisplayGrouping = class {
    constructor(){
        this.elements = [];
    }
    connect(element){
        this.elements.push(element);
    }
    disconnect(element){
        this.elements = this.elements.filter(item => item !== element);
    }
}

/*

    Non-Lani-DataSet functions

*/

// Group an array of objects to a structure of nested objects
// Example usage: Lani.group([ ... ], ["JobTitle"]); // Group array by only job title
//                Lani.group([ ... ], ["Company","JobTitle"]); // 2-layer grouping
Lani.group = (data, groupStack) => {

    // In this case, we have been asked to group data
    // without any groups to use. We will be nice
    // and simply return the data.
    if(groupStack.length === 0)
        return data;
    
    let thisGroup = {};
    let thisColumn = groupStack.shift();
    for(let i = 0; i < data.length; i++){
        let key = data[i][thisColumn];
        if(thisGroup[key])
            thisGroup[key].push(data.slice(i, i + 1)[0]);
        else
            thisGroup[key] = data.slice(i, i + 1);
    }
    if(groupStack.length){
        // Not so fast, there's more grouping to be done
        let entries = Object.entries(thisGroup);
        for([key, value] of entries)
            thisGroup[key] = Lani.group(value, groupStack.slice());
    }
    return thisGroup;
}

// Explode a grouped object into an array
// Luckily, at the bottom of each group is a copy
// of the original data
Lani.ungroup = (groupedData) => {
    let data = [];
    if(Array.isArray(groupedData)){
        data.push(...groupedData.slice());
    }
    else{
        Object.values(groupedData).forEach(value => {
            data.push(...Lani.ungroup(value));
        });
    }
    return data;
}

Lani.initCap = word => {
    if(typeof word !== "string" || word.length === 0) return word;
    if(word.includes(" ")){
        return Lani.search.splitWords(word).map(Lani.initCap).join(" ");
    }
    return word[0].toLocaleUpperCase() + word.substring(1).toLocaleLowerCase();
}
Lani.containsLowercaseLetters = word => word !== word.toLocaleUpperCase();

Lani.undoCamelCase = word => {
    if(typeof word !== "string" || word.length === 0) return word;
    if(word.includes(" ")){
        return Lani.search.splitWords(word).map(Lani.undoCamelCase).join(" ").toLocaleLowerCase();
    }
    if(!Lani.containsLowercaseLetters(word))
        return word;  // This might be an acronym
    return word.split(/(?=[A-Z])/g).join(" ").toLocaleLowerCase();
}

Lani.DataNamePrettifier = class {
    constructor(){
        this.enabled = true;
        this.replaceUnderscoreWithSpace = true;
        this.undoCamelCase = true;
        this.normalizeCasing = true;
    }
    prettify(input){
        if(this.enabled === false)
            return input;
        let output = input; 
        if(this.replaceUnderscoreWithSpace)
            output = output.replaceAll("_", " ");
        if(this.undoCamelCase)
            output = Lani.undoCamelCase(output);
        if(this.normalizeCasing)
            output = Lani.initCap(output);
        return output;
    }
}

Lani.prettifyDataName = (word, options={}) => {
    let prettifier = new Lani.DataNamePrettifier();
    Object.assign(prettifier, options);
    return prettifier.prettify(word);
}