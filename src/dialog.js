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

        this.setup();
    }
    async setup(){
        await this.useTemplate(Lani.templatesPath(), "#lani-dialog-layer");

        this.addEventListener("lani::close", e => {
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
        this.emit("lani::show");
    }
    close(){
        if(this.parentNode)
            this.parentNode.removeChild(this);
        this.emit("lani::close");
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
        this.movementOffsetRight = 0;
        this.allowMovePastBorders = true;

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
                this.movementOffsetRight);
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

    }
    moveBy(x, y){
        this.movementOffsetLeft += x;
        this.movementOffsetRight += y;
        this.doPosition();        
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
        this.emit("lani::close");
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