/*

    Lani tables module

*/
Lani.installedModules.push("lani-tables");

Lani.tables = [];
/*Lani.tableLoadHandler = e => {
    document.querySelectorAll(".l-table-parent").forEach(el => {
        let table = new Lani.Table();
        table.id = el.id;
        if(el.id){
            Lani.tables.push(table);
        }
        Lani.attributeMap(el, table, {
            "title": "title"
        })
        table.appendTo(el);
    });
}*/

Lani.TableDataMode = {
    Static: 0,
    Fetch: 1
};

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

Lani.TablePaginationOptions = class {
    constructor() {
        this.enabled = true;
        this.rowsPerPage = 10;
        this.showBackNext = true;
        this.alwaysShow = false;
    }
}

Lani.Table = class {
    
    clear() {
        if (!this.container) return;
        this.container.remove();

        this.container = null;
    }
    #shouldRenderTitle(){
        return !(!this.showTitle || !this.title || this.title.length === 0);
    }
    #shouldRenderPagination(){
        return this.paginationCustomizedByUser || 
            (this.paginationOptions.enabled && (this.paginationOptions.alwaysShow || 
                (this.data.length > this.paginationOptions.rowsPerPage)));
    }
    generate() {
        if (!this.columns) return;
        this.clear();

        this.container = document.createElement("div");
        this.container.className = "l-table-container l-light-shadow";

        if(this.parent)
            this.parent.appendChild(this.container);

        this.controlsContainerElement = document.createElement("div");
        this.controlsContainerElement.className = "l-table-controls-container";
        this.container.appendChild(this.controlsContainerElement);

        this.titleElement = document.createElement("p");
        this.titleElement.className = "l-table-title";
        if (!this.#shouldRenderTitle()) {
            this.titleElement.style.display = "none";
        }
        else {
            this.titleElement.innerHTML = this.title;
        }
        this.controlsContainerElement.appendChild(this.titleElement);

        this.searchInputElement = document.createElement("input");
        this.searchInputElement.className = "l-table-search-input";
        this.searchInputElement.placeholder = "Search...";
        this.controlsContainerElement.appendChild(this.searchInputElement);
        this.searchInputElement.addEventListener("input", e => {
            let tooManyRows = this.updateSearchWhileTypingTreshold !== null &&
                this.sourceData.length > this.updateSearchWhileTypingTreshold;
            if(this.updateSearchWhileTyping && !tooManyRows)
                this.search();
        });
        this.searchInputElement.addEventListener("keydown", e => {
            if(e.keyCode === 13)
                this.search();
        });

        this.tableContainer = document.createElement("div");
        this.tableContainer.className = "l-table-element-container";
        this.container.appendChild(this.tableContainer);

        this.paginationContainer = document.createElement("div");
        this.paginationContainer.className = "l-pagination-container";
        if(this.#shouldRenderPagination()){
            this.container.appendChild(this.paginationContainer);
            this.createPaginationControls();
        }

        this.generateTable();
    }
    pages(){
        if(this.paginationOptions.rowsPerPage === null)
            return 1;
        return Math.max(1, Math.ceil(this.data.length / this.paginationOptions.rowsPerPage));
    }
    goToPage(pageNum){
        if(isNaN(pageNum) || pageNum < 1 || pageNum > this.pages() || pageNum == this.page){
            return false;
        }
        else{
            this.page = pageNum;
            this.generateTable();
            this.paginationContainer.querySelectorAll("input.l-table-pagination-input").forEach(el => {
                el.value = this.page;
            })
            return true;
        }
    }
    getPaginationIndices(){
        let indices = {
            start: 0,
            end: 0
        };
        if(this.paginationOptions.enabled && this.paginationOptions.rowsPerPage !== null){
            indices.start = (this.page - 1) * this.paginationOptions.rowsPerPage;
            indices.end = Math.min(indices.start + this.paginationOptions.rowsPerPage, this.data.length);
        }
        else{
            indices.end = this.data.length;
        }
        return indices;
    }
    updatePagination(){
        if(this.#shouldRenderPagination()){
            this.createPaginationControls();
            console.log("Yope");
        }
        else{
            this.clearPaginationControls();
            console.log("Nope");
        }
    }
    clearPaginationControls(){
        this.paginationContainer.innerHTML = "";
    }
    createPaginationControls(){
        this.clearPaginationControls();

        let leftSide = document.createElement("div");
        let rightSide = document.createElement("div");

        leftSide.className = "l-table-pagination-left"
        rightSide.className = "l-table-pagination-right"

        let itemsPerPageSpan1 = document.createElement("span");
        let itemsPerPageInput = document.createElement("input");
        let itemsPerPageSpan2 = document.createElement("span");

        itemsPerPageSpan1.className = "l-subtle-text";
        itemsPerPageInput.className = "l-items-per-page-input";
        itemsPerPageSpan2.className = "l-subtle-text";

        itemsPerPageSpan1.innerHTML = "Show&nbsp;";
        itemsPerPageInput.value = this.paginationOptions.rowsPerPage ?? "all";
        itemsPerPageSpan2.innerHTML = this.paginationOptions.rowsPerPage == 1 ? "&nbsp;item per page" : "&nbsp;items per page";

        itemsPerPageInput.onblur = e => {
            if(itemsPerPageInput.value.toLowerCase() === "all"){
                if(this.paginationOptions.rowsPerPage !== null){
                    this.paginationCustomizedByUser = true;
                    this.paginationOptions.rowsPerPage = null;
                    this.generateTable();
                    this.updatePagination();
                }
            }
            else{
                let itemsPerPage = parseInt(itemsPerPageInput.value);
                if(isNaN(itemsPerPage) || itemsPerPage < 1){
                    itemsPerPageInput.value = this.paginationOptions.rowsPerPage;
                }
                else{
                    if(itemsPerPage !== this.paginationOptions.rowsPerPage){
                        this.paginationCustomizedByUser = true;
                        this.paginationOptions.rowsPerPage = itemsPerPage;
                        this.generateTable();
                        this.updatePagination();
                    }
                }
            }
        }

        leftSide.appendChild(itemsPerPageSpan1);
        leftSide.appendChild(itemsPerPageInput);
        leftSide.appendChild(itemsPerPageSpan2);

        let skipToBeginning = document.createElement("button");
        skipToBeginning.className = "l-table-pagination-button";
        skipToBeginning.innerHTML = "<i class='fa-solid fa-backward-fast'></i>";
        skipToBeginning.style.marginRight = "0px";
        rightSide.appendChild(skipToBeginning);

        skipToBeginning.onclick = e => {
            this.goToPage(1);
        }

        let backOnePage = document.createElement("button");
        backOnePage.className = "l-table-pagination-button";
        backOnePage.innerHTML = "<i class='fa-solid fa-backward'></i>";
        rightSide.appendChild(backOnePage);

        backOnePage.onclick = e => {
            this.goToPage(this.page - 1);
        }

        let pageTextInput = document.createElement("input");
        pageTextInput.className = "l-table-pagination-input";
        pageTextInput.value = this.page;
        pageTextInput.onblur = e => {
            let pageNum = parseInt(pageTextInput.value);
            if(!this.goToPage(pageNum))
                pageTextInput.value = this.page;
        }
        rightSide.appendChild(pageTextInput);

        let totalPageCountDisplay = document.createElement("p");
        totalPageCountDisplay.className = "l-page-count-display";
        totalPageCountDisplay.innerHTML = " / " + this.pages();
        rightSide.appendChild(totalPageCountDisplay);

        let forwardsOnePage = document.createElement("button");
        forwardsOnePage.className = "l-table-pagination-button";
        forwardsOnePage.innerHTML = "<i class='fa-solid fa-forward'></i>";
        forwardsOnePage.style.marginRight = "0px";
        rightSide.appendChild(forwardsOnePage);

        forwardsOnePage.onclick = e => {
            this.goToPage(this.page + 1);
        }

        let skipToEnd = document.createElement("button");
        skipToEnd.className = "l-table-pagination-button";
        skipToEnd.innerHTML = "<i class='fa-solid fa-forward-fast'></i>";
        rightSide.appendChild(skipToEnd);

        skipToEnd.onclick = e => {
            this.goToPage(this.pages());
        }

        this.paginationContainer.appendChild(leftSide);
        this.paginationContainer.appendChild(rightSide);
    }
    search(query) {
        if (!query)
            query = this.searchInputElement.value;
        this.searchQuery = query;
        this.mutateData();
        this.clearTable();
        this.applySearch();
        this.generateTable();
    }
    clearTable() {
        if(this.tableElement)
            this.tableElement.remove();
    }
    createTable(startIndex=null, endIndex=null){
        let paginationIndices;
        if(startIndex === null || endIndex === null){
            paginationIndices = this.getPaginationIndices();
        }
        if(startIndex === null)
            startIndex = paginationIndices.start;
        if(endIndex === null)
            endIndex = paginationIndices.end;

        this.tableElement = document.createElement("table");
        this.tableElement.className = "l-table";

        this.tableHeaderElement = document.createElement("tr");
        this.tableHeaderElement.className = "l-table-header";
        if (this.hasStickyHeaders) {
            this.tableHeaderElement.className += " l-table-sticky";
            if(this.stickyHeadersBelow){
                let rect = this.stickyHeadersBelow.getBoundingClientRect();
                this.tableHeaderElement.style.top = rect.top + rect.height + this.stickyTopOffset + "px";
            }
        }
        this.tableElement.appendChild(this.tableHeaderElement);

        this.columns.forEach(column => {
            if (this.dontRender.indexOf(column.dataName) === -1) {
                let cell = document.createElement("th");
                cell.className = "l-table-header-cell";
                if (column.titleCaseMutation !== null)
                    cell.style.textTransform = column.titleCaseMutation;
                else if (this.columnFormatting.titleCaseMutation !== null)
                    cell.style.textTransform = this.columnFormatting.titleCaseMutation;
                cell.innerHTML = column.title;
                this.tableHeaderElement.appendChild(cell);
            }
        });

        let dataSlice = this.data.slice(startIndex, endIndex);

        dataSlice.forEach(data => {
            let row = document.createElement("tr");
            row.className = "l-table-row";
            this.columns.forEach(column => {
                if (this.dontRender.indexOf(column.dataName) === -1) {
                    let cell = document.createElement("td");
                    cell.className = "l-table-row-cell";
                    let value = data[column.dataName];
                    if (value === null) {
                        if (column.nullText !== null)
                            cell.innerHTML = column.nullText;
                        else if (this.columnFormatting.nullText !== null)
                            cell.innerHTML = this.columnFormatting.nullText;
                    }
                    else {
                        if (column.textTransform)
                            cell.innerHTML = column.textTransform(value);
                        else
                            cell.innerHTML = value;
                    }
                    this.conditionalFormattingRules.forEach(rule => {
                        if (rule.meetsCondition(value))
                            rule.format(cell);
                    });
                    column.conditionalFormattingRules.forEach(rule => {
                        if (rule.meetsCondition(value))
                            rule.format(cell);
                    });
                    row.appendChild(cell);
                }
            });
            this.tableElement.appendChild(row);
        });
        if(this.data.length == 0){
            let ndfRow = document.createElement("tr");
            let ndfCell = document.createElement("td");
            ndfCell.colSpan = this.columns.length;
            ndfCell.innerHTML = this.noDataFoundMessage;
            ndfRow.appendChild(ndfCell);
            this.tableElement.appendChild(ndfRow);
        }
        if(this.#shouldRenderTitle()){
            this.titleElement.querySelectorAll(".l-table-count").forEach(el => {
                el.innerHTML = this.data.length;
            });
            this.titleElement.querySelectorAll(".l-table-unfiltered-count").forEach(el => {
                el.innerHTML = this.sourceData.length;
            });
            this.titleElement.querySelectorAll(".l-table-if-filtered").forEach(el => {
                if(this.data.length == this.sourceData.length){
                    el.style.display = "none";
                }
                else{
                    el.style.display = "inline-block";
                }
            });
            this.titleElement.querySelectorAll(".l-table-if-not-filtered").forEach(el => {
                if(this.data == this.sourceData.length){
                    el.style.display = "none";
                }
                else{
                    el.style.display = "inline-block";
                }
            });
        }
    }
    generateTable() {
        this.clearTable();
        this.createTable();
        this.tableContainer.appendChild(this.tableElement);
    }
    interpretColumnsFromData() {
        if (!this.sourceData) return;
        this.columns = [];
        let allFound = [];
        if (Array.isArray(this.sourceData)) {
            for (let i = 0; i < this.sourceData.length; i++) {
                let data = this.sourceData[i];
                if (typeof (data) === "object") {
                    let keys = Object.keys(data);
                    keys.forEach(key => {
                        if (allFound.indexOf(key) === -1)
                            allFound.push(key);
                    });
                }
            }
        }
        allFound.forEach(name => {
            let column = new LaniTableColumn();
            column.dataName = name;
            column.title = name;
            this.columns.push(column);
        });
    }
    findColumnFromDataName(dataName){
        for(let i = 0; i < this.columns.length; i++)
            if(this.columns[i].dataName == dataName)
                return this.columns[i];
    }
    findColumn(delegate){
        for(let i = 0; i < this.columns.length; i++)
            if(delegate(this.columns[i]))
                return this.columns[i];
    }
    refresh() {
        this.mutateData();
        this.generate();
    }
    applySearch() {
        if (this.searchQuery === null || this.searchQuery.length == 0){
            this.page = 1;
            this.updatePagination();
            return;
        }
        let originalDataLength = this.data.length;
        this.data = this.data.filter(item => {
            let match = false;
            this.columns.forEach(column => {
                if (this.columns !== null || this.columns.filter(item => item.dataName).length !== 0) {
                    let data = item[column.dataName];
                    if (data !== null) {
                        data = `${data}`; // stringify
                        if (this.regexSearch) {
                            match = new RegExp(this.searchQuery).test(data);
                        }
                        else {
                            let query = this.searchQuery;
                            if (!this.matchCaseSearch) {
                                data = data.toLowerCase();
                                query = query.toLowerCase();
                            }
                            match = data.indexOf(query) !== -1 || match;
                        }
                    }
                }
            });
            return match;
        });
        if(this.data.length !== originalDataLength){
            this.page = 1;
            this.updatePagination();
        }
    }
    applyFilters() {
        this.columns.forEach(column => {
            let filters = this.filters.filter(filter => filter.column == column.dataName);
            for (let i = 0; i < filters.length; i++) {
                let filter = filters[i];
                if (i === 0) {
                    this.data = filter.apply(this.sourceData);
                }
                else {
                    let lastFilter = filters[i - 1];
                    if (lastFilter.combineMode == LaniTableFilterCombineMode.And)
                        this.data = filter.apply(this.data);
                    else
                        this.data = filter.apply(this.sourceData).concat(this.data);
                }
            }
        })
    }
    applySorts() {
        // For now, just simple, single-column sorting. Advanced (grouped) sorting TODO
        if (this.sorts.length == 0) return;
        let sort = this.sorts[0];
        this.data.sort((row1, row2) => sort.compare(row1, row2));
    }
    mutateData() {
        if (this.sourceData === null) return;
        this.data = this.sourceData.slice(); // clone data source array
        this.applyFilters();
        this.applySorts();
    }
    async fetchData() {

    }
    async refreshData() {

    }
    json(data) {
        this.sourceData = JSON.parse(data);
        this.refresh();
    }
    csv(data, hasHeaders=true) {
        throw "CSV intake not yet implemented";
    }
    array(data) {
        this.sourceData = data;
        if(this.columns === null)
            this.interpretColumnsFromData();
        this.refresh();
    }
    expandAll() {

    }
    collapseAll() {

    }
    appendTo(parent, refresh=true) {
        if (typeof (parent) === "string") parent = document.querySelector(parent);
        this.parent = parent;
        if(refresh)
            this.refresh();
    }
}

