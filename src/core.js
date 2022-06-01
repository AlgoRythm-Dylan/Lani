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
    Ready: "lani::ready"
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
    End: "end"
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
    }
    if(verticalPosition){
        if(verticalPosition == Lani.Position.Start)
            element.style.top = "0px";
        else if(verticalPosition == Lani.Position.Middle)
            element.style.top = `${verticalOffset + ((element.parentNode.offsetHeight / 2) - (element.offsetHeight / 2))}px`;
        else if(verticalPosition == Lani.Position.End)
            element.style.top = `${verticalOffset + (element.parentNode.offsetHeight - element.offsetHeight)}px`;
    }
}