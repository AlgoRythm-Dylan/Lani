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
Lani.create = (elementName, options) => {
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
    getBoolAttr(attrName){
        let attr = this.getAttribute(attrName);
        return attr && attr.toLowerCase() === "true";
    }
    emit(eventName, detail={}){
        this.dispatchEvent(new CustomEvent(eventName, detail));
    }
    ready(detail={}){
        this.emit(Lani.ElementEvents.Ready, detail);
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

Lani.rads = degs => degs * (Math.PI / 180);
Lani.xOnCircle = (radius, angleDeg) => radius * Math.sin(Lani.rads(angleDeg));
Lani.yOnCircle = (radius, angleDeg) => radius * Math.cos(Lani.rads(angleDeg));

Lani.pointOnCircle = (radius, angleDeg) => {
    return {
        x: Lani.xOnCircle(radius, angleDeg),
        y: Lani.yOnCircle(radius, angleDeg)
    };
}

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
    return `M${centerX - (radius / 2)},${centerY - (radius / 2)}`
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
        this.arc = null;
    }
    async setup(){
        await this.useDefaultTemplate("lani-arc");

        this.svg = this.shadow.querySelector("svg");
        this.displayArc = Lani.create("arc", { parent: svg } );
        this.progressArc = Lani.create("arc", { parent: svg } );
    }
    updateValue(percentage){

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
    render(row, cell){ }
}

Lani.TableColumn = class extends Lani.TableColumnBase {
    constructor(name, sourceName){
        super(name);
        this.sourceName = sourceName;
    }
    render(row, cell){
        cell.innerHTML = row[this.sourceName];
    }
}
/*

    Default table body renderer

*/
Lani.TableBodyRenderer = class {
    constructor(table){
        this.table = table;
    }
    render(data){
        let body = Lani.create("tbody");
        for(let item of data){
            let row = Lani.create("tr", { parent: body });
            for(let column of this.table.columns){
                let cell = Lani.create("td", { parent: row });
                column.render(item, cell);
            }
        }
        return body;
    }
    measureColumns(body){

    }
}
Lani.TableElement = class extends Lani.DataElement {
    #title
    constructor(){
        super();

        // Formatting
        this.renderHeaders = true;
        this.bodyRenderer = new Lani.TableBodyRenderer(this);
        this.dataSource = null;
        this.dataManager = new Lani.DataManager();

        this.setup();
    }
    async setup(){
        await this.useTemplate(Lani.templatesPath(), "#lani-table", false);
        this.linkStyle(Lani.contentRoot + "/tables.css");

        let title = this.getAttribute("table-title");
        if(title)
            this.title = title;

        let download = this.getAttribute("download-data");
        if(download){
            this.downloadData(download);
        }

        this.ready();
    }

    // Title items 
    get title(){
        return this.#title;
    }
    set title(title){
        this.#title = title;
        this.shadow.getElementById("title").innerHTML = title;
    }

    // Table headers
    #renderHeaders(){
        if(!this.renderHeaders)
            return;
    }

    // Table body
    #renderBody(){
        let body = this.bodyRenderer.render(this.dataManager.getAll());
    }

    // Data ops
    // Download data. For now, expects JSON
    async downloadData(source){
        let data = await (await fetch(source)).json();
        this.setDataSource(Lani.DataSource(data));
    }
    setDataSource(dataSource){
        this.dataSource = dataSource;
        this.dataManager.dataSource = this.dataSource;
    }
};

Lani.regEl("lani-table", Lani.TableElement);
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
/*

    Kinda a dev tool, ish

    to play around with SVG

*/

const L_DEFAULT_SVG = `<!-- Reference: https://developer.mozilla.org/en-US/docs/Web/SVG/Element -->

<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
     <circle cx="50" cy="50" r="5" fill="red" />
</svg>`;

Lani.SVGWriterElement = class extends Lani.Element {
    constructor(){
        super();

        this.writer = null;
        this.output = null;

        this.setup();
    }
    async setup(){
        await this.useDefaultTemplate("lani-svg-writer");

        this.writer = this.shadow.getElementById("writer");
        this.output = this.shadow.getElementById("output-container");

        this.writer.addEventListener("keydown", e => {
            if(e.key === "Enter" && e.ctrlKey){
                e.preventDefault();
                this.render();
            }
        });

        this.writer.value = L_DEFAULT_SVG;
        this.render();
    }
    render(){
        this.output.innerHTML = this.writer.value;
    }
}

Lani.regEl("lani-svg-writer", Lani.SVGWriterElement);