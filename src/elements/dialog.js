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
            let originalWidth = this.offsetWidth;
            let originalHeight = this.offsetHeight;
            this.resize(this.offsetWidth - x, this.offsetHeight - y);
            this.moveBy(originalWidth - this.offsetWidth, originalHeight - this.offsetHeight);
        });

        this.#resizeHandle("resize-top", dragEvent => {
            let y = dragEvent.clientY - this.offsetTop;
            let originalHeight = this.offsetHeight;
            this.resize(null, this.offsetHeight - y);
            this.moveBy(null, originalHeight - this.offsetHeight);
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
            let originalWidth = this.offsetWidth;
            this.resize(this.offsetWidth - x, null);
            this.moveBy(originalWidth - this.offsetWidth, null);
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