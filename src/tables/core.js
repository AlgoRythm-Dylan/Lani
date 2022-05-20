/*

    Lani tables module

*/
Lani.installedModules.push("lani-tables");

Lani.tables = [];

Lani.TableElement = class extends Lani.Element {
    constructor(){
        super();
        this.table = new Lani.Table();
        this.table.id = this.id;
        if(this.id){
            Lani.tables.push(table);
        }
        let title = this.getAttribute("table-title");
        if(title)
            this.table.setTitle(title);
    }
};