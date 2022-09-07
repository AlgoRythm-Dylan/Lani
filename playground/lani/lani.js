/*

    Core

*/
const Lani = window.Lani || { };
Lani.version = "0.1.0";
Lani.installedModules = [];
Lani.contentRoot = "/lani";
Lani.shadowLinks = [
    "/fontawesome/fontawesome.min.css",
    "/fontawesome/solid.min.css"
];
Lani.templatesPath = () => Lani.contentRoot + "/templates.html";

Lani.requireModule = moduleName => {
    if(!Lani.installedModules.includes(moduleName))
        throw `[Lani] A dependency was not met: ${moduleName}`;
}

Lani.removeClass = (element, className) => {
    element.className = element.className
        .split(" ")
        .filter(item => item != className)
        .join(" ");
}

// document.createElement, el.className = x, parent.appendChild(el)
// but all in one, plus more!
Lani.create = (elementName, options={}) => {
    let el = document.createElement(elementName);
    if(options.className)
        el.className = options.className;
    if(options.id)
        el.id = options.id;
    if(options.src)
        el.src = options.src;
    if(options.innerHTML)
        el.innerHTML = options.innerHTML;
    if(options.attrs)
        for(const [key, value] of Object.entries(options.attrs))
            el.setAttribute(key, value);
    if(options.parent)
        options.parent.appendChild(el);
    if(options.slot)
        el.setAttribute("slot", options.slot);
    return el;
}

// The absolute shortest that "document.createElement" can get, pretty much
Lani.c = (elementName, className, parent, options) => {
    options = options || {};
    options.className = className;
    options.parent = parent;
    return Lani.create(elementName, options);
}

Lani.templateRepository = {};

Lani.loadTemplate = async (src, querySelector) => {
    let cached = Lani.templateRepository[src];
    if(!cached){
        cached = await (await fetch(src)).text();
        cached = new DOMParser().parseFromString(cached, "text/html")
        Lani.templateRepository[src] = cached;
    }
    return cached.querySelector(querySelector);
}

Lani.ElementEvents = {
    Ready: "lani::ready",
    Close: "lani::close",
    Show: "lani::show",
    StateChange: "lani::state-change"
};

