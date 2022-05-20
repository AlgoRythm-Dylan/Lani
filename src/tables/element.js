Lani.TableElement = class extends Lani.Element {
    constructor(){
        super();
        this.table = null;
        this.setup();
    }
    async setup(){
        await this.useTemplate(Lani.templatesPath(), "#lani-table-core");

        this.table = new Lani.Table();

        this.table.DOMHost = this.shadow;

        this.table.id = this.id;
        if(this.id){
            Lani.tables.push(table);
        }
        let title = this.getAttribute("table-title");
        if(title)
            this.table.title = title;
    }
    // declare the watched attributes
    static get observedAttributes() {
        return ["table-title"];
    }
    attributeChangedCallback(name, oldValue, newValue){
        // Table has not loaded yet
        if(!this.table)
            return;
        if(name == "table-title")
            this.table.title = newValue;
    }
};

Lani.regEl("lani-table", Lani.TableElement);