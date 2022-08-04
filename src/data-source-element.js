/*

    Declarative way to create and use a data source

*/

Lani.ElementEvents.DataDownloaded = "lani::data-downloaded";
Lani.ElementEvents.DataReady = "lani::data-ready";

// Handlers are just a function with the element passed in as an
// argument. This allows custom code to prepare the element and
// most importantly set the data source, reading information
// and attributes from the element that might be declared. By
// convention (the very same convention I just made up in my head),
// handlers should be lowercase ("download"). However there is
// no mechanism prohibiting you from naming a handler KJGSDUI^*(SDJH)
// so just try to be responsible if you're gonna write one of these
// (which I can see being a common thing since data is ridiculously
// generic) - it's case sensitive.
Lani.DataSourceElementHandlers = {};
Lani.DataSourceElementHandlers["download"] = element => {
    element.dataSource = new Lani.DownloadedDataSource(element.getAttribute("source"));
};

Lani.DataSourceElement = class extends Lani.Element {
    constructor(){
        super();
        this.dataSource = null;
        this.dataReady = false;
    }
    connectedCallback(){
        this.setupNonDOM();
        let dataSourceType = this.getAttribute("type");
        if(dataSourceType === null){
            console.warn("No data source type present, assuming \"download\"", this);
            dataSourceType = "download";
        }
        let handler = Lani.DataSourceElementHandlers[dataSourceType];
        if(!handler){
            console.error(`No handler found for data source element (type: {dataSourceType})`, this);
            return;
        }
        handler(this);
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