// Lifecycle callbacks:
//      - connectedCallback
//      - disconnectedCallback
//      - adoptedCallback
//      - attributeChangedCallback
Lani.Element = class extends HTMLElement {
    constructor(useShadow = true, shadowOptions = {}){
        super();
        this.usesShadow = useShadow;
        if(typeof shadowOptions.mode === "undefined")
            shadowOptions.mode = "closed";
        if(useShadow)
            this.shadow = this.attachShadow(shadowOptions);
        else
            this.shadow = this;
        // The above decision could be considered controvercial
        // because the outcome is misleading. Having this.shadow
        // be a valid element when there should be none could cause
        // confusion, but I think the fact that the variable can
        // always be used to attach elements to is important
        this.importLaniLibs();
    }
    linkStyles(styleLinkArray){
        styleLinkArray.forEach(link => {
            Lani.create("link", {
                parent: this.shadow,
                attrs: {
                    href: link,
                    rel: "stylesheet",
                    type: "text/css"
                }
            });
        });
    }
    linkStyle(styleLink){
        this.linkStyles([styleLink]);
    }
    importLaniLibs(){
        // Lani CSS is only available to shadow-enabled elements
        if(!this.usesShadow)
            return;
        this.linkStyles([
            Lani.contentRoot + "/lani.css"
        ]);
        this.linkStyles(Lani.shadowLinks);
    }
    useDOMTemplate(id, emitReady=true){
        let template = document.getElementById(id);
        this.shadow.appendChild(template.content.cloneNode(true));
        if(emitReady)
            this.ready();
    }
    async useTemplate(src, querySelector, emitReady=true){
        let template = await Lani.loadTemplate(src, querySelector);
        this.shadow.appendChild(template.content.cloneNode(true));
        if(emitReady)
            this.ready();
    }
    async useDefaultTemplate(id, emitReady=true){
        await this.useTemplate(Lani.templatesPath(), `#${id}`, emitReady);
    }
    emit(eventName, detail={}){
        this.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
    ready(detail={}){
        this.emit(Lani.ElementEvents.Ready, detail);
    }
    setupNonDOM(){
        this.setAttribute("lani-declarative", "true");
    }
    getIntAttribute(name){
        let val = this.getAttribute(name);
        if(val)
            return parseInt(name);
        else
            return null;
    }
    getFloatAttribute(name){
        let val = this.getAttribute(name);
        if(val)
            return parseFloat(name);
        else
            return null;
    }
    getBoolAttribute(name, ifMissingValue=false){
        let val = this.getAttribute(name);
        if(val === null)
            return ifMissingValue;
        return val.toLowerCase() === "true";
    }
}

Lani.waitForElement = elementName => {
    return new Promise((resolve) => {
        let el = document.createElement(elementName);
        el.addEventListener(Lani.ElementEvents.Ready, () => resolve(el));
    });
}

Lani.regEl = (elementName, element, options) => {
    customElements.define(elementName, element, options);
}

Lani.Direction = {
    Left: "left",
    Right: "right"
};

Lani.Position = {
    Start: "start",
    Middle: "middle",
    End: "end",
    Absolute: "abs"
};

Lani.positionElement = (element,
                        horizontalPosition,
                        verticalPosition,
                        horizontalOffset = 0,
                        verticalOffset = 0) => {
    if(horizontalPosition){
        if(horizontalPosition == Lani.Position.Start)
            element.style.left = "0px";
        else if(horizontalPosition == Lani.Position.Middle)
            element.style.left = `${horizontalOffset + ((element.parentNode.offsetWidth / 2) - (element.offsetWidth / 2))}px`;
        else if(horizontalPosition == Lani.Position.End)
            element.style.left = `${horizontalOffset + (element.parentNode.offsetWidth - element.offsetWidth)}px`;
        else if(horizontalPosition == Lani.Position.Absolute)
            element.style.left = `${horizontalOffset}px`;
    }
    if(verticalPosition){
        if(verticalPosition == Lani.Position.Start)
            element.style.top = "0px";
        else if(verticalPosition == Lani.Position.Middle)
            element.style.top = `${verticalOffset + ((element.parentNode.offsetHeight / 2) - (element.offsetHeight / 2))}px`;
        else if(verticalPosition == Lani.Position.End)
            element.style.top = `${verticalOffset + (element.parentNode.offsetHeight - element.offsetHeight)}px`;
        else if(verticalPosition == Lani.Position.Absolute)
            element.style.top = `${verticalOffset}px`;
    }
}

Lani.downloadBlob = (blob, fileName) => {
    let a = Lani.c("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
}

// Very simple and does no concrete tests
Lani.getLaniElements = element => {
    let results = [];
    for(let child of element.children)
        if(child.tagName.startsWith("LANI-"))
            results.push(child);
    return results;
}

// Handles either string or HTML element templates without
// needing to discriminate between the two, and offers append
// mode or replace mode
Lani.useGenericTemplate = (template, parent, appendMode=true) => {
    if(template === null)
        return;
    if(typeof template === "string"){
        if(appendMode)
            parent.innerHTML += template;
        else
            parent.innerHTML = template;
    }
    else{
        if(!appendMode)
            parent.innerHTML = "";
        if(typeof template.content !== "undefined")
            parent.appendChild(template.content.cloneNode(true));
        else
            parent.appendChild(template);
    }
}

Lani.objectLoad = (source, objectType, options) => {
    let destination = options.destination ?? new objectType();

    let destItems = Object.entries(destination);

    for(let entry of destItems){
        let sourceTypeof = typeof source[entry.key];

        // TODO: Read options so that we can recursively load
        // subtypes of objects
        if(sourceTypeof === "undefined")
            continue;
        else
            dest[entry.key] = source[entry.key];
    }

    return destination;
}


// Generic description of a font
Lani.Font = class {
    constructor(){
        this.weight = null;
        this.isItalic = false;
        this.isUnderlined = false;
        this.family = null;
        this.size = null;
    }
    apply(element){
        if(this.weight !== null)
            element.style.fontWeight = this.weight;
        if(this.isItalic === true)
            element.style.fontStyle = "italic";
        if(this.isUnderlined === true)
            element.style.textDecoration = "underline";
        if(this.family !== null)
            element.style.fontFamily = this.family;
        if(this.size !== null)
            element.style.fontSize = Lani.genericDimension(this.size);
    }
    get isBold(){
        return this.weight === 700;
    }
    set isBold(value){
        if(value === true)
            this.weight = 700;
        else
            this.weight = null;
    }
}

Lani.Corners = class {
    constructor(value=0){
        this.all = value;
    }
    set all(value){
        this.topLeft = value;
        this.topRight = value;
        this.bottomLeft = value;
        this.bottomRight = value;
    }
    applyToBorderRadius(element){
        if(this.topLeft !== null)
            element.style.borderTopLeftRadius = Lani.genericDimension(this.topLeft);
        if(this.topRight !== null)
            element.style.borderTopRightRadius = Lani.genericDimension(this.topRight);
        if(this.bottomRight !== null)
            element.style.borderBottomRightRadius = Lani.genericDimension(this.bottomRight);
        if(this.bottomLeft !== null)
            element.style.borderBottomLeftRadius = Lani.genericDimension(this.bottomLeft);
    }
}

Lani.Dimension = class {
    constructor(size=0){
        this.all = size;
    }
    set all(value){
        this.top = value;
        this.bottom = value;
        this.left = value;
        this.right =  value;
    }
    applyToMargin(element){
        element.style.marginTop = Lani.genericDimension(this.top);
        element.style.marginBottom = Lani.genericDimension(this.bottom);
        element.style.marginLeft = Lani.genericDimension(this.left);
        element.style.marginRight = Lani.genericDimension(this.right);
    }
    applyToPadding(element){
        element.style.paddingTop = Lani.genericDimension(this.top);
        element.style.paddingBottom = Lani.genericDimension(this.bottom);
        element.style.paddingLeft = Lani.genericDimension(this.left);
        element.style.paddingRight = Lani.genericDimension(this.right);
    }
    applyToBorder(element){
        element.style.borderTopWidth = Lani.genericDimension(this.top);
        element.style.borderBottomWidth = Lani.genericDimension(this.bottom);
        element.style.borderLeftWidth = Lani.genericDimension(this.left);
        element.style.borderRightWidth = Lani.genericDimension(this.right);
    }
    get isNone(){
        return (this.top === null || this.top === 0) &&
            (this.bottom === null || this.bottom === 0) &&
            (this.left === null || this.left === 0) &&
            (this.right === null || this.right === 0);
    }
}

// Allows for integer (number) values to be interpreted as pixel values
// (or whatever is passed in as the default dimension), but strings which
// come packaged with actual dimension specifications are still respected
Lani.genericDimension = (input, dimension="px") =>
    typeof input === "number" ? `${input}${dimension}` : input;

// Wanna take a property from an object, a fallback object, and another
// infinitely long list of fallback objects? Well, 'ere ya go
Lani.coalescedPropertyGet = (objectArray, name, goPastNull=true) => {
    for(obj of objectArray){
        let val = obj[name];
        if(typeof val !== "undefined" && (goPastNull && val !== null))
            return val;
    }
    return null;
}

// coalescedPropertyGet is ridiculously long
Lani.cPG = Lani.coalescedPropertyGet;

// Using the first object as the seed object, returns
// a basic JavaScript object that is populated by coalescing
// the properties of the seed all the way to the end of the list
Lani.coalescedObjectGet = (seed, objectArray, goPastNull=true) => {
    let keys = Object.keys(seed);
    for(let key of keys){
        seed[key] = Lani.coalescedPropertyGet([seed, ...objectArray], key, goPastNull);
    }
    return seed;
}

Lani.cOG = Lani.coalescedObjectGet;

// The same as Lani.coalescedObjectGet, but returns an instance
// of a type using Lani.objectLoad
Lani.typedCoalescedObjectGet = (objectArray, type, goPastNull=true, objectLoadOptions=null) => {
    return Lani.objectLoad(Lani.coalescedObjectGet(objectArray, goPastNull), type, objectLoadOptions);
}

Lani.tCOG = Lani.typedCoalescedObjectGet;
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

// Class so that if required, the data row can hold metadata
Lani.DataRow = class {
    constructor(data){
        this.data = data;
    }
}

// Sets the parent DataSet groupKey to the top groupStack value
// and then replaces the .rows property with an array of
// child DataSets grouped by the parent groupKey. If the
// groupStack has more, then the same is done for each child
// DataSet. Otherwise, the child DataSets have a .rows
// of DataRow
Lani.groupDataSetRecursive = (dataSet, groupStack) => {
    if(groupStack.length === 0)
        return dataSet;
    let newGroupStack = groupStack.slice();
    let columnToGroup = newGroupStack.shift();
    let groups = {};

    for(let dataRow of dataSet.rows){
        let groupValue = dataRow.data[columnToGroup];
        if(typeof groups[groupValue] === "undefined")
            groups[groupValue] = [];
        groups[groupValue].push(dataRow.data);
    }

    dataSet.groupKey = columnToGroup;
    dataSet.rows = Object.keys(groups).map(key => {
        let set = Lani.DataSet.from(groups[key])
        set.groupValue = key;
        return set;
    });

    if(newGroupStack.length !== 0){
        for(let newDataSet of dataSet.rows){
            Lani.groupDataSetRecursive(newDataSet, newGroupStack);
        }
    }

    return dataSet;
}

Lani.DataSet = class {
    constructor(){
        this.rows = [];
        this.groupKey = null;
        this.groupValue = null;
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
        Lani.groupDataSetRecursive(this, groupList);
    }
    sort(sortList){

    }
    at(i){
        return this.rows[i];
    }
    removeAt(i){
        this.rows.splice(i, 1);
    }
    get isGrouped(){
        return this.groupKey !== null;
    }
    get isAGroup(){
        return this.groupValue !== null;
    }
    get length(){
        return this.rows.length;
    }
    get count(){
        if(!this.isGrouped)
            return this.rows.length;
        else
            return this.rows.reduce((count, currentItem) => count + currentItem.count, 0);
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
    }
    async update(){ };
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
        super();
        this.source = source;
        this.fetchOptions = {};
        this.inMem = new Lani.InMemoryDataSource();
    }
    set groups(value){
        if(!this.inMem)
            return;
        this.inMem.groups = value;
    }
    get groups(){
        if(!this.inMem)
            return;
        return this.inMem.groups;
    }
    async update(){
        await this.inMem.update();
    }
    async get(){
        if(await this.inMem.get() === null)
            await this.download();
        return this.inMem.get();
    }
    async download(){
        if(this.source === null)
            throw "Tried to download from a null source";
        this.inMem.setArray(
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
Lani.search = {};

Lani.search.exact = (term, dataSet) => {
    return dataSet.filter(item => item === term);
}

Lani.search.includes = (term, dataSet, caseInsensitive=true) => {
    if(caseInsensitive){
        let lowerTerm = term.toLowerCase();
        return dataSet.filter(item => item.toLowerCase().includes(lowerTerm));
    }
}
Lani.search.splitWords = str => str.match(/\b(\w+)'?(\w+)?\b/g);

Lani.search.levenshtein = (str1, str2) => {
    if(str1.length === 0)
        return str2.length;
    else if(str2.length === 0)
        return str1.length;
    if(str1[0] === str2[0])
        return Lani.search.levenshtein(Lani.search.levenshteinTail(str1), Lani.search.levenshteinTail(str2));
    else
        return 1 + Math.min(
            Lani.search.levenshtein(Lani.search.levenshteinTail(str1), str2),
            Lani.search.levenshtein(str1, Lani.search.levenshteinTail(str2)),
            Lani.search.levenshtein(Lani.search.levenshteinTail(str1), Lani.search.levenshteinTail(str2))
        );
}

Lani.search.levenshteinTail = str => {
    return str.slice(1);
}
/*

    Dialog module

*/
Lani.installedModules.push("lani-context");


Lani.customContextMenu = (element, contextMenuItems, activateCallback, compact = false) => {

    let iconMode = false;
    for (let i = 0; i < contextMenuItems.length; i++) {
        if (contextMenuItems[i].icon !== null) {
            iconMode = true;
            break;
        }
    }


    element.addEventListener("contextmenu", event => {
        event.preventDefault();
        let contextElement = new Lani.ContextElement();

        let parent = document.createElement("div");
        parent.className = "l-context-element";
        contextElement.containerElement = parent;

        for (let i = 0; i < contextMenuItems.length; i++) {
            let menuItem = contextMenuItems[i];
            if (menuItem.isSeparator) {
                let menuItemElement = document.createElement("div");
                menuItemElement.className = "l-context-element-item-separator";
                parent.appendChild(menuItemElement);
            }
            else {
                let menuItemElement = document.createElement("p");

                if(compact)
                    menuItemElement.className = "l-context-element-item-compact";
                else
                    menuItemElement.className = "l-context-element-item";
                let text = menuItem.text;
                if (iconMode) {
                    if (menuItem.icon !== null) {
                        text = `<i class="${menuItem.icon} l-context-element-item-icon"></i>${text}`
                    }
                    else {
                        text = `<div class="l-context-element-item-icon"></div>${text}`
                    }
                }
                menuItemElement.innerHTML = text;

                menuItemElement.addEventListener("click", e => {
                    if (menuItem.onAction)
                        menuItem.onAction();
                    contextElement.close();
                });

                parent.appendChild(menuItemElement);
            }

        }

        if (activateCallback)
            activateCallback(contextElement.containerElement, contextElement);

        parent.style.top = `${event.layerY}px`;
        parent.style.left = `${event.layerX}px`;
        document.body.appendChild(parent);

        contextElement.addListeners();
        return contextElement;

    });
}

Lani.ContextElement = class {
    constructor(container = null) {
        this.containerElement = container;
        this.relatedElements = [];
        this.autoClose = true;

        this.mousedownListener = e => this.handleWindowEvent(e);
        this.scrollListener = e => this.handleWindowEvent(e);
        this.blurListener = e => this.handleWindowEvent(e);

        // Events
        this.onClickAway = null;
        this.onClose = null;
    }
    addListeners() {
        window.addEventListener("mousedown", this.mousedownListener);
        window.addEventListener("scroll", this.scrollListener);
        window.addEventListener("blur", this.blurListener);
    }
    removeListeners() {
        window.removeEventListener("mousedown", this.mousedownListener);
        window.removeEventListener("scroll", this.scrollListener);
        window.removeEventListener("blur", this.blurListener);
    }
    handleWindowEvent(event) {
        let target = event.target;
        if (target === this.containerElement) return;
        let parent = target;
        while ((parent = parent.parentNode)) {
            if (parent === this.containerElement ||
                this.relatedElements.indexOf(parent) !== -1)
                return;
        }
        if (this.onClickAway)
            this.onClickAway();
        if (this.autoClose)
            this.close();

    }
    close() {
        let continueClose = null;
        if (this.onClose)
            continueClose = this.onClose();
        if (typeof cancel !== "undefined" && continueClose === false)
            return;
        this.removeListeners();
        if(this.containerElement)
            this.containerElement.remove();
    }
}

Lani.ContextMenuItem = class {
    constructor(text, onAction=null, icon=null) {
        this.text = text;
        this.icon = icon;
        this.isSeparator = false;

        this.onAction = onAction;
    }
}

Lani.ContextMenuSeparator = class extends Lani.ContextMenuItem {
    constructor() {
        super();
        this.isSeparator = true;
    }
}
/*

    Lani "extras" module

*/
Lani.installedModules.push("lani-extras");

Lani.GibberishLength = {
    Short: 2,
    Medium: 15,
    Long: 100,
    VeryLong: 200
};
Lani.GibberishText = [
    'apple', 'mint', 'Florida', 'soda', 'leather', 'the',
    'a', 'to', 'bubblegum', 'bravery', 'environment', 'tea',
    'water', 'cake', 'chicken', 'wave', 'ice', 'lamp',
    'sheep', 'whereas', 'windy', 'tall', 'tree', 'lock',
    'finished', 'image', 'daytime', 'of', 'work', 'cow',
    'door', 'coin', 'by', 'blue', 'half', 'red', 'stone',
    'inside', 'loud', 'frozen', 'happy', 'scared', 'burnt',
    'bread', 'slide', 'increase', 'taste'
];
Lani.gibberish = length => {
    let words = [];
    for(let i = 0; i < length; i++)
        words.push(Lani.GibberishText[Math.floor(Math.random() * Lani.GibberishText.length)]);
    return words.join(" ");
}
/*

    Animation module

*/
Lani.installedModules.push("lani-animations");

Lani.animations = [];
Lani.previousTime = null;
Lani.windowBlurred = false;

Lani.randomSign = () => {
    let rnd = Math.random();
    if (rnd < 0.5) return -1;
    else return 1;
}

Lani.animationWindowBlurHandler = e => {
    Lani.previousTime = null;
    Lani.windowBlurred = true;
}
Lani.animationWindowFocusHandler = e => {
    Lani.windowBlurred = false;
}
Lani.animationLoadHandler = e => {
    Lani.startAnimationLoop();
}

Lani.animate = time => {
    if (!Lani.windowBlurred) {
        let deltaTime = 0;
        if (Lani.previousTime !== null)
            deltaTime = time - Lani.previousTime;
        if (deltaTime > 1000) deltaTime = 1000;
        Lani.previousTime = time;
        Lani.animations.forEach(animation => animation.animate(deltaTime));
    }
    requestAnimationFrame(Lani.animate);
}

Lani.animationLoopStarted = false;

Lani.startAnimationLoop = () => {
    if(!Lani.animationLoopStarted){
        requestAnimationFrame(Lani.animate);
        Lani.animationLoopStarted = true;
    }
}

Lani.fillCircle = (ctx, x, y, radius) => {
    if (radius <= 0) return;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
}

Lani.drawLine = (ctx, x1, y1, x2, y2, thickness=null) => {
    if(thickness)
        ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

Lani.rads = degs => degs * Math.PI / 180;
Lani.xOnCircle = (radius, angleDeg) => radius * Math.cos(Lani.rads(angleDeg));
Lani.yOnCircle = (radius, angleDeg) => radius * Math.sin(Lani.rads(angleDeg));

Lani.pointOnCircle = (radius, angleDeg) => {
    return {
        x: Lani.xOnCircle(radius, angleDeg),
        y: Lani.yOnCircle(radius, angleDeg)
    };
}

Lani.circumference = radius => 2 * Math.PI * radius;

Lani.goldenRatio = 1.618;


Lani.Animation = class {
    constructor(canvas) {
        this.canvas = canvas;
        if(this.canvas)
            this.ctx = this.canvas.getContext("2d");
    }
    canvasSize() {
        if (this.canvas.width != this.canvas.offsetWidth ||
            this.canvas.height != this.canvas.offsetHeight) {
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
        }
    }
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    animate(deltaTime) { }
}

Lani.AnimationEntity = class {
    constructor(sizeMultiplier=1.0, speedMultiplier=1.0) {
        this.sizeMultiplier = sizeMultiplier;
        this.speedMultiplier = speedMultiplier;
        this.reset();
    }
    reset(){
        this.size = 1.0;
        this.x = 0.0;
        this.y = 0.0;
        this.velX = 0.0;
        this.velY = 0.0;
        this.rotationDeg = 0;  
        this.birth = performance.now();
    }
    randomize(){
        this.size = ((Math.random() / 2) + .5) * this.sizeMultiplier;
        this.x = Math.random();
        this.y = Math.random();
        this.velX = this.randomVelocity() * Lani.randomSign();
        this.velY = this.randomVelocity() * Lani.randomSign();
    }
    randomVelocity() {
        return (0.0025 + (Math.random() / 250)) * this.speedMultiplier;
    }
}

window.addEventListener("load", Lani.animationLoadHandler);
window.addEventListener("blur", Lani.animationWindowBlurHandler);
window.addEventListener("focus", Lani.animationWindowFocusHandler);
/*

    Lani "Bubbles" animation

*/
Lani.requireModule("lani-animations");

Lani.BubbleAnimation = class extends Lani.Animation {
    constructor(canvas, amount, sizeMultiplier, speedMultiplier) {
        super(canvas);
        if (amount === null) amount = 5;
        if (sizeMultiplier === null) sizeMultiplier = 1.0;
        if (speedMultiplier === null) speedMultiplier = 1.0;
        this.sizeMultiplier = sizeMultiplier;
        this.speedMultiplier = speedMultiplier;
        this.bubbles = [];
        for (let i = 0; i < amount; i++) {
            let entity = new Lani.AnimationEntity(this.sizeMultiplier, this.speedMultiplier);
            entity.randomize();
            this.bubbles.push(entity);
        }
    }
    animate(deltaTime) {
        let width = this.canvas.offsetWidth;
        let height = this.canvas.offsetHeight;
        this.canvasSize();
        let ctx = this.ctx;
        this.clear();
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        this.bubbles.forEach(bubble => {
            // Update position
            if (bubble.x >= 1 && bubble.velX > 0)
                bubble.velX = -bubble.randomVelocity();
            if (bubble.x <= 0 && bubble.velX < 0)
                bubble.velX = bubble.randomVelocity();

            if (bubble.y >= 1 && bubble.velY > 0)
                bubble.velY = -bubble.randomVelocity();
            if (bubble.y <= 0 && bubble.velY < 0)
                bubble.velY = bubble.randomVelocity();

            bubble.x += bubble.velX * (deltaTime / 250);
            bubble.y += bubble.velY * (deltaTime / 250);

            // Draw
            let resolvedX, resolvedY, resolvedSize;
            resolvedSize = 80 * bubble.size;
            resolvedX = width * bubble.x;
            resolvedY = height * bubble.y;
            Lani.fillCircle(ctx, resolvedX, resolvedY, resolvedSize);
        });
    }
}

Lani.BubblesElement = class extends Lani.Element {
    constructor(){
        super();
        this.animation = null;
    }
    async setup(){
        await this.useTemplate(Lani.templatesPath(), "#lani-animation-basic");

        let amount = this.getAttribute("count");
        if (amount && amount != "")
            amount = parseInt(amount);
        else
            amount = null;
        let sizeMultiplier = this.getAttribute("size");
        if (sizeMultiplier && sizeMultiplier != "")
            sizeMultiplier = parseFloat(sizeMultiplier);
        else
            sizeMultiplier = null;
        let speedMultiplier = this.getAttribute("speed");
        if (speedMultiplier && speedMultiplier != "")
            speedMultiplier = parseFloat(speedMultiplier);
        else
            speedMultiplier = null;

        this.animation = new Lani.BubbleAnimation(
            this.shadow.getElementById("screen"),
            amount,
            sizeMultiplier,
            speedMultiplier
        );

        Lani.animations.push(this.animation);

    }
    connectedCallback(){
        this.setup();
    }
}

Lani.regEl("lani-bubbles", Lani.BubblesElement);
/*

    Lani "Dot Grid" animation

*/
Lani.requireModule("lani-animations");

Lani.DotGridAnimation = class extends Lani.Animation {
    constructor(canvas, dotsDensity, dotSize) {
        if (dotsDensity === null) dotsDensity = 25;
        if (dotSize === null) dotSize = 4;
        super(canvas);
        this.location = 0.0;
        this.dotsDensity = dotsDensity;
        this.dotRadius = dotSize;
    }
    animate(deltaTime) {
        let width = this.canvas.width;
        let height = this.canvas.height;
        this.canvasSize();
        this.location += (deltaTime / 250);
        // Draw dots
        let ctx = this.ctx;
        this.clear();
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        let cols = Math.floor(width / this.dotsDensity);
        let rows = Math.floor(height / this.dotsDensity);
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                let sizeBoost = Math.sin((this.location - i) / 3) * 4;
                let dotSize = Math.max(1, sizeBoost + this.dotRadius)
                Lani.fillCircle(ctx, Math.floor((this.dotsDensity / 2) + i * this.dotsDensity),
                    Math.floor((this.dotsDensity / 2) + j * this.dotsDensity), dotSize);
            }
        }
    }
}

Lani.DotGridElement = class extends Lani.Element {
    constructor(){
        super();
        this.animation = null;
    }
    async setup(){
        await this.useTemplate(Lani.templatesPath(), "#lani-animation-basic");

        let dotsDensity = this.getAttribute("density");
        if (dotsDensity && dotsDensity != "")
            dotsDensity = parseInt(dotsDensity);
        else
            dotsDensity = null;
        let dotSize = this.getAttribute("size");
        if (dotSize && dotSize != "")
            dotSize = parseFloat(dotSize);
        else
            dotSize = null;
        

        let animation = new Lani.DotGridAnimation(
            this.shadow.getElementById("screen"),
            dotsDensity,
            dotSize
        );

        Lani.animations.push(animation);

    }
    connectedCallback(){
        this.setup();
    }
}

Lani.regEl("lani-dots", Lani.DotGridElement);
/*

    Lani "tree" animation

    Inspiration:
        https://openprocessing.org/sketch/1279382
        https://openprocessing.org/sketch/1520641
        https://openprocessing.org/sketch/1025683

*/
Lani.requireModule("lani-animations");

Lani.TreeBranch = class extends Lani.AnimationEntity {
    constructor(){
        super();
        this.length = 0.25;
        this.thickness = 1;
        this.children = [];
        this.parent = null;
        this.branchSpread = 25;
        this.branchLengthRatio = 1.5;

        this.angleRandomness = 35;
        this.lengthRandomness = 0.6;
    }
    randomAngleDeviation(){
        return (this.angleRandomness / 2) - (Math.random() * this.angleRandomness);
    }
    randomLengthDeviation(){
        return (this.lengthRandomness / 2) - (Math.random() * this.lengthRandomness);
    }
    generateChildren(depth=10){
        if(depth <= 0)
            return;
        this.thickness = depth;
        let leftBranch = new Lani.TreeBranch();
        let rightBranch = new Lani.TreeBranch();
        leftBranch.rotationDeg = this.rotationDeg - this.branchSpread + this.randomAngleDeviation();
        leftBranch.length = (this.length / (this.branchLengthRatio + this.randomLengthDeviation()));
        rightBranch.rotationDeg = this.rotationDeg + this.branchSpread + this.randomAngleDeviation();
        rightBranch.length = (this.length / (this.branchLengthRatio + this.randomLengthDeviation()));
        this.children.push(leftBranch);
        this.children.push(rightBranch);
        depth--;
        this.children.forEach(child => child.generateChildren(depth));
    }
    render(ctx, x1, y1, vRes){
        let point = Lani.pointOnCircle(vRes * this.length, this.rotationDeg);
        let x2 = x1 + point.x;
        let y2 = y1 + point.y;
        ctx.lineWidth = this.thickness;
        Lani.drawLine(ctx, x1, vRes - y1, x2, vRes - y2);
        this.children.forEach(child => child.render(ctx, x2, y2, vRes));
    }
}

Lani.TreeAnimation = class extends Lani.Animation {
    constructor(canvas) {
        super(canvas);
        this.root = new Lani.TreeBranch();
        this.root.generateChildren();
    }
    animate(deltaTime) {
        let width = this.canvas.offsetWidth;
        let height = this.canvas.offsetHeight;
        this.canvasSize();
        let ctx = this.ctx;
        this.clear();
        ctx.strokeStyle = "rgb(255, 255, 255)";
        this.root.render(ctx, width / 2, 0, height);
    }
}

Lani.TreeElement = class extends Lani.Element {
    constructor(){
        super();
        this.animation = null;
    }
    async setup(){
        await this.useTemplate(Lani.templatesPath(), "#lani-animation-basic");

        this.animation = new Lani.TreeAnimation(
            this.shadow.getElementById("screen")
        );

        Lani.animations.push(this.animation);

    }
    connectedCallback(){
        this.setup();
    }
}

Lani.regEl("lani-tree", Lani.TreeElement);
/*

    Lani SVG rendering module

*/
Lani.requireModule("lani-animations");
Lani.installedModules.push("lani-svg");

Lani.svg = {};

// Returns a path string for canvas-like arc
Lani.svg.arc = (centerX, centerY, radius, startAngle, endAngle) => {
    let arcSweep = 1;
    let startPoint = Lani.pointOnCircle(radius, startAngle);
    let endPoint = Lani.pointOnCircle(radius, endAngle);
    return `M ${centerX + startPoint.x} ${centerY + startPoint.y} ` +
           `A ${radius} ${radius} 0 0 ${arcSweep} ` +
           `${centerX + endPoint.x} ${centerY + endPoint.y}`;
}

// Relative values just have lowercase function letters
Lani.svg.relative = str => str.toLowerCase();

// And the opposite is true for absolute! (though by default everything is abs.)
Lani.svg.absolute = str => str.toUpperCase();

/*

    Declarative way to create and use a data source

*/

Lani.ElementEvents.DataDownloaded = "lani::data-downloaded";
Lani.ElementEvents.DataReady = "lani::data-ready";

// Handlers are just a function with the element passed in as an
// argument. This allows custom code to prepare the element and
// most importantly set the data source, reading information
// and attributes from the element that might be declared. By
// convention (the very same convention I just made up in my head),
// handlers should be lowercase ("download"). However there is
// no mechanism prohibiting you from naming a handler KJGSDUI^*(SDJH)
// so just try to be responsible if you're gonna write one of these
// (which I can see being a common thing since data is ridiculously
// generic) - it's case sensitive.
Lani.DataSourceElementHandlers = {};
Lani.DataSourceElementHandlers["download"] = element => {
    element.dataSource = new Lani.DownloadedDataSource(element.getAttribute("source"));
};

Lani.DataSourceElement = class extends Lani.Element {
    constructor(){
        super();
        this.dataSource = null;
        this.dataReady = false;
        this.slotElement = null;
    }
    connectedCallback(){
        this.setupNonDOM();
        this.slotElement = Lani.c("slot");
        this.shadow.appendChild(this.slotElement);
        this.slotElement.addEventListener("slotchange", e => {
            this.discoverGroups();
        });

        let dataSourceType = this.getAttribute("type");
        if(dataSourceType === null){
            console.warn("No data source type present, assuming \"download\"", this);
            dataSourceType = "download";
        }
        let handler = Lani.DataSourceElementHandlers[dataSourceType];
        if(!handler){
            console.error(`No handler found for data source element (type: ${dataSourceType})`, this);
            return;
        }
        handler(this);
    }
    discoverGroups(){
        this.dataSource.groups = Array.from(this.querySelectorAll("lani-data-group")).map(el => el.groupKey);
    }
    dataReady(){
        this.dataReady = true;
        this.emit(Lani.ElementEvents.DataReady);
    }
    dataDownloaded(){
        this.dataReady();
        this.emit(Lani.ElementEvents.DataReady);
    }
    async get(){
        return await this.dataSource.get();
    }
}

Lani.regEl("lani-data-source", Lani.DataSourceElement);


Lani.DataGroupElement = class extends Lani.Element {
    get groupKey(){
        return this.getAttribute("group") ?? this.getAttribute("group-key") ?? this.innerText;
    }
}

Lani.regEl("lani-data-group", Lani.DataGroupElement);
/*

    Dialog module

*/
Lani.installedModules.push("lani-dialogs");

Lani.currentDialogLayer = null;

Lani.DialogLayer = class extends Lani.Element {
    constructor(){
        super();
        this.dialogs = [];
        this.nextLayer = 1;
        this.focusStack = [];

        this.resizeObserver = new ResizeObserver(() => {
            for(let dialog of this.dialogs){
                dialog.doPosition();
            }
        });
        this.resizeObserver.observe(this);

        this.setup();
    }
    async setup(){
        await this.useTemplate(Lani.templatesPath(), "#lani-dialog-layer");

        this.addEventListener(Lani.ElementEvents.Close, e => {
            if(e.target === this)
                return;
            this.checkEmpty();
        })
    }
    showDialog(dialog){
        this.dialogs.push(dialog);
        this.appendChild(dialog);

        dialog.doPosition();
    }
    removeDialog(dialog){
        this.dialogs = this.dialogs.filter(item => item !== dialog);
        this.checkEmpty();
    }
    checkEmpty(){
        if(this.dialogs.length == 0)
            this.close();
    }
    show(appendTo){
        if(!appendTo)
            appendTo = document.body;
        appendTo.appendChild(this);
        this.emit(Lani.ElementEvents.Show);
    }
    close(){
        if(this.parentNode)
            this.parentNode.removeChild(this);
        this.emit(Lani.ElementEvents.Close);
    }
}

Lani.Dialog = class extends Lani.Element{
    #dialogTitle
    #isMaximized
    #originalDimensions
    #closeEnabled
    constructor(){
        super();
        this.#dialogTitle = null;

        // Alignment
        this.verticalAlignment = Lani.Position.Middle;
        this.horizontalAlignment = Lani.Position.Middle;

        // Movement
        this.movementOffsetLeft = 0;
        this.movementOffsetTop = 0;
        this.allowMovePastBorders = false;

        this.resizeObserver = new ResizeObserver(() => {
            this.doPosition();
        });
        this.resizeObserver.observe(this);

        // Can be read after the dialog closes, if one chooses
        this.returnValue = null;

        // Window interactions
        this.#isMaximized = false;
        this.#originalDimensions = { width: null, height: null};
        this.#closeEnabled = true;

        this.setup();
    }
    async setup(){
        this.linkStyle(Lani.contentRoot + "/dialogs.css");
        await this.useTemplate(Lani.templatesPath(), "#lani-dialog");

        this.shadow.getElementById("close-button").addEventListener("click", () => {
            if(this.#closeEnabled)
                this.close();
        });

        this.shadow.getElementById("maximize-button").addEventListener("click", () => {
            this.toggleMaximize();
        });

        let statusBar = this.shadow.getElementById("status-bar");

        statusBar.addEventListener("mousedown", mouseEvent => {
            // Filter out click, minimize, close, etc. button clicks
            if(mouseEvent.target !== statusBar || this.#isMaximized)
                return;
            
            let distanceFromZeroX = mouseEvent.clientX - this.offsetLeft;
            let distanceFromZeroY = mouseEvent.clientY - this.offsetTop;

            let dragListener = dragEvent => {
                let x = dragEvent.clientX - distanceFromZeroX;
                let y = dragEvent.clientY - distanceFromZeroY;
                this.moveTo(x, y);
            }
            let eventKiller = leaveEvent => {
                window.removeEventListener("mousemove", dragListener);
                window.removeEventListener("mouseup", eventKiller);
            }
            window.addEventListener("mousemove", dragListener);
            window.addEventListener("mouseup", eventKiller);

        });

        this.#resizeHandle("resize-top-left", dragEvent => {
            let x = dragEvent.clientX - this.offsetLeft;
            let y = dragEvent.clientY - this.offsetTop;
            let originalWidth = this.offsetWidth;
            let originalHeight = this.offsetHeight;
            this.resize(this.offsetWidth - x, this.offsetHeight - y);
            this.moveBy(originalWidth - this.offsetWidth, originalHeight - this.offsetHeight);
        });

        this.#resizeHandle("resize-top", dragEvent => {
            let y = dragEvent.clientY - this.offsetTop;
            let originalHeight = this.offsetHeight;
            this.resize(null, this.offsetHeight - y);
            this.moveBy(null, originalHeight - this.offsetHeight);
        });

        this.#resizeHandle("resize-top-right", dragEvent => {
            let x = dragEvent.clientX - this.offsetLeft;
            let y = dragEvent.clientY - this.offsetTop;
            this.resize(x, this.offsetHeight - y);
            this.moveBy(null, y);
        });

        this.#resizeHandle("resize-right", dragEvent => {
            let x = dragEvent.clientX - this.offsetLeft;
            this.resize(x, null);
        });

        this.#resizeHandle("resize-bottom-right", dragEvent => {
            let x = dragEvent.clientX - this.offsetLeft;
            let y = dragEvent.clientY - this.offsetTop;
            this.resize(x, y);
        });

        this.#resizeHandle("resize-bottom", dragEvent => {
            let y = dragEvent.clientY - this.offsetTop;
            this.resize(null, y);
        });

        this.#resizeHandle("resize-bottom-left", dragEvent => {
            let x = dragEvent.clientX - this.offsetLeft;
            let y = dragEvent.clientY - this.offsetTop;
            this.resize(this.offsetWidth - x, y);
            this.moveBy(x, null);
        });

        this.#resizeHandle("resize-left", dragEvent => {
            let x = dragEvent.clientX - this.offsetLeft;
            let originalWidth = this.offsetWidth;
            this.resize(this.offsetWidth - x, null);
            this.moveBy(originalWidth - this.offsetWidth, null);
        });

    }
    #resizeHandle(element, evCallback){
        let el = this.shadow.getElementById(element);
        el.addEventListener("mousedown", mouseEvent => {
            if(this.#isMaximized)
                return;

            let dragListener = e => {
                e.preventDefault();
                e.stopPropagation();
                evCallback(e);
            };
            let eventKiller = leaveEvent => {
                window.removeEventListener("mousemove", dragListener);
                window.removeEventListener("mouseup", eventKiller);
            }
            window.addEventListener("mousemove", dragListener);
            window.addEventListener("mouseup", eventKiller);
        });
    }
    set dialogTitle(title){
        this.#dialogTitle = title;
        this.shadow.getElementById("title").innerHTML = this.#dialogTitle;
    }
    htmlContent(content){
        this.shadow.getElementById("content").innerHTML = content;
    }
    doPosition(){
        if(this.#isMaximized){
            this.style.top = "0px";
            this.style.left = "0px";
        }
        else{
            Lani.positionElement(this,
                this.horizontalAlignment,
                this.verticalAlignment,
                this.movementOffsetLeft,
                this.movementOffsetTop);
        }
    }
    addButton(text, action){
        let button = Lani.create("button", {
            slot: "buttons",
            parent: this.shadow.getElementById("buttons-slot"),
            innerHTML: text
        });
        if(action)
            button.addEventListener("click", action);
        return button;
    }
    addCloseButton(text="Close", isAction=false){
        if(isAction)
            return this.addActionButton(text, () => this.close());
        else
            return this.addButton(text, () => this.close());
    }
    addActionButton(text, action){
        let button = this.addButton(text, action);
        button.className += " l-button-action";
        return button;
    }
    moveTo(x, y){
        
        this.staticPosition();

        if(!this.allowMovePastBorders){
            if(x !== null && x < 0)
                x = 0;
            if(y !== null && y < 0)
                y = 0;
            if(x !== null && x + this.offsetWidth >= this.parentNode.offsetWidth)
                x = Math.max(0, this.parentNode.offsetWidth - this.offsetWidth);
            if(y !== null && y + this.offsetHeight >= this.parentNode.offsetHeight)
                y = Math.max(0, this.parentNode.offsetHeight - this.offsetHeight);
        }

        if(x !== null)
            this.movementOffsetLeft = x;
        if(y !== null)
            this.movementOffsetTop = y;
        this.doPosition();
    }
    moveBy(x, y){

        this.staticPosition();

        if(x !== null)
            this.movementOffsetLeft += x;
        if(y !== null)
            this.movementOffsetTop += y;
        this.doPosition();        
    }
    staticPosition(){
        if(this.horizontalAlignment !== Lani.Position.Absolute){
            this.horizontalAlignment = Lani.Position.Absolute;
            this.movementOffsetLeft = this.offsetLeft;
        }
        if(this.verticalAlignment !== Lani.Position.Absolute){
            this.verticalAlignment = Lani.Position.Absolute;
            this.movementOffsetTop = this.offsetTop;
        }
    }
    resize(width, height){
        if(this.resizeObserver){
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if(width !== null)
            this.style.width = `${width}px`;
        if(height !== null)
            this.style.height = `${height}px`;
    }
    makeSizeFixed(){
        this.style.width = `${this.offsetWidth}px`;
        this.style.height = `${this.offsetHeight}px`;
    }
    toggleMaximize(){
        if(this.#isMaximized){
            this.restore();
        }
        else{
            this.maximize();
        }
    }
    hideResizeHandles(){
        this.shadow.querySelectorAll(".l-dialog-resize-handle").forEach(el => {
            el.style.display = "none";
        });
    }
    showResizeHandles(){
        this.shadow.querySelectorAll(".l-dialog-resize-handle").forEach(el => {
            el.style.display = "block";
        });
    }
    disableMaximize(){
        this.shadow.getElementById("maximize-button").style.display = "none";
    }
    enableMaximize(){
        this.shadow.getElementById("maximize-button").style.display = "block";
    }
    maximize(){
        if(this.#isMaximized)
            return;
        this.#isMaximized = true;
        this.style.borderRadius = "0px";
        this.#isMaximized = true;
        this.#originalDimensions.width = this.style.width;
        this.#originalDimensions.height = this.style.height;
        this.style.width = "100%";
        this.style.height = "100%";
        this.shadow.querySelector("#maximize-button > lani-icon").setIcon("window-restore");
        this.hideResizeHandles();
        this.doPosition();
    }
    restore(){
        if(!this.#isMaximized)
            return;
        this.#isMaximized = false;
        this.style.borderRadius = "var(--lani-rounded)";
        this.style.width = this.#originalDimensions.width;
        this.style.height = this.#originalDimensions.height;
        this.shadow.querySelector("#maximize-button > lani-icon").setIcon("expand");
        this.showResizeHandles();
        this.doPosition();
    }
    enableClose(){
        this.#closeEnabled = true;
        this.shadow.getElementById("close-button").disabled = false;
    }
    disableClose(){
        this.#closeEnabled = false;
        this.shadow.getElementById("close-button").disabled = true;
    }
    close(){
        this.emit(Lani.ElementEvents.Close);
        if(this.parentNode){
            this.parentNode.remove(this);
            if(this.parentNode.tagName == "LANI-DIALOG-LAYER"){
                this.parentNode.removeDialog(this);
            }
        }
    }
}

Lani.showDialog = async dialog => {
    if(Lani.currentDialogLayer === null){
        Lani.currentDialogLayer = await Lani.waitForElement("lani-dialog-layer");
        document.body.appendChild(Lani.currentDialogLayer);
        Lani.currentDialogLayer.addEventListener(Lani.ElementEvents.Close, e => {
            Lani.currentDialogLayer = null;
        })
    }
    Lani.currentDialogLayer.showDialog(dialog);
}

Lani.alert = async (message, title="Webpage Dialog") => {
    let dialog = await Lani.waitForElement("lani-dialog");
    dialog.content = message;
    dialog.dialogTitle = title;
    dialog.style.minWidth = "250px";
    dialog.style.minHeight = "150px";
    dialog.addCloseButton("Ok");
    dialog.htmlContent(`<div><p class="l-no-spacing">${message}</p></div>`);
    await Lani.showDialog(dialog);
}

Lani.showFormInDialog = async (form, title="Webpage Form") => {
    if(typeof form === "string"){
        // Assume this is a selector
    }
    else {
        // Assume this is an HTML element
    }
}

Lani.regEl("lani-dialog-layer", Lani.DialogLayer);
Lani.regEl("lani-dialog", Lani.Dialog);
/*

    Lani Icon module

*/
Lani.installedModules.push("lani-icons");

Lani.IconResolver = class {
    constructor(){ }
    resolve(element, iconName, options={}){ }
}

Lani.FontAwesomeIconResolver = class extends Lani.IconResolver {
    constructor(){
        super();
        this.defaultStyle = "fa-solid";
        this.injectDefaultStyle = true;
    }
    resolve(element, iconName, options={}){
        // This tries to remove all font-awesome classes,
        // but it should be noted that it is not foolproof
        element.className = element.className
                                .split(" ")
                                .filter(item => !item.startsWith("fa-"))
                                .join(" ")
        if(iconName.length == 0){
            // This catches both empty strings and arrays
            return;
        }
        let style = this.defaultStyle;
        if(typeof options.style === "string")
            style = options.style;
        if(this.injectDefaultStyle)
            element.className += this.defaultStyle + " ";
        if(Array.isArray(iconName)){
            element.className += iconName
                                    .map(item => `fa-${item}`)
                                    .join(" ")
        }
        else{
            element.className += `fa-${iconName}`;
        }
    }
}

Lani.iconResolver = new Lani.FontAwesomeIconResolver();

Lani.IconElement = class extends Lani.Element {
    constructor(){
        super(false); // No shadow for this one
    }
    setIcon(iconName){
        if(iconName.indexOf(",") !== -1)
            iconName = iconName.split(",");
        Lani.iconResolver.resolve(this, iconName);
    }
    static get observedAttributes() {
        return ["icon"];
    }
    attributeChangedCallback(name, oldValue, newValue){
        if(name == "icon")
            this.setIcon(newValue);
    }
}

Lani.regEl("lani-icon", Lani.IconElement);
/*

    Paginator element

*/

Lani.PaginatorElement = class extends Lani.Element {
    constructor(){
        super();

        this.setup();
    }
    async setup(){
        await this.useTemplate(Lani.templatesPath(), "#lani-paginator");

        this.ready();
    }

    nextPage(){
        this.emit("lani::next-page");
    }
    lastPage(){
        this.emit("lani::last-page");
    }
    previousPage(){
        this.emit("lani::previous-page");
    }
    firstPage(){
        this.emit("lani::first-page");
    }

}

Lani.regEl("lani-paginator", Lani.PaginatorElement);
/*

    Lani "Arc" data element

*/
Lani.requireModule("lani-svg");

Lani.ArcElement = class extends Lani.DataElement {
    constructor(){
        super();

        this.setup();

        this.svg = null;
        this.background = null;
        this.foreground = null;
    }
    async setup(){
        await this.useDefaultTemplate("lani-arc");

        this.svg = this.shadow.querySelector("svg");
        this.background = this.shadow.getElementById("background");
        this.foreground = this.shadow.getElementById("foreground");

        this.updateValue(50);
    }
    updateValue(percentage){
        let circumference = Lani.circumference(parseFloat(this.background.getAttribute("r")))

        this.background.setAttribute("stroke-dasharray", circumference);
        this.foreground.setAttribute("stroke-dasharray", circumference);

        this.background.style.strokeDashoffset = (circumference / 2) * (1 + (percentage / 100));
        this.background.style.transform = `rotate(${-180 + (180 * (percentage / 100))}deg)`;
        this.foreground.style.strokeDashoffset = (circumference / 2) * (1 + ((100 - percentage) / 100));
    }
}

Lani.regEl("lani-arc", Lani.ArcElement);
Lani.OnOffElement = class extends Lani.Element {
    constructor(){
        super();
        this.state = "on";
        this.onText = "ON";
        this.offText = "OFF";

        this.setup();
    }
    async setup(){
        await this.useDefaultTemplate("lani-on-off");
        this.shadow.getElementById("circle").addEventListener("click", e => {
            this.toggle();
        });

        this.state = this.getAttribute("state") ?? this.state;
        this.onText = this.getAttribute("on-text") ?? this.onText;
        this.offText = this.getAttribute("off-text") ?? this.offText;

        this.displayState();
    }
    toggle(){
        this.state = (this.state == "on" ? "off" : "on");
        this.displayState();
        this.emit(Lani.ElementEvents.StateChange, { state: this.state, element: this });
    }
    displayState(){
        if(this.state == "on"){
            this.shadow.getElementById("ring-outer").style.borderColor = "var(--lani-on-off-state-on)";
            this.shadow.querySelector("div#content p").innerHTML = this.onText;
        }
        else{
            this.shadow.getElementById("ring-outer").style.borderColor = "var(--lani-on-off-state-off)";
            this.shadow.querySelector("div#content p").innerHTML = this.offText;
        }
    }
}

Lani.regEl("lani-on-off", Lani.OnOffElement);
Lani.installedModules.push("lani-calendar");

Lani.CalendarLib = {};

Lani.CalendarColor4 = class {
    constructor(color=null){
        this.all = color;
    }
    set all(value){
        this.top = value;
        this.bottom = value;
        this.left = value;
        this.right = value;
    }
    applyToBorder(element){
        element.style.borderTopColor = Lani.CalendarColor4.toCSS(this.top);
        element.style.borderBottomColor = Lani.CalendarColor4.toCSS(this.bottom);
        element.style.borderLeftColor = Lani.CalendarColor4.toCSS(this.left);
        element.style.borderRightColor = Lani.CalendarColor4.toCSS(this.right);
    }
    static toCSS(colorValue){
        if(colorValue === null)
            return "transparent";
        else
            return colorValue;
    }
}

Lani.CALENDAR_FMT_VERSION = 1;

Lani.CalendarFormatting = class {
    constructor(){
        this.version = Lani.CALENDAR_FMT_VERSION;

        this.backgroundColor = "white";
        this.width = "11in";
        this.height = "8.5in";

        this.outerBorderSize = new Lani.Dimension(0);
        this.outerBorderMargin = new Lani.Dimension(0);
        this.outerBorderPadding = new Lani.Dimension(0);
        this.outerBorderColor = new Lani.CalendarColor4("black");

        this.showTitle = true;
        this.titleBackgroundColor = "#f54242";
        this.titleForegroundColor = "white";
        this.titleSize = 1;
        this.titleFont = new Lani.Font();
        this.titleFont.size = "4rem";
        this.titleBorderSize = new Lani.Dimension();
        this.titleBorderColor = new Lani.CalendarColor4();
        this.titleMargin = new Lani.Dimension(2);

        this.gridBackgroundColor = null;
        this.gridForegroundColor = "black";
        this.gridMargin = new Lani.Dimension(10);
        this.gridSize = 5;
        this.gridOuterBorderSize = new Lani.Dimension(1);
        this.gridInnerBorderSize = 1;
        this.gridOuterBorderColor = new Lani.CalendarColor4("lightgray");
        this.gridInnerBorderColor = "lightgray";

        this.showDaysRow = true;
        this.dayGridBackgroundColor = null;
        this.dayGridForegroundColor = "black";
        this.dayGridFont = new Lani.Font();
        this.dayGridFont.size = "1rem";
        this.dayGridFont.isBold = true;
        this.dayGridInnerBorderColor = null;
        this.dayGridBottomBorderColor = "lightgray";
        this.dayGridBottomBorderSize = 1;

        this.gridCellPadding = new Lani.Dimension(2);
        this.showDayNumbers = true;
        this.showDayNumbersForOtherMonths = true;

    }
}

Lani.CalendarCellFormatting = class {
    constructor(){
        this.version = Lani.CALENDAR_FMT_VERSION;

        this.dayNumberFont = new Lani.Font();
        this.dayNumberFont.size = "1rem";
        this.dayNumberMargin = new Lani.Dimension(3);
        this.dayNumberPadding = new Lani.Dimension(3);
        this.dayNumberForegroundColor = "black";
        this.dayNumberBackgroundColor = null;
        this.dayNumberRounding = new Lani.Corners(3);

    }
}

Lani.CalendarEventFormatting = class {
    constructor(){
        this.version = Lani.CALENDAR_FMT_VERSION;
    }
}

Lani.CalendarEvent = class {
    constructor(){
        this.formatting = new Lani.CalendarEventFormatting();
        this.content = "(new event)";
    }
}

Lani.CalendarDay = class {
    constructor(){
        this.events = [];
        this.formatting = null;
    }
}

Lani.Calendar = class {
    constructor(){
        let date = new Date();
        this.setDate(date.getFullYear(), date.getMonth() + 1);

        this.title = null;
        // free-form object of variables for the calendar
        this.resources = {"subTitle": null};

        this.formatting = new Lani.CalendarFormatting();
        this.defaultCellFormatting = new Lani.CalendarCellFormatting();
        this.defaultWeekendCellFormatting = null;
        this.defaultEventFormatting = new Lani.CalendarEventFormatting();
    }
    createDaysArray(){
        this.days = new Array(Lani.calendarRowsForMonth(this.year, this.month) * 7);
        for(let i = 0; i < this.days.length; i++){
            this.days[i] = new Lani.CalendarDay();
        }
    }
    // The "days" array also (potentially) contains the last few days of the previous
    // month, and the first few days of the next month. This is because a calendar
    // (one that you would hang on you office wall) generally does this, and keeping
    // them in memory like this makes it easy to add events to even days that don't
    // happen this month (this helps in situations where you're doing something 
    // *tomorrow*, but tomorrow is next month)
    getDayOfMonth(day){
        return this.days[day + firstDayOfMonth(this.year, this.month)];
    }
    setDate(year=null, month=null){
        if(year !== null)
            this.year = year;
        if(month !== null)
            this.month = month;
        this.createDaysArray();
    }
}

Lani.CalendarDays = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
]

Lani.CalendarDaysShort = [
    "sun",
    "mon",
    "tues",
    "wed",
    "thurs",
    "fri",
    "sat"
]

Lani.CalendarDaysAbbr = [ "su", "m", "t", "w", "th", "f", "sa" ];

Lani.CalendarMonths = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december"
]

