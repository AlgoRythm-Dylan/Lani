/*

    Lani "Arc" data element

*/
Lani.requireModule("lani-svg");

Lani.ArcElement = class extends Lani.DataElement {
    constructor(){
        super();

        this.setup();

        this.svg = null;
        this.arc = null;
    }
    async setup(){
        await this.useDefaultTemplate("lani-arc");

        this.svg = this.shadow.querySelector("svg");
        this.displayArc = Lani.create("arc", { parent: svg } );
        this.progressArc = Lani.create("arc", { parent: svg } );
    }
    updateValue(percentage){

    }
}

Lani.regEl("lani-arc", Lani.ArcElement);