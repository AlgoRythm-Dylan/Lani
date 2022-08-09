/*

    Default table body renderer

*/
Lani.TableRenderer = class {
    constructor(table){
        this.table = table;
    }
    // Data is a Lani.DataSet
    render(data){
        if(this.table.columns.length === 0)
            return; // What do you want me to do about it??

        let tableEl = Lani.c("table", "l-table");
        if(this.table.renderHeaders){
            let head = this.#renderHeaders();
            tableEl.appendChild(head);
        }
        let tbody = this.#renderBody(data);
        tableEl.appendChild(tbody);

        this.table.setBody(tableEl);
    }
    // This function is split up like this to follow good
    // code practices, not necessarily because this is
    // the base class and all TableRenderers should have
    // renderHeaders and renderBody functions (UNLIKE columns)
    #renderHeaders(){
        // I know Lani.c isn't readable but it's just so short
        // and using it really takes the edge off dynamically
        // creating lines and lines of HTML elements. Sorry.

        // Lani.c =~ Lani.create
        let head = Lani.c("thead");
        let headRow = Lani.c("tr", null, head);
        for(let column of this.table.columns){
            let cell = Lani.c("th", null, headRow);
            column.renderHeader(cell);
        }
        return head;
    }
    // See note on renderHeaders
    #renderBody(data){
        if(data.isGrouped)
            return this.#renderGroupedBody(data);
        
        let tbody = Lani.c("tbody");
        for(let dataRow of data.rows){
            let row = Lani.c("tr");
            for(let column of this.table.columns){
                let cell = Lani.c("td");
                column.render(dataRow.data, cell);
                row.appendChild(cell);
            }
            tbody.appendChild(row);
        }
        return tbody;
    }
    // This is more complex than just rendering the body so
    // it has been organized out into this alternative method
    // This takes advantage of the rowspan attribute
    // of a <td>. Basically, if a <td> has a rowspan of 2 or
    // more, that <td> is automatically "filled in" in the
    // next <tr>. This function will likely need to be recursive
    #renderGroupedBody(data){
        let tbody = Lani.c("tbody");
        for(let group of data.rows){
            this.#renderGroupedPartial(tbody, 0, group);
        }
        return tbody;
    }
    #renderGroupedPartial(body, columnIndex, data, rowToContinue=null){
        if(data.isAGroup){
            // Create cell, give it rowspan, recurse with rowToContinue
            let row = rowToContinue ?? Lani.c("tr", null, body);
            let cell = Lani.c("td", null, row);
            cell.rowSpan = data.count;
            let column = this.table.columns[columnIndex];
            column.renderGrouped(data, cell);
            let continueRow = true;
            for(let group of data.rows){
                this.#renderGroupedPartial(body, columnIndex + 1, group, continueRow ? row : null);
                continueRow = false;
            }
        }
        else if(data.isGrouped){
            for(let group of data.rows){
                this.#renderGroupedPartial(body, columnIndex, group, rowToContinue)
            }
        }
        else{
            let row = rowToContinue ?? Lani.c("tr", null, body);
            // Render out all the remaining rows
            for(let i = columnIndex; i < this.table.columns.length; i++){
                let column = this.table.columns[i];
                let cell = Lani.c("td", null, row);
                column.render(data.data, cell)
            }
        }
    }
}