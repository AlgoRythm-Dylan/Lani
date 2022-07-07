/*

    Data container / operations module

*/
Lani.installedModules.push("lani-data");

Lani.DataRow = class {
    constructor(data, key=null){
        this.data = data;
        this.key = key;
    }
}

Lani.DataSet = class {
    constructor(){
        this.rows = [];
        this.isGrouped = true;
    }
    // create from a raw array
    static from(arr){
        let set = new Lani.DataSet();
        for(let item of arr){
            set.push(new Lani.DataRow(item));
        }
        return set;
    }
    static explode(dataSet){

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



// Base / abstract data source class
Lani.DataSource = class {
    constructor(){
        this.filters = [];
        this.groups = [];
        this.sorts = [];
        this.paginator = new Lani.Paginator();
        this.paginator.enabled = false;
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
    async get(){
        if(this.product === null)
            return null;
        if(this.paginator === null || !this.paginator.enabled)
            return this.product;
        let indices = this.paginator.indices;
        return this.product.splice(indices.start, indices.end);
    }
    setArray(array){
        this.array = array;
        this.#generateProduct();
    }
    async update(){
        this.product = Lani.DataSet.from(this.array);
        if(this.filters.length > 0)
            this.product.filter(this.filters);
        if(this.groups.length)
            this.product.group(this.groups);
        if(this.sorts.length)
            this.product.sort(this.sorts);
        this.paginator.length = this.product.length;
        return this.product;
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