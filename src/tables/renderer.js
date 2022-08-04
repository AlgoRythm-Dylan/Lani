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
            let head = this.renderHeaders();
            tableEl.appendChild(head);
        }
        let tbody = this.renderBody(data);
        tableEl.appendChild(tbody);

        this.table.setBody(tableEl);
    }
    // This function is split up like this to follow good
    // code practices, not necessarily because this is
    // the base class and all TableRenderers should have
    // renderHeaders and renderBody functions (UNLIKE columns)
    renderHeaders(){
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
    renderBody(data){
        let tbody = Lani.create("tbody");
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
}