Lani.CalendarMonthsShort = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec"
]

/*

    This one warrants some explanation...

    So this is a combination of a JavaScript hack(?)
    and the fact that Lani uses 1-based months,
    as opposed to JS, which uses 0-based months.

    The generic solution to this issue is to pass in
    the index of the **next** month to the date
    constructor and use 0 as the day:

    https://stackoverflow.com/questions/1184334/get-number-days-in-a-specified-month-using-javascript

    HOWEVER, since Lani uses 1 = January, we can keep
    it as-is

*/
Lani.daysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
}

Lani.firstDayOfMonth = (year, month) => {
    return new Date(year, month - 1).getDay();
}

Lani.calendarRowsForMonth = (year, month, endOfWeekDay=6) => {
    month--;
    let days = Lani.daysInMonth(year, month);
    let rows = 0;
    let i = 0;
    while(i < days){
        i++;
        let thisDate = new Date(year, month, i);
        if(thisDate.getDay() === endOfWeekDay || i == days)
            rows++;
        // Small optimization to skip forwards. We don't care
        // about non-Saturdays. Saves 6 cycles per week.
        if(thisDate.getDay() === endOfWeekDay && (days - i) > 7)
            i += 6;
    }
    return rows;
}

Lani.CalendarElement = class extends Lani.Element {
    constructor(){
        super();
        this.calendar = new Lani.Calendar();
    }
    get formatting(){
        return this.calendar.formatting;
    }
    async connectedCallback(){
        await this.useDefaultTemplate("lani-calendar");

        let title = this.getAttribute("calendar-title");
        if(title)
            this.title = title;

        this.applyFormatting();
    }

    applyFormatting(){
        this.style.background = this.formatting.backgroundColor;
        this.style.width = this.formatting.width;
        this.style.height = this.formatting.height;

        let container = this.shadow.getElementById("container");
        this.formatting.outerBorderMargin.applyToMargin(container);
        this.formatting.outerBorderPadding.applyToPadding(container);
        this.formatting.outerBorderSize.applyToBorder(container);

        let titleContainer = this.shadow.getElementById("title-container");

        if(this.formatting.showTitle === true){
            titleContainer.style.display = "flex";
            titleContainer.style.flex = this.formatting.titleSize;
            titleContainer.style.background = this.formatting.titleBackgroundColor ?? "none";
            this.formatting.titleBorderColor.applyToBorder(titleContainer);
            this.formatting.titleBorderSize.applyToBorder(titleContainer);
    
            let title = this.shadow.getElementById("title");
            title.style.color = this.formatting.titleForegroundColor ?? "transparent";
            this.formatting.titleFont.apply(title);
        }
        else{
            titleContainer.style.display = "none";
        }

        let gridContainer = this.shadow.getElementById("grid-container");
        gridContainer.style.flex = this.formatting.gridSize;
        this.formatting.gridMargin.applyToMargin(gridContainer);
        this.formatting.gridOuterBorderSize.applyToBorder(gridContainer);
        this.formatting.gridOuterBorderColor.applyToBorder(gridContainer);

        let grid = this.populateGrid();

    }

    populateGrid(){
        let table = this.shadow.getElementById("grid");
        table.innerHTML = "";

        let i = 0;
        if(this.formatting.showDaysRow){
            let head = Lani.c("thead", null, table);
            let row = Lani.c("tr", null, head);
            for(let day of Lani.CalendarDays){
                let cell = Lani.c("th", null, row, {innerHTML: Lani.initCap(day)});
                cell.style.background = this.formatting.dayGridBackgroundColor ?? "none";
                cell.style.color = this.formatting.dayGridForegroundColor;
                this.formatting.dayGridFont.apply(cell);
                if(this.formatting.dayGridBottomBorderSize !== null)
                    cell.style.borderBottomWidth = Lani.genericDimension(this.formatting.dayGridBottomBorderSize);
                cell.style.borderBottomColor = this.formatting.dayGridBottomBorderColor ?? "transparent";

                if(i !== 0){
                    cell.style.borderLeftColor = this.formatting.dayGridInnerBorderColor ??
                        this.formatting.gridInnerBorderColor ?? "transparent";
                    cell.style.borderLeftWidth = Lani.genericDimension(this.formatting.gridInnerBorderSize);
                }
                if(i < 6){
                    cell.style.borderRightColor = this.formatting.dayGridInnerBorderColor ??
                        this.formatting.gridInnerBorderColor ?? "transparent";
                    cell.style.borderRightWidth = Lani.genericDimension(this.formatting.gridInnerBorderSize);
                }
                i++;
            }
        }

        let body = Lani.c("tbody", null, table);
        let rows = Lani.calendarRowsForMonth(this.calendar.year, this.calendar.month);
        let firstDayOfMonth = Lani.firstDayOfMonth(this.calendar.year, this.calendar.month);

        let daysInLastMonth = Lani.daysInMonth(this.calendar.year, this.calendar.month - 1);
        let daysInMonth = Lani.daysInMonth(this.calendar.year, this.calendar.month);


        for(let rowInd = 0; rowInd < rows; rowInd++){
            let row = Lani.c("tr", null, body);
            for(let i = 0; i < 7; i++){
                let thisDayOfMonth = (rowInd * 7) + i - (firstDayOfMonth - 1);

                let actualDay = new Date(this.calendar.year, this.calendar.month - 1, thisDayOfMonth);
                let isWeekend = actualDay.getDay() == 0 || actualDay.getDay() == 6;

                let dayFormatting;
                if(isWeekend){
                    dayFormatting = this.calendar.days[i].formatting ??
                        this.calendar.defaultWeekendCellFormatting ??
                        this.calendar.defaultCellFormatting;
                }
                else{
                    dayFormatting = this.calendar.days[i].formatting ?? this.calendar.defaultCellFormatting;
                }

                let cell = Lani.c("td", null, row);
                let dayLabel = null;
                this.formatting.gridCellPadding.applyToPadding(cell);
                if(rowInd === 0) {
                    // The first row
                    if(thisDayOfMonth > 0){
                        if(this.formatting.showDayNumbers)
                            dayLabel = Lani.c("p", "day-label", cell, {innerHTML: thisDayOfMonth});
                    }
                    else{
                        if(this.formatting.showDayNumbers && this.formatting.showDayNumbersForOtherMonths){
                            dayLabel = Lani.c("p", "day-label", cell, {innerHTML: daysInLastMonth + thisDayOfMonth});
                            cell.className += " not-this-month";
                        }
                    }

                    if(i !== 0){
                        cell.style.borderLeftWidth = Lani.genericDimension(this.formatting.gridInnerBorderSize);
                        cell.style.borderLeftColor = this.formatting.gridInnerBorderColor;
                    }
                    // Bottom border
                    cell.style.borderBottomWidth = Lani.genericDimension(this.formatting.gridInnerBorderSize);
                    cell.style.borderBottomColor = this.formatting.gridInnerBorderColor;
                    if(i < 6){
                        cell.style.borderRightWidth = Lani.genericDimension(this.formatting.gridInnerBorderSize);
                        cell.style.borderRightColor = this.formatting.gridInnerBorderColor;
                    }

                }
                else if(rowInd === rows - 1){
                    // The last row
                    if(thisDayOfMonth <= daysInMonth){
                        if(this.formatting.showDayNumbers)
                            dayLabel = Lani.c("p", "day-label", cell, {innerHTML: thisDayOfMonth});
                    }
                    else {
                        if(this.formatting.showDayNumbers && this.formatting.showDayNumbersForOtherMonths){
                            dayLabel = Lani.c("p", "day-label", cell, {innerHTML: thisDayOfMonth - daysInMonth});
                            cell.className += " not-this-month";
                        }
                    }

                    if(i !== 0){
                        cell.style.borderLeftWidth = Lani.genericDimension(this.formatting.gridInnerBorderSize);
                        cell.style.borderLeftColor = this.formatting.gridInnerBorderColor;
                    }
                    if(i < 6){
                        cell.style.borderRightWidth = Lani.genericDimension(this.formatting.gridInnerBorderSize);
                        cell.style.borderRightColor = this.formatting.gridInnerBorderColor;
                    }

                }
                else {
                    // All middle rows
                    if(this.formatting.showDayNumbers)
                        dayLabel = Lani.c("p", "day-label", cell, {innerHTML: thisDayOfMonth});
                    // Left side border
                    if(i !== 0){
                        cell.style.borderLeftWidth = Lani.genericDimension(this.formatting.gridInnerBorderSize);
                        cell.style.borderLeftColor = this.formatting.gridInnerBorderColor;
                    }
                    // Bottom border
                    cell.style.borderBottomWidth = Lani.genericDimension(this.formatting.gridInnerBorderSize);
                    cell.style.borderBottomColor = this.formatting.gridInnerBorderColor;
                    // Right side border
                    if(i < 6){
                        cell.style.borderRightWidth = Lani.genericDimension(this.formatting.gridInnerBorderSize);
                        cell.style.borderRightColor = this.formatting.gridInnerBorderColor;
                    }
                }
                if(dayLabel !== null){

                    dayFormatting.dayNumberFont.apply(dayLabel);
                    dayFormatting.dayNumberMargin.applyToMargin(dayLabel);
                    dayFormatting.dayNumberPadding.applyToPadding(dayLabel);
                    dayFormatting.dayNumberRounding.applyToBorderRadius(dayLabel);
                    dayLabel.style.backgroundColor = dayFormatting.dayNumberBackgroundColor ?? "transparent";
                    dayLabel.style.color = dayFormatting.dayNumberForegroundColor;

                }

            }
        }

        return table;
    }

    set title(value){
        this.calendar.title = value;
        this.shadow.getElementById("title").innerHTML = value;
    }
    get title(){
        return this.calendar.title;
    }
}

