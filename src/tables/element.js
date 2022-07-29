Lani.TableTemplates = {};
Lani.TableTemplates.Loading = `<style>

</style>
<div id="loading-container">
    <h2 id="loading-text">Loading your table...</h2>
    <p id="loading-subtext">Hang tight</p>
    <lani-icon id="loading-icon" icon="table"></lani-icon>
</div>
`;

Lani.TableTemplates.NoDataFound = `<p>No Data Found</p>`

Lani.TableElement = class extends Lani.DataElement {
    #title
    constructor(){
        super();

        // Formatting
        this.renderHeaders = true;
        this.renderer = new Lani.TableRenderer(this);
        this.dataSource = null;

        // Data discovery options
        this.autoParseColumns = true;

        // Columns
        this.columns = [];
        this.ignoreColumns = [];
        this.columnNamePrettifier = new Lani.DataNamePrettifier();

        // Templates
        this.loadingTemplate = Lani.TableTemplates.Loading;
        this.noDataFoundTemplate = Lani.TableTemplates.NoDataFound;

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

    setBody(newBody){
        let body = this.shadow.getElementById("body")
        body.innerHTML = "";
        if(typeof newBody === "string")
            body.innerHTML = newBody;
        else
            body.appendChild(newBody);
    }

    showLoading(){
        this.setBody(this.loadingTemplate);
    }
    showNoDataFound(){

    }

    // Data ops
    // Download data. For now, expects JSON
    async downloadData(source){
        let data = await (await fetch(source)).json();
        this.dataSource = new Lani.InMemoryDataSource(data);
    }
    parseColumns(data){
        this.columns = [];
        for(let row of data.rows){
            for(let key of Object.keys(row.data)){
                if(this.ignoreColumns.includes(key))
                    continue;
                this.columns.push(new Lani.TableColumn(this.columnNamePrettifier.prettify(key), key));
            }
        }
        return this.columns;
    }
};

Lani.regEl("lani-table", Lani.TableElement);