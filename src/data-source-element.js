/*

    Declarative way to create and use a data source

*/

Lani.ElementEvents.DataDownloaded = "lani::data-downloaded";
Lani.ElementEvents.DataReady = "lani::data-ready";

Lani.DataSourceElement = class extends Lani.Element {
    constructor(){
        super();
        this.dataSource = null;
        this.dataReady = false;
    }
    connectedCallback(){
        this.setupNonDOM();

        let download = this.getAttribute("download");
    }
    async get(){
        return await this.dataSource.get();
    }
}

Lani.regEl("lani-data-source", Lani.DataSourceElement);