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