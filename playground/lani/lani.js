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
    if(options.parentElement)
        options.parentElement.appendChild(el);
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
    styles(styleLinkArray){
        styleLinkArray.forEach(link => {
            Lani.create("link", {
                parentElement: this.shadow,
                attrs: {
                    href: link,
                    rel: "stylesheet",
                    type: "text/css"
                }
            });
        });
    }
    style(styleLink){
        this.styles([styleLink]);
    }
    importLaniLibs(){
        // Lani CSS is only available to shadow-enabled elements
        if(!this.usesShadow)
            return;
        this.styles([
            Lani.contentRoot + "/lani.css"
        ]);
        this.styles(Lani.shadowLinks);
    }
    useDOMTemplate(id){
        let template = document.getElementById(id);
        this.shadow.appendChild(template.content.cloneNode(true));
    }
    async useTemplate(src, querySelector){
        let template = await Lani.loadTemplate(src, querySelector);
        this.shadow.appendChild(template.content.cloneNode(true));
    }
    ready(detail){
        this.dispatchEvent(new CustomEvent("lani-ready", { detail } ));
    }
}

Lani.regEl = (elementName, element, options) => {
    customElements.define(elementName, element, options);
}

Lani.Direction = {
    Left: 0,
    Right: 1
};
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

    Dialog module

*/
Lani.installedModules.push("lani-dialogs");

Lani.dialogLayer = null;
Lani.dialogOpen = false;
Lani.dialog = null;

Lani.DialogState = {
    Windowed: 0,
    Fullscreen: 1,
    Maximized: 2,
    Minimized: 3
}

Lani.showDialog = dialog => {
    let layer;
    if (Lani.dialogLayer === null) layer = Lani.showDialogLayer();
    else layer = Lani.dialogLayer;
}
Lani.showDialogLayer = () => {
    let layer = document.createElement("div");
    layer.className = "l-dialog-shader";
    document.body.appendChild(layer);
    return layer;
}
Lani.destroyDialogLayer = () => {
    document.querySelectorAll(".l-dialog-shader").forEach(item => item.remove());
    Lani.dialogLayer = null;
    Lani.dialogOpen = false;
}
Lani.alert = (text, title="") => {
    let dialog = new LaniDialog();
    dialog.title = title;
    let label = document.createElement("p");
    label.innerHTML = text;
    dialog.content.appendChild(label);
    Lani.showDialog(dialog);
}

