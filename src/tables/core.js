/*

    Lani tables module

*/
Lani.installedModules.push("lani-tables");

Lani.tables = [];
Lani.getTable = id => {
    for(let i = 0; i < Lani.tables.length; i++)
        if(Lani.tables[i].id == id)
            return Lani.tables[i];
}

Lani.Table = class {
    constructor() {

        // General options
        this.title = null;
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
        this.dataMode = Lani.TableDataMode.Static;
        this.dataSource = null;
        this.fetchOptions = null;

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
        this.parent = null;
        this.container = null;
        this.controlsContainerElement = null;
        this.searchInputElement = null;
        this.titleElement = null;
        this.tableContainer = null;
        this.tableElement = null;
        this.tableHeaderElement = null;
        this.tableBodyElement = null;
        this.paginationContainer = null;

        // Formatting
        this.defaultRowHeight = null;
        this.defaultColumnWidth = null;
        this.columnFormatting = new Lani.TableColumnFormatting();
        this.conditionalFormattingRules = [];

        // Pagination
        this.paginationOptions = new Lani.TablePaginationOptions();
        this.page = 1;
        this.paginationCustomizedByUser = false;

        // Events
        this.onRefresh = null;
        this.onPageChange = null;
        this.onRowClick = null;
        this.onCellClick = null;
        this.onUpdate = null;
        this.onDisplayChange = null;

    }
}