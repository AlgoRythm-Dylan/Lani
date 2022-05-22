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