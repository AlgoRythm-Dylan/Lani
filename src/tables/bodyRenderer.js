/*

    Default table body renderer

*/
Lani.TableBodyRenderer = class {
    constructor(table){
        this.table = table;
        this.lastRender = null;
    }
    render(data){
        // Data = Lani.DataSet
        // Can be grouped



        let body = Lani.create("tbody");
        for(let item of data.rows){
            let row = Lani.create("tr", { parent: body });
            for(let column of this.table.columns){
                let cell = Lani.create("td", { parent: row });
                column.render(item, cell);
            }
        }
        this.lastRender = body;
        return body;
    }
}