Lani.regEl("lani-calendar", Lani.CalendarElement);
/*

    Lani tables module

*/
Lani.installedModules.push("lani-tables");

Lani.TableColumnFormatting = class {
    constructor() {
        this.width = null;
        this.cellCasing = null;
        this.headerCasing = null;
        this.trimData = false;
        this.nullText = null;
        this.headerAlign = null;
        this.style = null;
        this.headerStyle = null;
    }
}

Lani.TableColumnBase = class {
    constructor(name){
        this.formatting = new Lani.TableColumnFormatting();
        this.name = name;
    }
    renderHeader(cell){ }
    render(row, cell){ }
}

Lani.TableFormatter = class {
    format(data, cell) {}
}

Lani.Condition = class {
    isMet() { return true; }
}

Lani.ConditionalTableFormatter = class extends Lani.TableFormatter {
    constructor(){
        super();
        this.condition = null;
    }
    checkCondition(row){
        if(this.condition === null) return true;
        else if(this.condition instanceof Lani.Condition)
            return this.condition.isMet(row);
        else return this.condition(row);
    }
}

Lani.TableColumn = class extends Lani.TableColumnBase {
    constructor(name, sourceName, table=null){
        super(name);
        this.sourceName = sourceName;
        this.formatters = [];
        this.table = table;
    }
    getFormattingProperty(name){
        if(this.table !== null)
            return this.formatting[name] ?? this.table.columnFormatting[name];
        return this.formatting[name];
    }
    renderHeader(cell){
        let headerStyle = this.getFormattingProperty("headerStyle");
        if(headerStyle !== null)
            cell.style.cssText = headerStyle;
        let headerAlign = this.getFormattingProperty("headerAlign");
        if(headerAlign !== null)
            cell.style.textAlign = headerAlign;
        cell.innerHTML = this.name;
    }
    renderColGroup(){
        let col = Lani.c("col");
        if(this.formatting.style !== null) col.style.cssText = this.formatting.style;
        if(this.formatting.width !== null) col.style.width = this.formatting.width;
        return col;
    }
    render(data, cell){
        if(data.isAGroup){
            cell.innerHTML = data.groupValue;
        }
        else{
            cell.innerHTML = data[this.sourceName];
        }
        cell.style.cssText = this.formatting.style;
        for(let formatter of this.formatters)
            if(formatter instanceof Lani.ConditionalTableFormatter){
                if(formatter.checkCondition(data))
                    formatter.format(data, cell);
            }
            else
                formatter.format(data, cell);
    }
}

