Lani.TableTemplates = {};
Lani.TableTemplates.Loading = `<style>

</style>
<div id="loading-container">
    <h2 id="loading-text">Loading your table...</h2>
    <p id="loading-subtext">Hang tight</p>
    <lani-icon id="loading-icon" icon="table"></lani-icon>
</div>
`;

Lani.TableTemplates.NoDataFound = `<p>No Data Found</p>`;
Lani.ElementEvents.TableColumnAdded = "lani::table-column-added";

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
        this.columnFormatting = new Lani.TableColumnFormatting();
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

        // TODO: this only works because the async this.useTemplate is taking
        // long enough for the child nodes to populate(?) -- CHANGE
        Lani.TableColumnElement.parseFormatting(this, this.columnFormatting);
        this.doDiscovery();
        this.renderTable();

        if(!this.getBoolAttribute("show-header", true))
            this.hideHeader();
        if(!this.getBoolAttribute("show-search", true))
            this.hideSearch();

        this.ready();
    }

    showHeader(){
        this.shadow.getElementById("header").style.display = "flex";
    }
    hideHeader(){
        this.shadow.getElementById("header").style.display = "none";
    }
    showSearch(){
        this.shadow.getElementById("search-container").style.display = "flex";
    }
    hideSearch(){
        this.shadow.getElementById("search-container").style.display = "none";
    }

    // Title items 
    get title(){
        return this.#title;
    }
    set title(title){
        this.#title = title;
        Lani.useGenericTemplate(this.#title, this.shadow.getElementById("title"), false);
    }

    async renderTable(){
        if(this.renderer === null || this.dataSource === null)
            return;
        let data = await this.dataSource.get();
        // If no columns have been specified, we can try to parse them
        // unless the developer doesn't want this for some reason
        if(this.autoParseColumns && this.columns.length === 0)
            this.parseColumns(data);
        this.renderer.render(data);
    }
    setBody(newBody){
        let body = this.shadow.getElementById("body")
        Lani.useGenericTemplate(newBody, body, false);
    }

    showLoading(){
        this.setBody(this.loadingTemplate);
    }
    showNoDataFound(){

    }

    // Discovery
    doDiscovery(){
        this.discoverTitle();
        this.discoverColumns();
        this.discoverDataSource();
    }
    discoverColumns(){
        let columns = Array.from(this.querySelectorAll("lani-table-column"));
        if(columns.length === 0)
            return;
        for(let column of columns.map(col => col.column)){
            this.addColumn(column);
        }
    }
    discoverDataSource(){
        let source = this.querySelector("lani-data-source");
        if(!source)
            return;
        this.dataSource = source.dataSource;
    }
    discoverTitle(){
        let discoveredTitle = null;
        let template = this.querySelector("template[slot='title']");
        if(template){
            discoveredTitle = template;
        }
        return this.title = discoveredTitle;
    }

    addColumn(column){
        this.columns.push(column);
        column.table = this;
        this.emit(Lani.ElementEvents.TableColumnAdded, {column});
    }
    parseColumns(data){
        this.columns = [];
        for(let row of data.rows){
            for(let key of Object.keys(row.data)){
                if(this.ignoreColumns.includes(key))
                    continue;
                if(!this.columns.some(column => column.sourceName === key))
                    this.addColumn(new Lani.TableColumn(
                        this.columnNamePrettifier.prettify(key), key));
            }
        }
        return this.columns;
    }
    // If any columns are grouped, they:
    //      a) Must be the first columns in the table
    //      b) Must be in the order of grouping
    validateColumnOrder(){
        if(this.dataSource.groups.length > this.columns.length)
            throw "More groups than columns";
        for(let i = 0; i < this.dataSource.groups.length; i++){
            if(this.dataSource.groups[i] != this.columns[i].sourceName)
                throw `Grouped column in wrong order: ${this.columns[i].name} (${this.columns[i].sourceName})`;
        }
    }
};

Lani.regEl("lani-table", Lani.TableElement);