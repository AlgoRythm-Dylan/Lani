/*

    Lani tables module

*/
Lani.installedModules.push("lani-tables");

Lani.TableColumnFormatting = class {
    constructor() {
        this.width = null;
        this.cellCasing = null;
        this.headerCasing = null;
        this.trimData = false;
        this.nullText = null;
        this.headerAlign = null;
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
        if(this.formatting.headerAlign !== null)
            cell.style.textAlign = this.formatting.headerAlign;
        cell.innerHTML = this.name;
    }
    render(row, cell){
        cell.innerHTML = row[this.sourceName];
    }
    renderGrouped(group, cell){
        cell.innerHTML = group.groupValue;
    }
}

Lani.TableColumnElement = class extends Lani.Element {
    get column(){
        // TODO: populate the members of the column
        let col = new Lani.TableColumn();
        col.name = this.getAttribute("name") ??
            (this.innerText === "" ? null : this.innerText);
        col.sourceName = this.getAttribute("source-name") ?? col.name;
        
        col.formatting.headerAlign = this.getAttribute("header-align");
        return col;
    }
}

Lani.regEl("lani-table-column", Lani.TableColumnElement);