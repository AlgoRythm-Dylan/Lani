/*

    Dialog module

*/
Lani.installedModules.push("lani-dialogs");

Lani.currentDialogLayer = null;

Lani.DialogLayer = class extends Lani.Element {
    constructor(){
        this.dialogs = [];
    }
    async setup(){
        await this.useTemplate(Lani.templatesPath(), "#lani-dialog-layer");
    }
}

Lani.Dialog = class extends Lani.Element{
    constructor(){
        super();
    }
    async setup(){
        await this.useTemplate(Lani.templatesPath(), "#lani-dialog");
    }
}













/*Lani.dialogLayer = null;
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
    show(){

    }
    restore(){

    }
}*/