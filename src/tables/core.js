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

Lani.TableColumnBase = class {
    constructor(name){
        this.formatting = new Lani.TableColumnFormatting();
        this.name = name;
    }
    renderHeader(cell){ }
    render(row, cell){ }
}

Lani.TableColumn = class extends Lani.TableColumnBase {
    constructor(name, sourceName){
        super(name);
        this.sourceName = sourceName;
    }
    renderHeader(cell){
        cell.innerHTML = this.name;
    }
    render(row, cell){
        cell.innerHTML = row[this.sourceName];
    }
}

Lani.TableColumnElement = class extends Lani.Element {
    get column(){
        // TODO: populate the members of the column
        let col = new Lani.TableColumn();
        col.name = this.getAttribute("name");
        col.sourceName = this.getAttribute("source-name") ??
                            (this.innerText === "" ? null : this.innerText);
        return col;
    }
}

Lani.regEl("lani-table-column", Lani.TableColumnElement);