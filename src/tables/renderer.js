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

        let table = Lani.c("table");
        let head = this.renderHeaders();

        this.table.setBody(table);
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
        let headRow = Lani.c("tr");
        for(let column of this.table.columns){
            let cell = Lani.c("th");
            column.renderHeader(cell);
            headRow.appendChild(cell);
        }
        return head;
    }
    // See note on renderHeaders
    renderBody(){

    }
}