Lani.TableMarkupColumn = class extends Lani.TableColumn {
    constructor(name, sourceName, table=null){
        super(name, sourceName, table);
        this.template = null;
    }
    connectedCallback(){
        this.shadow.innerHTML = "<slot></slot>";
        this.addEventListener("slotchange", e => {
            this.template = this.querySelector("template");
        });
    }
    renderTemplate(cell){
        if(this.template)
            Lani.useGenericTemplate(this.template, cell, false);
    }
    render(data, cell){
        this.renderTemplate(cell);
    }
}

Lani.TableButtonColumn = class extends Lani.TableColumn {
    constructor(){
        this.template = null;
        this.buttonText = null;
    }
    connectedCallback(){
        this.shadow.innerHTML = "<slot></slot>";
        this.addEventListener("slotchange", e => {
            this.template = this.querySelector("template");
        });
    }
    render(data, cell){
        let button = null;
        if(this.template !== null)
            Lani.useGenericTemplate(this.template, cell, false);
        else{
            button = Lani.c("button", null, this);
            button.innerHTML = this.buttonText ?? this.getAttribute("text") ?? "Click";
        }
        if(button === null)
            button = this.querySelector("button");
    }
}

Lani.tableColumnElementHandlers = {};

Lani.tableColumnElementHandlers["table-column"] = el => {
    return new Lani.TableColumn();
}

