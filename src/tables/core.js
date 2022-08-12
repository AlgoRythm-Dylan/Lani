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
        this.style = null;
        this.headerStyle = null;
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

Lani.TableFormatter = class {
    format(row, cell) {}
    formatGrouped(group, cell) {}
}

Lani.Condition = class {
    isMet() { return true; }
}

Lani.ConditionalTableFormatter = class extends Lani.TableFormatter {
    constructor(){
        super();
        this.condition = null;
    }
    checkCondition(row){
        if(this.condition === null) return true;
        else if(this.condition instanceof Lani.Condition)
            return this.condition.isMet(row);
        else return this.condition(row);
    }
}

Lani.TableColumn = class extends Lani.TableColumnBase {
    constructor(name, sourceName, table=null){
        super(name);
        this.sourceName = sourceName;
        this.formatters = [];
        this.table = table;
    }
    getFormattingProperty(name){
        if(this.table !== null)
            return this.formatting[name] ?? this.table.columnFormatting[name];
        return this.formatting[name];
    }
    renderHeader(cell){
        let headerStyle = this.getFormattingProperty("headerStyle");
        if(headerStyle !== null)
            cell.style.cssText = headerStyle;
        let headerAlign = this.getFormattingProperty("headerAlign");
        if(headerAlign !== null)
            cell.style.textAlign = headerAlign;
        cell.innerHTML = this.name;
    }
    renderColGroup(){
        let col = Lani.c("col");
        if(this.formatting.style !== null) col.style.cssText = this.formatting.style;
        if(this.formatting.width !== null) col.style.width = this.formatting.width;
        return col;
    }
    render(data, cell){
        if(data.isAGroup){
            cell.innerHTML = data.groupValue;
        }
        else{
            cell.innerHTML = data[this.sourceName];
        }
        for(let formatter of this.formatters)
            if(formatter instanceof Lani.ConditionalTableFormatter){
                if(formatter.checkCondition(data))
                    formatter.format(data, cell);
            }
            else
                formatter.format(data, cell);
    }
}

Lani.TableColumnElement = class extends Lani.Element {
    get column(){
        // TODO: populate the members of the column
        let col = new Lani.TableColumn();
        col.name = this.getAttribute("name") ??
            (this.innerText === "" ? null : this.innerText);
        col.sourceName = this.getAttribute("source-name") ?? col.name;
        
        Lani.TableColumnElement.parseFormatting(this, col.formatting);
        
        return col;
    }
    static parseFormatting(element, formattingObject){
        formattingObject.headerAlign = element.getAttribute("header-align");
        formattingObject.width = element.getAttribute("width");
        formattingObject.style = element.getAttribute("style");
        formattingObject.headerStyle = element.getAttribute("header-style");
    }
}

Lani.regEl("lani-table-column", Lani.TableColumnElement);