/*

    Declarative way to create and use a data source

*/

Lani.ElementEvents.DataDownloaded = "lani::data-downloaded";
Lani.ElementEvents.DataReady = "lani::data-ready";

// TODO: make extensible with handlers
Lani.DataSourceElement = class extends Lani.Element {
    constructor(){
        super();
        this.dataSource = null;
        this.dataReady = false;
    }
    connectedCallback(){
        this.setupNonDOM();

        let download = this.getAttribute("download");
        if(download !== null){
            this.downloadDataSource(download);
        }
        // Pickup fetched data sources, local data sources, etc here.
    }
    // TODO: this is poor
    async downloadDataSource(path){
        this.dataSource = new Lani.DownloadedDataSource(path);
    }
    dataReady(){
        this.dataReady = true;
        this.emit(Lani.ElementEvents.DataReady);
    }
    dataDownloaded(){
        this.dataReady();
        this.emit(Lani.ElementEvents.DataReady);
    }
    async get(){
        return await this.dataSource.get();
    }
}

Lani.regEl("lani-data-source", Lani.DataSourceElement);