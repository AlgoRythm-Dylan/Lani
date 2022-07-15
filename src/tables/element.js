Lani.TableElement = class extends Lani.DataElement {
    #title
    constructor(){
        super();

        // Formatting
        this.renderHeaders = true;
        this.bodyRenderer = new Lani.TableBodyRenderer(this);
        this.dataSource = null;

        // Data discovery options
        this.autoParseColumns = true;

        // Columns
        this.columns = [];

        this.setup();
    }
    async setup(){
        await this.useTemplate(Lani.templatesPath(), "#lani-table", false);
        this.linkStyle(Lani.contentRoot + "/tables.css");

        let title = this.getAttribute("table-title");
        if(title)
            this.title = title;

        let download = this.getAttribute("download-data");
        if(download){
            this.downloadData(download);
        }

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

    // Table body
    async #renderBody(){
        let body = this.bodyRenderer.render(await this.dataSource.get());
    }

    // Data ops
    // Download data. For now, expects JSON
    async downloadData(source){
        let data = await (await fetch(source)).json();
        this.dataSource = new Lani.InMemoryDataSource(data);
        //this.#renderBody();
    }
};

Lani.regEl("lani-table", Lani.TableElement);