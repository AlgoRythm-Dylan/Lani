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
    render(row, cell){ }
}

Lani.TableColumn = class extends Lani.TableColumnBase {
    constructor(name, sourceName){
        super(name);
        this.sourceName = sourceName;
    }
    render(row, cell){
        cell.innerHTML = row[this.sourceName];
    }
}

Lani.TableColumnElement = class extends Lani.Element { }

Lani.regEl("lani-table-column", Lani.TableColumnElement);