Lani.TableRow = class {
    constructor() {
        this.data = null;
        this.isChildRow = false;
        this.collapsed = false;
        this.height = null;
        this.childRows = [];
    }
}

Lani.TableCaseMutation = {
    Lower: "lowercase",
    Upper:  "uppercase",
    Capitalize: "capitalize"
}

Lani.TableColumn = class extends Lani.TableColumnFormatting {
    constructor(title = null, dataName = null) {
        super();
        this.title = title;
        this.dataName = dataName;
        if (this.title !== null && this.dataName === null)
            this.dataName = this.title;
        // Filter / sort by has a drop-down menu as "suggestions"
        this.forceSuggestions = false;
        // Drop-down menu will be replaced with text input at this number of distinct items
        this.suggestionCutoff = 100;
        this.caseInsensitiveSuggestions = false;
        this.ignoredInSearch = false;
        this.showFilterButton = true;
        this.showSortButton = true;
        this.index = 0;
        this.conditionalFormattingRules = [];
        this.dataTypeHint = null;
    }
}

Lani.TableFilterMode = {
    Equals: "=",
    GreaterThan: ">",
    LessThan: "<",
    StartsWith: "startswith",
    EndsWith: "endswith",
    Contains: "contains",
    Between: "between"
};

Lani.TableFilterCombineMode = {
    Or: "||",
    And: "&&"
};

