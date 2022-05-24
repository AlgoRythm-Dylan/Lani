/*

    Paginator element

*/

Lani.PaginatorElement = class extends Lani.Element {
    constructor(){
        super();

        this.setup();
    }
    async setup(){
        await this.useTemplate(Lani.templatesPath(), "#lani-paginator");

        this.ready();
    }

    nextPage(){
        this.emit("lani::next-page");
    }
    lastPage(){
        this.emit("lani::last-page");
    }
    previousPage(){
        this.emit("lani::previous-page");
    }
    firstPage(){
        this.emit("lani::first-page");
    }

}

Lani.regEl("lani-paginator", Lani.PaginatorElement);