Lani.Dialog = class {
    constructor() {
        // Options
        this.allowResize = true;
        this.showCloseButton = true;
        this.showMaximizeButton = true;
        this.showMinimizeButton = false;
        this.allowMaximize = true;
        this.allowDrag = true;
        this.closeOnClickAway = true;
        this.startMaximized = false;
        this.startFullscreen = false;
        this.startMinimized = false;
        this.showTitle = true;

        // State items
        this.size = {
            width: null,
            height: null
        }
        this.position = {
            x: null,
            y: null
        }
        this.title = null;
        this.state = null;

        // Outer-ish elements
        this.shader = null;
        this.container = null;
        this.resizeElements = {
            topLeft: null,
            top: null,
            topRight: null,
            right: null,
            bottomRight: null,
            bottom: null,
            bottomLeft: null,
            left: null
        };

        // Contained elements
        this.closeButton = null;
        this.maximizeButton = null;
        this.minimizeButton = null;
        this.titleElement = null;
        this.content = null;
    }
    stationary(){
        this.allowResize = false;
        this.allowDrag = false;
        this.allowMaximize = false;
    }
    dontAllowClose(){
        this.allowClose = false;
        this.closeOnClickAway = false;
    }
    createResizeElements(){

    }
    removeResizeElements(){

    }
    createButtons(){
        this.closeButton = document.createElement("button");
        this.maximizeButton = document.createElement("button");
        this.minimizeButton = document.createElement("button");
    }
    showCloseButton(){
        if(this.closeButton)
            this.closeButton.style.display = "inline-flex";
    }
    showMaxmimizeButton(){
        if(this.maximizeButton)
            this.maximizeButton.style.display = "inline-flex";
    }
    showMinimizeButton(){
        if(this.minimizeButton)
            this.minimizeButton.style.display = "inline-flex";
    }
    hideCloseButton(){
        if(this.closeButton)
            this.closeButton.style.display = "none";
    }
    hideMaxmimizeButton(){
        if(this.maximizeButton)
            this.maximizeButton.style.display = "none";
    }
    hideMinimizeButton(){
        if(this.minimizeButton)
            this.minimizeButton.style.display = "none";
    }
    showTitle(){
        if(this.title)
            this.title.style.display = "inline-flex";
    }
    hideTitle(){
        if(this.title)
            this.title.style.display = "none";
    }
    moveTo(x, y){

    }
    resize(width, height){

    }
    /**
     * Used to display the dialog for the first time
     */
    show(){

    }
    restore(){

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
                                .map(item => item.startsWith("fa-") ? "" : item)
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
}

Lani.regEl("lani-paginator", Lani.PaginatorElement);
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

    Lani tables module

*/
Lani.installedModules.push("lani-tables");

Lani.tables = [];
Lani.getTable = id => {
    for(let i = 0; i < Lani.tables.length; i++)
        if(Lani.tables[i].id == id)
            return Lani.tables[i];
}

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

Lani.Table = class {
    // Title needs to be private so we can employ
    // a setter function (so we can also update the DOM)
    // transparently to the user
    #title
    constructor() {

        // General options
        this.#title = null;
        this.showTitle = true;
        this.showHeaders = true;
        this.id = null;
        this.hasStickyHeaders = false;
        this.stickyHeadersBelow = null;
        this.stickyTopOffset = 0;
        this.showFilterButton = true;
        this.showSortButton = true;

        // Search
        this.showSearch = true;
        this.searchQuery = null;
        this.searchColumns = null;
        this.regexSearch = false;
        this.matchCaseSearch = false;
        this.updateSearchWhileTyping = true;
        this.showAdvancedSearchOptions = false;
        this.updateSearchWhileTypingTreshold = 100;

        // Data fetching
        /*this.dataMode = Lani.TableDataMode.Static;
        this.dataSource = null;
        this.fetchOptions = null;*/

        // Nesting
        this.parentTable = null;
        this.parentTableIndent = 10;

        // Column rules
        this.columns = null;
        this.dontRender = [];

        // Data
        this.sourceData = null;
        this.data = null;
        this.filters = [];
        this.sorts = [];
        this.noDataFoundMessage = "<div class='l-table-ndf-parent'>" +
            "<i class='fa-solid fa-glasses l-subtle-icon'></i>" +
            "<div><h2>No Results</h2>" + 
            "<p>Try changing your search or filters</p></div></div>"

        // DOM
        /*this.parent = null;
        this.container = null;
        this.controlsContainerElement = null;
        this.searchInputElement = null;
        this.titleElement = null;
        this.tableContainer = null;
        this.tableElement = null;
        this.tableHeaderElement = null;
        this.tableBodyElement = null;
        this.paginationContainer = null;*/
        this.DOMHost = null;

        // Formatting
        this.defaultRowHeight = null;
        this.defaultColumnWidth = null;
        this.columnFormatting = new Lani.TableColumnFormatting();
        this.conditionalFormattingRules = [];

        // Events
        /*this.onRefresh = null;
        this.onPageChange = null;
        this.onRowClick = null;
        this.onCellClick = null;
        this.onUpdate = null;
        this.onDisplayChange = null;*/

    }

    // Private methods
    #shouldRenderTitle(){
        return !(!this.showTitle || !this.title || this.title.length === 0);
    }
    #shouldRenderPagination(){
        return this.paginationCustomizedByUser || 
            (this.paginationOptions.enabled && (this.paginationOptions.alwaysShow || 
                (this.data.length > this.paginationOptions.rowsPerPage)));
    }

    // DOM interactions & settings
    set title(title){
        this.#title = title;
        this.DOMHost.getElementById("title").innerHTML = title;
    }

    get title(){
        return this.#title;
    }

}
Lani.TableElement = class extends Lani.Element {
    constructor(){
        super();
        this.table = null;
        this.setup();
    }
    async setup(){
        await this.useTemplate(Lani.templatesPath(), "#lani-table-core");

        this.table = new Lani.Table();

        this.table.DOMHost = this.shadow;

        this.table.id = this.id;
        if(this.id){
            Lani.tables.push(table);
        }
        let title = this.getAttribute("table-title");
        if(title)
            this.table.title = title;
    }
    // declare the watched attributes
    static get observedAttributes() {
        return ["table-title"];
    }
    attributeChangedCallback(name, oldValue, newValue){
        // Table has not loaded yet
        if(!this.table)
            return;
        if(name == "table-title")
            this.table.title = newValue;
    }
};

Lani.regEl("lani-table", Lani.TableElement);
