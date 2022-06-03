/*

    Data container / operations module

*/
Lani.installedModules.push("lani-data");

Lani.DataSourceFeatures = {
    Count: 0,

    Select: 1,
    Update: 2,
    Delete: 3,
    Insert: 4
};

// A data source has the responsibility
// of providing data

// A data manager has the responsibility
// of performing mutations on that data

// A data source (especially one that is
// fetching data from a large set of server
// data) may also perform mutations such
// as pagination, sorting, and filtering.


// This the base DataSource class. Unline the 
// `DataManager` class, this class is meant to
// be extended and overridden based on where
// your specific data is coming from. Since items
// are likely to be implemented with network
// calls, all methods are to be async
Lani.DataSource = class {
    constructor(data=[]){
        this.data = data;
        this.supportedFeatures = [];
        this.supportsAllFeatures = true;
    }
    async getAll(){
        return this.data;
    }
    async get(delegate){
        let matches = [];
        for(let item of this.data)
            if(delegate(item))
                matches.push(item);
        return matches;
    }
    async getIndex(index){
        return this.data[index];
    }
    async getRange(startIndex, amount=1){
        return this.data.slice(startIndex, startIndex + amount);
    }
    async setAll(data){
        this.data = data;
    }
    async set(delegate, value){
        for(let i = 0; i < this.data.length; i++)
            if(delegate(this.data[i]))
                this.data[i] = value;
    }
    async setIndex(index, value){
        this.data[index] = value;
    }
    async count(){
        return this.data.length;
    }
    async insert(value){
        this.data.push(value);
    }
    async insertAll(values){
        this.data.push(...values);
    }
    async remove(delegate){
        for(let i = 0; i < this.data.length; i++)
            if(delegate(data[i]))
                this.data.splice(i--, 1);
    }
    async removeAll(){
        this.data = [];
    }
    supports(feature){
        return this.supportsAllFeatures || this.supportedFeatures.includes(feature);
    }
}

Lani.FetchedDataSource = class extends Lani.DataSource {
    constructor(){
        super();

        this.supportsAllFeatures = false;

        this.url = null;
        this.fetchOptions = {};
    }
    async getAll(){
        return await (await fetch(this.url, this.fetchOptions)).json();
    }
}

// Pagination is 1-based because a "page" is
// a COUNT, not an INDEX. You can get index
// ranges from this pagination class, which
// do, in fact, start at 0, but
// the "page" value will allways start at one
// because nobody reads a book starting from
// page 0.

// If this bothers you heavily, you can also
// use the "scroll" value, which allows you
// to offset the current page by a certain
// amount of records.

// This class is intended to be more of a 
// "state" class, which describes the state
// of the pagination of some object. However,
// if given a valid data source, it can also
// provide additional information
Lani.Pagination = class {
    constructor(){
        this.enabled = true;
        this.itemsPerPage = 10;
        this.page = 1;
        this.scroll = 0;
        this.dataSource = null;
    }
    reset(){
        this.scroll = 0;
        this.page = 1;
    }
    getIndices(maxCount = null, inclusive = true){
        let indices = {
            start: this.scroll + ((this.page - 1) * this.itemsPerPage),
            end: this.scroll + (this.page * this.itemsPerPage)
        };
        if(inclusive)
            indices.end--;
        if(maxCount !== null){
            if(indices.end > maxCount)
                indices.end = maxCount;
            if(indices.start > maxCount)
                indices.start = maxCount;
        }
        return indices;
    }
    async pages(){
        if(this.dataSource === null)
            return 1;
        else
            return await this.dataSource.count() / this.itemsPerPage;
    }
}

Lani.Filter = class {
    constructor(){

    }
}

Lani.Sort = class {
    constructor(){

    }
}

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

Lani.findGroupDepth = groupedData => {
    let count = 0;
    let found = false;
    let item = groupedData;
    while(!found){
        if(Array.isArray(item)){
            found = true;
        }
        else{
            count++;
            item = Object.values(item)[0];
        }
    }
    return count;
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

// While `DataSource`s are meant to be specific
// and even implemented on a per-source level,
// this DataManager should be the last one you'd
// ever need, unless you want to extend it's
// functionality
Lani.DataManager = class {
    constructor(){
        this.dataSource = null;

        // This is the order that these three
        // items execute. Data is first filtered,
        // then grouped, then sorted.
        // The order of the arrays is also important.
        this.filters = [];
        this.groups = [];
        this.sorts = [];

        // If pagination is enabled, this DataManager
        // will only return data from the current page.
        // Pagination happens after filtering, grouping,
        // and sorting
        this.pagination = new Lani.Pagination();
    }
    // Returns an arary of gorups, to be used analytically
    // rather than simply displayed. Not all columns may be
    // grouped. The bottom-most group will contain the
    // remaining un-grouped data in a "table" format - an array
    async getGrouped(){
        if(!this.pagination.enabled)
            return Lani.group(await this.dataSource.getAll(), this.groups);
        else{
            let count = null;
            if(this.dataSource.supports(Lani.DataSourceFeatures.Count))
                count = await this.dataSource.count();
            let indices = this.pagination.getIndices(count, false);
            let data = await (await this.dataSource.getRange(indices.start, indices.end - indices.end)).json();
            return Lani.group(data, this.groups);
        }
    }
    // Returns a flat array of objects, ready to just
    // be thrown 1:1 into a table. In this case,
    // "groups" are just multi-level sorts
    async getArray(){

    }
    // Automatically return either an array or grouping
    // based on if this table has grouping enabled
    async get(){
        if(this.groups.length === 0)
            return await this.getArray();
        else
            return await this.getGrouped();
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
    Data elements get information about
*/
Lani.DataElement = class extends Lani.Element {
    constructor(){
        super();
    }
}