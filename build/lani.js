/*

    Core

*/
Lani = {};
LaniVersions = window.LaniVersions || {};
Lani.version = "1.0.0";
LaniVersions[Lani.version] = Lani;
Lani.installedModules = [];
Lani.contentRoot = "/lani";

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
    constructor(shadowMode = 'closed'){
        super();
        this.shadow = this.attachShadow({mode: shadowMode});
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
        this.styles([
            Lani.contentRoot + "/lani.css"
        ]);
    }
    useDOMTemplate(id){
        let template = document.getElementById(id);
        this.shadow.appendChild(template.content.cloneNode(true));
    }
    async useTemplate(src, querySelector){
        let template = await Lani.loadTemplate(src, querySelector);
        this.shadow.appendChild(template.content.cloneNode(true));
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

    Caching module

*/
Lani.installedModules.push("lani-caching");

Lani.CachedFetchMode = {
    Memory: "memory",
    LocalStorage: "localstorage"
};

Lani.defaultCachedFetchOptions = {
    mode: Lani.CachedFetchMode.Memory,
}

Lani.CachedFetch = class {
    constructor(url, fetchOptions, cacheOptions){
        this.url = url;
        this.fetchOptions = fetchOptions;
        this.cacheOptions = cacheOptions;
        this.timestamp = new Date().getTime();
    }
}

Lani.cachedFetch = async (url, fetchOptions, cacheOptions) => {

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
        await this.useTemplate(Lani.contentRoot + "/templates.html", "#lani-animation-basic");

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
        await this.useTemplate(Lani.contentRoot + "/templates.html", "#lani-animation-basic");

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

    Lani "Bubbles" animation

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
        await this.useTemplate(Lani.contentRoot + "/templates.html", "#lani-animation-basic");

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

Lani.TableElement = class extends Lani.Element {
    constructor(){
        super();
        this.table = new Lani.Table();
        this.table.id = this.id;
        if(this.id){
            Lani.tables.push(table);
        }
        let title = this.getAttribute("table-title");
        if(title)
            this.table.setTitle(title);
    }
};
/*

    Lani tables module

*/
Lani.installedModules.push("lani-tables");

Lani.tables = [];
Lani.tableLoadHandler = e => {
    document.querySelectorAll(".l-table-parent").forEach(el => {
        let table = new Lani.Table();
        table.id = el.id;
        if(el.id){
            Lani.tables.push(table);
        }
        Lani.attributeMap(el, table, {
            "title": "title"
        })
        table.appendTo(el);
    });
}
Lani.getTable = id => {
    for(let i = 0; i < Lani.tables.length; i++)
        if(Lani.tables[i].id == id)
            return Lani.tables[i];
}

Lani.TableDataMode = {
    Static: 0,
    Fetch: 1
};

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

Lani.TablePaginationOptions = class {
    constructor() {
        this.enabled = true;
        this.rowsPerPage = 10;
        this.showBackNext = true;
        this.alwaysShow = false;
    }
}

Lani.Table = class {
    constructor() {

        // General options
        this.title = null;
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
        this.dataMode = Lani.TableDataMode.Static;
        this.dataSource = null;
        this.fetchOptions = null;

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
        this.parent = null;
        this.container = null;
        this.controlsContainerElement = null;
        this.searchInputElement = null;
        this.titleElement = null;
        this.tableContainer = null;
        this.tableElement = null;
        this.tableHeaderElement = null;
        this.tableBodyElement = null;
        this.paginationContainer = null;

        // Formatting
        this.defaultRowHeight = null;
        this.defaultColumnWidth = null;
        this.columnFormatting = new Lani.TableColumnFormatting();
        this.conditionalFormattingRules = [];

        // Pagination
        this.paginationOptions = new Lani.TablePaginationOptions();
        this.page = 1;
        this.paginationCustomizedByUser = false;

        // Events
        this.onRefresh = null;
        this.onPageChange = null;
        this.onRowClick = null;
        this.onCellClick = null;
        this.onUpdate = null;
        this.onDisplayChange = null;

    }
    clear() {
        if (!this.container) return;
        this.container.remove();

        this.container = null;
    }
    #shouldRenderTitle(){
        return !(!this.showTitle || !this.title || this.title.length === 0);
    }
    #shouldRenderPagination(){
        return this.paginationCustomizedByUser || 
            (this.paginationOptions.enabled && (this.paginationOptions.alwaysShow || 
                (this.data.length > this.paginationOptions.rowsPerPage)));
    }
    generate() {
        if (!this.columns) return;
        this.clear();

        this.container = document.createElement("div");
        this.container.className = "l-table-container l-light-shadow";

        if(this.parent)
            this.parent.appendChild(this.container);

        this.controlsContainerElement = document.createElement("div");
        this.controlsContainerElement.className = "l-table-controls-container";
        this.container.appendChild(this.controlsContainerElement);

        this.titleElement = document.createElement("p");
        this.titleElement.className = "l-table-title";
        if (!this.#shouldRenderTitle()) {
            this.titleElement.style.display = "none";
        }
        else {
            this.titleElement.innerHTML = this.title;
        }
        this.controlsContainerElement.appendChild(this.titleElement);

        this.searchInputElement = document.createElement("input");
        this.searchInputElement.className = "l-table-search-input";
        this.searchInputElement.placeholder = "Search...";
        this.controlsContainerElement.appendChild(this.searchInputElement);
        this.searchInputElement.addEventListener("input", e => {
            let tooManyRows = this.updateSearchWhileTypingTreshold !== null &&
                this.sourceData.length > this.updateSearchWhileTypingTreshold;
            if(this.updateSearchWhileTyping && !tooManyRows)
                this.search();
        });
        this.searchInputElement.addEventListener("keydown", e => {
            if(e.keyCode === 13)
                this.search();
        });

        this.tableContainer = document.createElement("div");
        this.tableContainer.className = "l-table-element-container";
        this.container.appendChild(this.tableContainer);

        this.paginationContainer = document.createElement("div");
        this.paginationContainer.className = "l-pagination-container";
        if(this.#shouldRenderPagination()){
            this.container.appendChild(this.paginationContainer);
            this.createPaginationControls();
        }

        this.generateTable();
    }
    pages(){
        if(this.paginationOptions.rowsPerPage === null)
            return 1;
        return Math.max(1, Math.ceil(this.data.length / this.paginationOptions.rowsPerPage));
    }
    goToPage(pageNum){
        if(isNaN(pageNum) || pageNum < 1 || pageNum > this.pages() || pageNum == this.page){
            return false;
        }
        else{
            this.page = pageNum;
            this.generateTable();
            this.paginationContainer.querySelectorAll("input.l-table-pagination-input").forEach(el => {
                el.value = this.page;
            })
            return true;
        }
    }
    getPaginationIndices(){
        let indices = {
            start: 0,
            end: 0
        };
        if(this.paginationOptions.enabled && this.paginationOptions.rowsPerPage !== null){
            indices.start = (this.page - 1) * this.paginationOptions.rowsPerPage;
            indices.end = Math.min(indices.start + this.paginationOptions.rowsPerPage, this.data.length);
        }
        else{
            indices.end = this.data.length;
        }
        return indices;
    }
    updatePagination(){
        if(this.#shouldRenderPagination()){
            this.createPaginationControls();
            console.log("Yope");
        }
        else{
            this.clearPaginationControls();
            console.log("Nope");
        }
    }
    clearPaginationControls(){
        this.paginationContainer.innerHTML = "";
    }
    createPaginationControls(){
        this.clearPaginationControls();

        let leftSide = document.createElement("div");
        let rightSide = document.createElement("div");

        leftSide.className = "l-table-pagination-left"
        rightSide.className = "l-table-pagination-right"

        let itemsPerPageSpan1 = document.createElement("span");
        let itemsPerPageInput = document.createElement("input");
        let itemsPerPageSpan2 = document.createElement("span");

        itemsPerPageSpan1.className = "l-subtle-text";
        itemsPerPageInput.className = "l-items-per-page-input";
        itemsPerPageSpan2.className = "l-subtle-text";

        itemsPerPageSpan1.innerHTML = "Show&nbsp;";
        itemsPerPageInput.value = this.paginationOptions.rowsPerPage ?? "all";
        itemsPerPageSpan2.innerHTML = this.paginationOptions.rowsPerPage == 1 ? "&nbsp;item per page" : "&nbsp;items per page";

        itemsPerPageInput.onblur = e => {
            if(itemsPerPageInput.value.toLowerCase() === "all"){
                if(this.paginationOptions.rowsPerPage !== null){
                    this.paginationCustomizedByUser = true;
                    this.paginationOptions.rowsPerPage = null;
                    this.generateTable();
                    this.updatePagination();
                }
            }
            else{
                let itemsPerPage = parseInt(itemsPerPageInput.value);
                if(isNaN(itemsPerPage) || itemsPerPage < 1){
                    itemsPerPageInput.value = this.paginationOptions.rowsPerPage;
                }
                else{
                    if(itemsPerPage !== this.paginationOptions.rowsPerPage){
                        this.paginationCustomizedByUser = true;
                        this.paginationOptions.rowsPerPage = itemsPerPage;
                        this.generateTable();
                        this.updatePagination();
                    }
                }
            }
        }

        leftSide.appendChild(itemsPerPageSpan1);
        leftSide.appendChild(itemsPerPageInput);
        leftSide.appendChild(itemsPerPageSpan2);

        let skipToBeginning = document.createElement("button");
        skipToBeginning.className = "l-table-pagination-button";
        skipToBeginning.innerHTML = "<i class='fa-solid fa-backward-fast'></i>";
        skipToBeginning.style.marginRight = "0px";
        rightSide.appendChild(skipToBeginning);

        skipToBeginning.onclick = e => {
            this.goToPage(1);
        }

        let backOnePage = document.createElement("button");
        backOnePage.className = "l-table-pagination-button";
        backOnePage.innerHTML = "<i class='fa-solid fa-backward'></i>";
        rightSide.appendChild(backOnePage);

        backOnePage.onclick = e => {
            this.goToPage(this.page - 1);
        }

        let pageTextInput = document.createElement("input");
        pageTextInput.className = "l-table-pagination-input";
        pageTextInput.value = this.page;
        pageTextInput.onblur = e => {
            let pageNum = parseInt(pageTextInput.value);
            if(!this.goToPage(pageNum))
                pageTextInput.value = this.page;
        }
        rightSide.appendChild(pageTextInput);

        let totalPageCountDisplay = document.createElement("p");
        totalPageCountDisplay.className = "l-page-count-display";
        totalPageCountDisplay.innerHTML = " / " + this.pages();
        rightSide.appendChild(totalPageCountDisplay);

        let forwardsOnePage = document.createElement("button");
        forwardsOnePage.className = "l-table-pagination-button";
        forwardsOnePage.innerHTML = "<i class='fa-solid fa-forward'></i>";
        forwardsOnePage.style.marginRight = "0px";
        rightSide.appendChild(forwardsOnePage);

        forwardsOnePage.onclick = e => {
            this.goToPage(this.page + 1);
        }

        let skipToEnd = document.createElement("button");
        skipToEnd.className = "l-table-pagination-button";
        skipToEnd.innerHTML = "<i class='fa-solid fa-forward-fast'></i>";
        rightSide.appendChild(skipToEnd);

        skipToEnd.onclick = e => {
            this.goToPage(this.pages());
        }

        this.paginationContainer.appendChild(leftSide);
        this.paginationContainer.appendChild(rightSide);
    }
    search(query) {
        if (!query)
            query = this.searchInputElement.value;
        this.searchQuery = query;
        this.mutateData();
        this.clearTable();
        this.applySearch();
        this.generateTable();
    }
    clearTable() {
        if(this.tableElement)
            this.tableElement.remove();
    }
    createTable(startIndex=null, endIndex=null){
        let paginationIndices;
        if(startIndex === null || endIndex === null){
            paginationIndices = this.getPaginationIndices();
        }
        if(startIndex === null)
            startIndex = paginationIndices.start;
        if(endIndex === null)
            endIndex = paginationIndices.end;

        this.tableElement = document.createElement("table");
        this.tableElement.className = "l-table";

        this.tableHeaderElement = document.createElement("tr");
        this.tableHeaderElement.className = "l-table-header";
        if (this.hasStickyHeaders) {
            this.tableHeaderElement.className += " l-table-sticky";
            if(this.stickyHeadersBelow){
                let rect = this.stickyHeadersBelow.getBoundingClientRect();
                this.tableHeaderElement.style.top = rect.top + rect.height + this.stickyTopOffset + "px";
            }
        }
        this.tableElement.appendChild(this.tableHeaderElement);

        this.columns.forEach(column => {
            if (this.dontRender.indexOf(column.dataName) === -1) {
                let cell = document.createElement("th");
                cell.className = "l-table-header-cell";
                if (column.titleCaseMutation !== null)
                    cell.style.textTransform = column.titleCaseMutation;
                else if (this.columnFormatting.titleCaseMutation !== null)
                    cell.style.textTransform = this.columnFormatting.titleCaseMutation;
                cell.innerHTML = column.title;
                this.tableHeaderElement.appendChild(cell);
            }
        });

        let dataSlice = this.data.slice(startIndex, endIndex);

        dataSlice.forEach(data => {
            let row = document.createElement("tr");
            row.className = "l-table-row";
            this.columns.forEach(column => {
                if (this.dontRender.indexOf(column.dataName) === -1) {
                    let cell = document.createElement("td");
                    cell.className = "l-table-row-cell";
                    let value = data[column.dataName];
                    if (value === null) {
                        if (column.nullText !== null)
                            cell.innerHTML = column.nullText;
                        else if (this.columnFormatting.nullText !== null)
                            cell.innerHTML = this.columnFormatting.nullText;
                    }
                    else {
                        if (column.textTransform)
                            cell.innerHTML = column.textTransform(value);
                        else
                            cell.innerHTML = value;
                    }
                    this.conditionalFormattingRules.forEach(rule => {
                        if (rule.meetsCondition(value))
                            rule.format(cell);
                    });
                    column.conditionalFormattingRules.forEach(rule => {
                        if (rule.meetsCondition(value))
                            rule.format(cell);
                    });
                    row.appendChild(cell);
                }
            });
            this.tableElement.appendChild(row);
        });
        if(this.data.length == 0){
            let ndfRow = document.createElement("tr");
            let ndfCell = document.createElement("td");
            ndfCell.colSpan = this.columns.length;
            ndfCell.innerHTML = this.noDataFoundMessage;
            ndfRow.appendChild(ndfCell);
            this.tableElement.appendChild(ndfRow);
        }
        if(this.#shouldRenderTitle()){
            this.titleElement.querySelectorAll(".l-table-count").forEach(el => {
                el.innerHTML = this.data.length;
            });
            this.titleElement.querySelectorAll(".l-table-unfiltered-count").forEach(el => {
                el.innerHTML = this.sourceData.length;
            });
            this.titleElement.querySelectorAll(".l-table-if-filtered").forEach(el => {
                if(this.data.length == this.sourceData.length){
                    el.style.display = "none";
                }
                else{
                    el.style.display = "inline-block";
                }
            });
            this.titleElement.querySelectorAll(".l-table-if-not-filtered").forEach(el => {
                if(this.data == this.sourceData.length){
                    el.style.display = "none";
                }
                else{
                    el.style.display = "inline-block";
                }
            });
        }
    }
    generateTable() {
        this.clearTable();
        this.createTable();
        this.tableContainer.appendChild(this.tableElement);
    }
    interpretColumnsFromData() {
        if (!this.sourceData) return;
        this.columns = [];
        let allFound = [];
        if (Array.isArray(this.sourceData)) {
            for (let i = 0; i < this.sourceData.length; i++) {
                let data = this.sourceData[i];
                if (typeof (data) === "object") {
                    let keys = Object.keys(data);
                    keys.forEach(key => {
                        if (allFound.indexOf(key) === -1)
                            allFound.push(key);
                    });
                }
            }
        }
        allFound.forEach(name => {
            let column = new LaniTableColumn();
            column.dataName = name;
            column.title = name;
            this.columns.push(column);
        });
    }
    findColumnFromDataName(dataName){
        for(let i = 0; i < this.columns.length; i++)
            if(this.columns[i].dataName == dataName)
                return this.columns[i];
    }
    findColumn(delegate){
        for(let i = 0; i < this.columns.length; i++)
            if(delegate(this.columns[i]))
                return this.columns[i];
    }
    refresh() {
        this.mutateData();
        this.generate();
    }
    applySearch() {
        if (this.searchQuery === null || this.searchQuery.length == 0){
            this.page = 1;
            this.updatePagination();
            return;
        }
        let originalDataLength = this.data.length;
        this.data = this.data.filter(item => {
            let match = false;
            this.columns.forEach(column => {
                if (this.columns !== null || this.columns.filter(item => item.dataName).length !== 0) {
                    let data = item[column.dataName];
                    if (data !== null) {
                        data = `${data}`; // stringify
                        if (this.regexSearch) {
                            match = new RegExp(this.searchQuery).test(data);
                        }
                        else {
                            let query = this.searchQuery;
                            if (!this.matchCaseSearch) {
                                data = data.toLowerCase();
                                query = query.toLowerCase();
                            }
                            match = data.indexOf(query) !== -1 || match;
                        }
                    }
                }
            });
            return match;
        });
        if(this.data.length !== originalDataLength){
            this.page = 1;
            this.updatePagination();
        }
    }
    applyFilters() {
        this.columns.forEach(column => {
            let filters = this.filters.filter(filter => filter.column == column.dataName);
            for (let i = 0; i < filters.length; i++) {
                let filter = filters[i];
                if (i === 0) {
                    this.data = filter.apply(this.sourceData);
                }
                else {
                    let lastFilter = filters[i - 1];
                    if (lastFilter.combineMode == LaniTableFilterCombineMode.And)
                        this.data = filter.apply(this.data);
                    else
                        this.data = filter.apply(this.sourceData).concat(this.data);
                }
            }
        })
    }
    applySorts() {
        // For now, just simple, single-column sorting. Advanced (grouped) sorting TODO
        if (this.sorts.length == 0) return;
        let sort = this.sorts[0];
        this.data.sort((row1, row2) => sort.compare(row1, row2));
    }
    mutateData() {
        if (this.sourceData === null) return;
        this.data = this.sourceData.slice(); // clone data source array
        this.applyFilters();
        this.applySorts();
    }
    async fetchData() {

    }
    async refreshData() {

    }
    json(data) {
        this.sourceData = JSON.parse(data);
        this.refresh();
    }
    csv(data, hasHeaders=true) {
        throw "CSV intake not yet implemented";
    }
    array(data) {
        this.sourceData = data;
        if(this.columns === null)
            this.interpretColumnsFromData();
        this.refresh();
    }
    expandAll() {

    }
    collapseAll() {

    }
    appendTo(parent, refresh=true) {
        if (typeof (parent) === "string") parent = document.querySelector(parent);
        this.parent = parent;
        if(refresh)
            this.refresh();
    }
}