Lani.TableFilter = class {
    constructor(column, comparison, value, combineMode = Lani.TableFilterCombineMode.And) {
        this.column = column;
        this.comparison = comparison;
        this.value = value;
        this.combineMode = combineMode;
        this.negated = false;
        this.caseSensitivity = false;
    }
    apply(data) {
        return data.filter(item => {
            let data = this.item[this.column];
            let type = typeof data;
            if (this.comparison == Lani.TableFilterMode.Equals) {
                if (type === "string" && !this.caseSensitivity)
                    return (!this.negated) && data.toLowerCase() == this.value.toLowerCase();
                else
                    return (!this.negated) && item[this.column] == this.value;
            }
        });
    }
}

Lani.TableConditionalFormatting = class {
    constructor() {

    }
    meetsCondition(row) {
        // to be overridden
    }
    format(cell) {
        // To be overridden
    }
}

Lani.TableSortDirection = {
    Ascending: 0,
    Descending: 1
};

Lani.TableSort = class {
    constructor(columnName, sortDirection = Lani.TableSortDirection.Descending) {
        this.columnName = columnName;
        this.direction = sortDirection;
    }
    compare(row1, row2) {
        if (row1[this.columnName] == row2[this.columnName]) return 0;
        else if (row1[this.columnName] > row2[this.columnName])
            return this.direction === Lani.TableSortDirection.Descending ? -1 : 1;
        else
            return this.direction === Lani.TableSortDirection.Descending ? 1 : -1;
    }
}

Lani.TableAnimationDirection = {
    Forwards: 0,
    Backwards: 1
};

Lani.TablePaginationAnimation = class {
    constructor(table){
        this.table = table;
        this.speed = 1.0;
    }
    animate(direction, oldPage, newPage){
        // To be overridden
    }
};

Lani.TablePageAnimations = {
    Fade: class extends Lani.TablePaginationAnimation {
        constructor(table){
            super(table);
        }
    },
    Shuffle: class extends Lani.TablePaginationAnimation {
        constructor(table){
            super(table);
        }
    }
}

window.addEventListener("load", Lani.tableLoadHandler);