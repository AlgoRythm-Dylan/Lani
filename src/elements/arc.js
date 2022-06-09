/*

    Lani "Arc" data element

*/
Lani.requireModule("lani-svg");

Lani.ArcElement = class extends Lani.DataElement {
    constructor(){
        super();

        this.setup();

        this.svg = null;
        this.backgroundArc = null;
        this.foregroundArc = null;
    }
    async setup(){
        await this.useDefaultTemplate("lani-arc");

        this.svg = this.shadow.querySelector("svg");
        this.backgroundArc = this.shadow.getElementById("background-arc");
        this.foregroundArc = this.shadow.getElementById("foreground-arc");
    }
    updateValue(percentage){

    }
}

Lani.regEl("lani-arc", Lani.ArcElement);