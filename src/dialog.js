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
    }
    show(dialog){
        this.dialogs.push(dialog);
        this.appendChild(dialog);

        dialog.doPosition();
    }
}

Lani.Dialog = class extends Lani.Element{
    #dialogTitle
    #content
    constructor(){
        super();
        this.#dialogTitle = null;
        this.#content = null;

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

        this.setup();
    }
    async setup(){
        await this.useTemplate(Lani.templatesPath(), "#lani-dialog");
    }
    set dialogTitle(title){
        this.#dialogTitle = title;
        this.shadow.getElementById("title").innerHTML = this.#dialogTitle;
    }
    set content(content){
        this.#content = content;
    }
    doPosition(){
        Lani.positionElement(this,
            this.horizontalAlignment,
            this.verticalAlignment,
            this.movementOffsetLeft,
            this.movementOffsetRight);
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
    addActionButton(text, action){
        let button = this.addButton(text, action);
        button.className += " l-button-action";
        return button;
    }
}

Lani.showDialog = async dialog => {
    if(Lani.currentDialogLayer === null){
        Lani.currentDialogLayer = await Lani.waitForElement("lani-dialog-layer");
        document.body.appendChild(Lani.currentDialogLayer);
    }
    Lani.currentDialogLayer.show(dialog);
}

Lani.alert = async (message, title="Webpage Dialog") => {
    let dialog = await Lani.waitForElement("lani-dialog");
    dialog.content = message;
    dialog.dialogTitle = title;
    dialog.style.minWidth = "250px";
    dialog.style.minHeight = "150px";
    dialog.addButton("Ok");
    await Lani.showDialog(dialog);
}

Lani.regEl("lani-dialog-layer", Lani.DialogLayer);
Lani.regEl("lani-dialog", Lani.Dialog);