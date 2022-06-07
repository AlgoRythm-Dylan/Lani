/*

    Default table body renderer

*/
Lani.TableBodyRenderer = class {
    constructor(table){
        this.table = table;
    }
    render(data){
        let body = Lani.create("tbody");
        for(let item of data){
            let row = Lani.create("tr", { parent: body });
            for(let column of this.table.columns){
                let cell = Lani.create("td", { parent: row });
                column.render(item, cell);
            }
        }
        return body;
    }
    measureColumns(body){

    }
}