Lani.TableRow = class {
    constructor() {
        this.data = null;
        this.isChildRow = false;
        this.collapsed = false;
        this.height = null;
        this.childRows = [];
    }
}

Lani.TableCaseMutation = {
    Lower: "lowercase",
    Upper:  "uppercase",
    Capitalize: "capitalize"
}

Lani.TableColumn = class extends Lani.TableColumnFormatting {
    constructor(title = null, dataName = null) {
        super();
        this.title = title;
        this.dataName = dataName;
        if (this.title !== null && this.dataName === null)
            this.dataName = this.title;
        // Filter / sort by has a drop-down menu as "suggestions"
        this.forceSuggestions = false;
        // Drop-down menu will be replaced with text input at this number of distinct items
        this.suggestionCutoff = 100;
        this.caseInsensitiveSuggestions = false;
        this.ignoredInSearch = false;
        this.showFilterButton = true;
        this.showSortButton = true;
        this.index = 0;
        this.conditionalFormattingRules = [];
        this.dataTypeHint = null;
    }
}

Lani.TableFilterMode = {
    Equals: "=",
    GreaterThan: ">",
    LessThan: "<",
    StartsWith: "startswith",
    EndsWith: "endswith",
    Contains: "contains",
    Between: "between"
};

Lani.TableFilterCombineMode = {
    Or: "||",
    And: "&&"
};

