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
Lani.c = (elementName, className, parentElement, options) => {
    options = options || {};
    options.className = className;
    options.parentElement = parentElement;
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
    Show: "lani::show"
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
        this.dispatchEvent(new CustomEvent(eventName, detail));
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
        super();
        this.source = source;
        this.fetchOptions = {};
        this.data = null;
    }
    async get(){
        if(this.data === null)
            await this.download();
        return this.data;
    }
    async download(){
        if(this.source === null)
            throw "Tried to download from a null source";
        return this.data = Lani.DataSet.from(
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
/*

    Declarative way to create and use a data source

*/

Lani.ElementEvents.DataDownloaded = "lani::data-downloaded";
Lani.ElementEvents.DataReady = "lani::data-ready";

// TODO: make extensible with handlers
Lani.DataSourceElement = class extends Lani.Element {
    constructor(){
        super();
        this.dataSource = null;
        this.dataReady = false;
    }
    connectedCallback(){
        this.setupNonDOM();

        let download = this.getAttribute("download");
        if(download !== null){
            this.downloadDataSource(download);
        }
        // Pickup fetched data sources, local data sources, etc here.
    }
    // TODO: this is poor
    async downloadDataSource(path){
        this.dataSource = new Lani.DownloadedDataSource(path);
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
            this.resize(this.offsetWidth - x, this.offsetHeight - y);
            this.moveBy(x, y);
        });

        this.#resizeHandle("resize-top", dragEvent => {
            let y = dragEvent.clientY - this.offsetTop;
            this.resize(null, this.offsetHeight - y);
            this.moveBy(null, y);
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
            this.resize(this.offsetWidth - x, null);
            this.moveBy(x, null);
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
    dialog.htmlContent(`<div class="l-alert-content"><p class="l-no-spacing">${message}</p></div>`);
    await Lani.showDialog(dialog);
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
/*

    Lani tables module

*/
Lani.installedModules.push("lani-tables");

Lani.TableColumnFormatting = class {
    constructor() {
        this.width = null;
        this.caseMutation = null;
        this.titleCaseMutation = null;
        this.trimData = false;
        this.textTransform = null;
        this.nullText = null;
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

Lani.TableColumn = class extends Lani.TableColumnBase {
    constructor(name, sourceName){
        super(name);
        this.sourceName = sourceName;
    }
    renderHeader(cell){
        cell.innerHTML = this.name;
    }
    render(row, cell){
        cell.innerHTML = row[this.sourceName];
    }
}

Lani.TableColumnElement = class extends Lani.Element {
    get column(){
        // TODO: populate the members of the column
        let col = new Lani.TableColumn();
        col.name = this.getAttribute("name");
        col.sourceName = this.getAttribute("source-name") ??
                            (this.innerText === "" ? null : this.innerText);
        return col;
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

        let tableEl = Lani.c("table");
        if(this.table.renderHeaders){
            let head = this.renderHeaders();
            tableEl.appendChild(head);
        }
        let tbody = this.renderBody(data);
        tableEl.appendChild(tbody);

        this.table.setBody(tableEl);
    }
    // This function is split up like this to follow good
    // code practices, not necessarily because this is
    // the base class and all TableRenderers should have
    // renderHeaders and renderBody functions (UNLIKE columns)
    renderHeaders(){
        // I know Lani.c isn't readable but it's just so short
        // and using it really takes the edge off dynamically
        // creating lines and lines of HTML elements. Sorry.

        // Lani.c =~ Lani.create
        let head = Lani.c("thead");
        let headRow = Lani.c("tr");
        head.appendChild(headRow);
        for(let column of this.table.columns){
            let cell = Lani.c("th");
            column.renderHeader(cell);
            headRow.appendChild(cell);
        }
        return head;
    }
    // See note on renderHeaders
    renderBody(data){
        let tbody = Lani.create("tbody");
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

Lani.TableTemplates.NoDataFound = `<p>No Data Found</p>`

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

        this.doDiscovery();
        this.renderTable();

        this.ready();
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
        this.columns = columns.map(col => col.column);
    }
    discoverDataSource(){
        let source = this.querySelector("lani-data-source");
        if(!source)
            return;
        this.dataSource = source.dataSource;
    }
    discoverTitle(){
        let discoveredTitle = null;
        let template = this.querySelector("template#title");
        if(template){
            discoveredTitle = template;
        }
        return this.title = discoveredTitle;
    }


    parseColumns(data){
        this.columns = [];
        for(let row of data.rows){
            for(let key of Object.keys(row.data)){
                if(this.ignoreColumns.includes(key))
                    continue;
                if(!this.columns.some(column => column.sourceName === key))
                    this.columns.push(new Lani.TableColumn(
                        this.columnNamePrettifier.prettify(key), key));
            }
        }
        return this.columns;
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