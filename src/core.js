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
    emit(eventName, detail={}){
        this.dispatchEvent(new CustomEvent(eventName, detail));
    }
    ready(detail={}){
        this.emit("lani::ready", detail);
    }
}

Lani.regEl = (elementName, element, options) => {
    customElements.define(elementName, element, options);
}

Lani.Direction = {
    Left: 0,
    Right: 1
};