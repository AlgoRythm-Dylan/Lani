/*

    Kinda a dev tool, ish

    to play around with SVG

*/

const L_DEFAULT_SVG = `<!-- Reference: https://developer.mozilla.org/en-US/docs/Web/SVG/Element -->

<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
     <circle cx="50" cy="50" r="5" fill="red" />
</svg>`;

Lani.SVGWriterElement = class extends Lani.Element {
    constructor(){
        super();

        this.writer = null;
        this.output = null;

        this.setup();
    }
    async setup(){
        await this.useDefaultTemplate("lani-svg-writer");

        this.writer = this.shadow.getElementById("writer");
        this.output = this.shadow.getElementById("output-container");

        this.writer.addEventListener("keydown", e => {
            if(e.key === "Enter" && e.ctrlKey){
                e.preventDefault();
                this.render();
            }
        });

        this.writer.value = L_DEFAULT_SVG;
        this.render();
    }
    render(){
        this.output.innerHTML = this.writer.value;
    }
}

Lani.regEl("lani-svg-writer", Lani.SVGWriterElement);