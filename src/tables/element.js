Lani.TableElement = class extends Lani.DataElement {
    #title
    constructor(){
        super();

        // Formatting
        this.renderHeaders = true;

        this.setup();
    }
    async setup(){
        await this.useTemplate(Lani.templatesPath(), "#lani-table", false);
        this.linkStyle(Lani.contentRoot + "/tables.css");

        let title = this.getAttribute("table-title");
        if(title)
            this.title = title;

        this.ready();
    }
    // Title items 
    get title(){
        return this.#title;
    }
    set title(title){
        this.#title = title;
        this.shadow.getElementById("title").innerHTML = title;
    }
    // Table headers
    #renderHeaders(){
        if(!this.renderHeaders)
            return;
    } 
};

Lani.regEl("lani-table", Lani.TableElement);