Lani.tableColumnElementHandlers["markup"] = el => {
    let col = new Lani.TableMarkupColumn();
    col.template = el.querySelector("template");
    return col;
}

Lani.TableColumnElement = class extends Lani.Element {
    get column(){
        let handler = Lani.tableColumnElementHandlers[this.getAttribute("type") ?? "table-column"]
        let col = handler(this);
        col.name = this.getAttribute("name") ??
            (this.innerText === "" ? null : this.innerText) ??
            (this.innerHTML === "" ? null : this.innerHTML);
        col.sourceName = this.getAttribute("source-name") ?? col.name;
        
        Lani.TableColumnElement.parseFormatting(this, col.formatting);
        
        return col;
    }
    static parseFormatting(element, formattingObject){
        formattingObject.headerAlign = element.getAttribute("header-align");
        formattingObject.width = element.tagName == "LANI-TABLE" ? element.getAttribute("col-width") : element.getAttribute("width");
        formattingObject.style = element.tagName == "LANI-TABLE" ? element.getAttribute("col-style") : element.getAttribute("style");
        formattingObject.headerStyle = element.getAttribute("header-style");
    }
}

Lani.regEl("lani-table-column", Lani.TableColumnElement);
/*

    Default table body renderer

*/
Lani.TableRenderer = class {
    constructor(table){
        this.table = table;
    }
    // Data is a Lani.DataSet
    render(data){
        if(this.table.columns.length === 0)
            return; // What do you want me to do about it??

        let tableEl = Lani.c("table", "l-table");
        if(this.table.renderHeaders){
            let head = this.#renderHeaders();
            tableEl.appendChild(head);
        }
        let colGroup = this.#renderColGroup();
        tableEl.appendChild(colGroup);
        let tbody = this.#renderBody(data);
        tableEl.appendChild(tbody);

        this.table.setBody(tableEl);
    }
    // This function is split up like this to follow good
    // code practices, not necessarily because this is
    // the base class and all TableRenderers should have
    // renderHeaders and renderBody functions (UNLIKE columns)
    #renderHeaders(){
        // I know Lani.c isn't readable but it's just so short
        // and using it really takes the edge off dynamically
        // creating lines and lines of HTML elements. Sorry.

        // Lani.c =~ Lani.create
        let head = Lani.c("thead");
        let headRow = Lani.c("tr", null, head);
        for(let column of this.table.columns){
            let cell = Lani.c("th", null, headRow);
            column.renderHeader(cell);
        }
        return head;
    }
    // Not an actual group function - renders the HTML element
    // <colgroup> to define width and other things
    #renderColGroup(){
        let cg = Lani.c("colgroup");
        for(let column of this.table.columns){
            cg.appendChild(column.renderColGroup());
        }
        return cg;
    }
    // See note on renderHeaders
    #renderBody(data){
        if(data.isGrouped)
            return this.#renderGroupedBody(data);
        
        let tbody = Lani.c("tbody");
        for(let dataRow of data.rows){
            let row = Lani.c("tr");
            for(let column of this.table.columns){
                let cell = Lani.c("td");
                column.render(dataRow.data, cell);
                row.appendChild(cell);
            }
            tbody.appendChild(row);
        }
        return tbody;
    }
    // This is more complex than just rendering the body so
    // it has been organized out into this alternative method
    // This takes advantage of the rowspan attribute
    // of a <td>. Basically, if a <td> has a rowspan of 2 or
    // more, that <td> is automatically "filled in" in the
    // next <tr>. This function will likely need to be recursive
    #renderGroupedBody(data){
        let tbody = Lani.c("tbody");
        try{
            this.table.validateColumnOrder();
            for(let group of data.rows){
                this.#renderGroupedPartial(tbody, 0, group);
            }
        }
        catch(ex){
            console.error(ex);
        }
        return tbody;
    }
    #renderGroupedPartial(body, columnIndex, data, rowToContinue=null){
        if(data.isAGroup){
            // Create cell, give it rowspan, recurse with rowToContinue
            let row = rowToContinue ?? Lani.c("tr", null, body);
            let cell = Lani.c("td", null, row);
            cell.rowSpan = data.count;
            let column = this.table.columns[columnIndex];
            column.render(data, cell);
            let continueRow = true;
            for(let group of data.rows){
                this.#renderGroupedPartial(body, columnIndex + 1, group, continueRow ? row : null);
                continueRow = false;
            }
        }
        else if(data.isGrouped){
            for(let group of data.rows){
                this.#renderGroupedPartial(body, columnIndex, group, rowToContinue)
            }
        }
        else{
            let row = rowToContinue ?? Lani.c("tr", null, body);
            // Render out all the remaining rows
            for(let i = columnIndex; i < this.table.columns.length; i++){
                let column = this.table.columns[i];
                let cell = Lani.c("td", null, row);
                column.render(data.data, cell)
            }
        }
    }
}
Lani.TableTemplates = {};
Lani.TableTemplates.Loading = `<style>

</style>
<div id="loading-container">
    <h2 id="loading-text">Loading your table...</h2>
    <p id="loading-subtext">Hang tight</p>
    <lani-icon id="loading-icon" icon="table"></lani-icon>
</div>
`;

