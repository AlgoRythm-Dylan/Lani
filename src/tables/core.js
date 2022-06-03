/*

    Lani tables module

*/
Lani.installedModules.push("lani-tables");

Lani.TableColumnFormatting = class {
    constructor() {
        this.width = null;
        this.caseMutation = null;
        this.titleCaseMutation = null;
        this.trimData = false;
        this.textTransform = null;
        this.nullText = null;
    }
}

Lani.Table = class {
    // Title needs to be private so we can employ
    // a setter function (so we can also update the DOM)
    // transparently to the user
    #title
    constructor() {

        // General options
        this.#title = null;
        this.showTitle = true;
        this.showHeaders = true;
        this.id = null;
        this.hasStickyHeaders = false;
        this.stickyHeadersBelow = null;
        this.stickyTopOffset = 0;
        this.showFilterButton = true;
        this.showSortButton = true;

        // Search
        this.showSearch = true;
        this.searchQuery = null;
        this.searchColumns = null;
        this.regexSearch = false;
        this.matchCaseSearch = false;
        this.updateSearchWhileTyping = true;
        this.showAdvancedSearchOptions = false;
        this.updateSearchWhileTypingTreshold = 100;

        // Data fetching
        /*this.dataMode = Lani.TableDataMode.Static;
        this.dataSource = null;
        this.fetchOptions = null;*/

        // Nesting
        this.parentTable = null;
        this.parentTableIndent = 10;

        // Column rules
        this.columns = null;
        this.dontRender = [];

        // Data
        this.sourceData = null;
        this.data = null;
        this.filters = [];
        this.sorts = [];
        this.noDataFoundMessage = "<div class='l-table-ndf-parent'>" +
            "<i class='fa-solid fa-glasses l-subtle-icon'></i>" +
            "<div><h2>No Results</h2>" + 
            "<p>Try changing your search or filters</p></div></div>"

        // DOM
        /*this.parent = null;
        this.container = null;
        this.controlsContainerElement = null;
        this.searchInputElement = null;
        this.titleElement = null;
        this.tableContainer = null;
        this.tableElement = null;
        this.tableHeaderElement = null;
        this.tableBodyElement = null;
        this.paginationContainer = null;*/
        this.DOMHost = null;

        // Formatting
        this.defaultRowHeight = null;
        this.defaultColumnWidth = null;
        this.columnFormatting = new Lani.TableColumnFormatting();
        this.conditionalFormattingRules = [];

        // Events
        /*this.onRefresh = null;
        this.onPageChange = null;
        this.onRowClick = null;
        this.onCellClick = null;
        this.onUpdate = null;
        this.onDisplayChange = null;*/

    }

    // Private methods
    #shouldRenderTitle(){
        return !(!this.showTitle || !this.title || this.title.length === 0);
    }
    #shouldRenderPagination(){
        return this.paginationCustomizedByUser || 
            (this.paginationOptions.enabled && (this.paginationOptions.alwaysShow || 
                (this.data.length > this.paginationOptions.rowsPerPage)));
    }

    // DOM interactions & settings
    set title(title){
        this.#title = title;
        this.DOMHost.getElementById("title").innerHTML = title;
    }

    get title(){
        return this.#title;
    }

}