Lani.TableFilter = class {
    constructor(column, comparison, value, combineMode = Lani.TableFilterCombineMode.And) {
        this.column = column;
        this.comparison = comparison;
        this.value = value;
        this.combineMode = combineMode;
        this.negated = false;
        this.caseSensitivity = false;
    }
    apply(data) {
        return data.filter(item => {
            let data = this.item[this.column];
            let type = typeof data;
            if (this.comparison == Lani.TableFilterMode.Equals) {
                if (type === "string" && !this.caseSensitivity)
                    return (!this.negated) && data.toLowerCase() == this.value.toLowerCase();
                else
                    return (!this.negated) && item[this.column] == this.value;
            }
        });
    }
}

Lani.TableConditionalFormatting = class {
    constructor() {

    }
    meetsCondition(row) {
        // to be overridden
    }
    format(cell) {
        // To be overridden
    }
}

Lani.TableSortDirection = {
    Ascending: 0,
    Descending: 1
};

Lani.TableSort = class {
    constructor(columnName, sortDirection = Lani.TableSortDirection.Descending) {
        this.columnName = columnName;
        this.direction = sortDirection;
    }
    compare(row1, row2) {
        if (row1[this.columnName] == row2[this.columnName]) return 0;
        else if (row1[this.columnName] > row2[this.columnName])
            return this.direction === Lani.TableSortDirection.Descending ? -1 : 1;
        else
            return this.direction === Lani.TableSortDirection.Descending ? 1 : -1;
    }
}

Lani.TableAnimationDirection = {
    Forwards: 0,
    Backwards: 1
};

Lani.TablePaginationAnimation = class {
    constructor(table){
        this.table = table;
        this.speed = 1.0;
    }
    animate(direction, oldPage, newPage){
        // To be overridden
    }
};

Lani.TablePageAnimations = {
    Fade: class extends Lani.TablePaginationAnimation {
        constructor(table){
            super(table);
        }
    },
    Shuffle: class extends Lani.TablePaginationAnimation {
        constructor(table){
            super(table);
        }
    }
}

window.addEventListener("load", Lani.tableLoadHandler);
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