Lani.TableTemplates.NoDataFound = `<p>No Data Found</p>`;
Lani.ElementEvents.TableColumnAdded = "lani::table-column-added";

Lani.TableElement = class extends Lani.DataElement {
    #title
    constructor(){
        super();

        // Formatting
        this.renderHeaders = true;
        this.renderer = new Lani.TableRenderer(this);
        this.dataSource = null;

        // Data discovery options
        this.autoParseColumns = true;

        // Columns
        this.columns = [];
        this.columnFormatting = new Lani.TableColumnFormatting();
        this.ignoreColumns = [];
        this.columnNamePrettifier = new Lani.DataNamePrettifier();

        // Templates
        this.loadingTemplate = Lani.TableTemplates.Loading;
        this.noDataFoundTemplate = Lani.TableTemplates.NoDataFound;

        this.setup();
    }
    async setup(){
        await this.useTemplate(Lani.templatesPath(), "#lani-table", false);
        this.linkStyle(Lani.contentRoot + "/tables.css");

        // TODO: this only works because the async this.useTemplate is taking
        // long enough for the child nodes to populate(?) -- CHANGE
        Lani.TableColumnElement.parseFormatting(this, this.columnFormatting);
        this.doDiscovery();
        this.renderTable();

        if(!this.getBoolAttribute("show-header", true))
            this.hideHeader();
        if(!this.getBoolAttribute("show-search", true))
            this.hideSearch();

        this.ready();
    }

    showHeader(){
        this.shadow.getElementById("header").style.display = "flex";
    }
    hideHeader(){
        this.shadow.getElementById("header").style.display = "none";
    }
    showSearch(){
        this.shadow.getElementById("search-container").style.display = "flex";
    }
    hideSearch(){
        this.shadow.getElementById("search-container").style.display = "none";
    }

    // Title items 
    get title(){
        return this.#title;
    }
    set title(title){
        this.#title = title;
        Lani.useGenericTemplate(this.#title, this.shadow.getElementById("title"), false);
    }

    async renderTable(){
        if(this.renderer === null || this.dataSource === null)
            return;
        let data = await this.dataSource.get();
        // If no columns have been specified, we can try to parse them
        // unless the developer doesn't want this for some reason
        if(this.autoParseColumns && this.columns.length === 0)
            this.parseColumns(data);
        this.renderer.render(data);
    }
    setBody(newBody){
        let body = this.shadow.getElementById("body")
        Lani.useGenericTemplate(newBody, body, false);
    }

    showLoading(){
        this.setBody(this.loadingTemplate);
    }
    showNoDataFound(){

    }

    // Discovery
    doDiscovery(){
        this.discoverTitle();
        this.discoverColumns();
        this.discoverDataSource();
    }
    discoverColumns(){
        let columns = Array.from(this.querySelectorAll("lani-table-column"));
        if(columns.length === 0)
            return;
        for(let column of columns.map(col => col.column)){
            this.addColumn(column);
        }
    }
    discoverDataSource(){
        let source = this.querySelector("lani-data-source");
        if(!source)
            return;
        this.dataSource = source.dataSource;
    }
    discoverTitle(){
        let discoveredTitle = null;
        let template = this.querySelector("template[slot='title']");
        if(template){
            discoveredTitle = template;
        }
        return this.title = discoveredTitle;
    }

    addColumn(column){
        this.columns.push(column);
        column.table = this;
        this.emit(Lani.ElementEvents.TableColumnAdded, {column});
    }
    parseColumns(data){
        this.columns = [];
        for(let row of data.rows){
            for(let key of Object.keys(row.data)){
                if(this.ignoreColumns.includes(key))
                    continue;
                if(!this.columns.some(column => column.sourceName === key))
                    this.addColumn(new Lani.TableColumn(
                        this.columnNamePrettifier.prettify(key), key));
            }
        }
        return this.columns;
    }
    // If any columns are grouped, they:
    //      a) Must be the first columns in the table
    //      b) Must be in the order of grouping
    validateColumnOrder(){
        if(this.dataSource.groups.length > this.columns.length)
            throw "More groups than columns";
        for(let i = 0; i < this.dataSource.groups.length; i++){
            if(this.dataSource.groups[i] != this.columns[i].sourceName)
                throw `Grouped column in wrong order: ${this.columns[i].name} (${this.columns[i].sourceName})`;
        }
    }
};

Lani.regEl("lani-table", Lani.TableElement);
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