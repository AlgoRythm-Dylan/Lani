/*

    Lani "Arc" data element

*/
Lani.requireModule("lani-svg");

Lani.ArcElement = class extends Lani.DataElement {
    constructor(){
        super();

        this.setup();

        this.svg = null;
        this.background = null;
        this.foreground = null;
    }
    async setup(){
        await this.useDefaultTemplate("lani-arc");

        this.svg = this.shadow.querySelector("svg");
        this.background = this.shadow.getElementById("background");
        this.foreground = this.shadow.getElementById("foreground");

        this.updateValue(50);
    }
    updateValue(percentage){
        let circumference = Lani.circumference(parseFloat(this.background.getAttribute("r")))

        this.background.setAttribute("stroke-dasharray", circumference);
        this.foreground.setAttribute("stroke-dasharray", circumference);

        this.background.style.strokeDashoffset = (circumference / 2) * (1 + (percentage / 100));
        this.background.style.transform = `rotate(${-180 + (180 * (percentage / 100))}deg)`;
        this.foreground.style.strokeDashoffset = (circumference / 2) * (1 + ((100 - percentage) / 100));
    }
}

Lani.regEl("lani-arc", Lani.ArcElement);