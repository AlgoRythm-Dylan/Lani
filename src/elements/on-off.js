Lani.OnOffElement = class extends Lani.Element {
    constructor(){
        super();
        this.state = "on";
        this.onText = "ON";
        this.offText = "OFF";

        this.setup();
    }
    async setup(){
        await this.useDefaultTemplate("lani-on-off");
        this.shadow.getElementById("circle").addEventListener("click", e => {
            this.toggle();
        });

        this.state = this.getAttribute("state") ?? this.state;
        this.onText = this.getAttribute("on-text") ?? this.onText;
        this.offText = this.getAttribute("off-text") ?? this.offText;

        this.displayState();
    }
    toggle(){
        this.state = (this.state == "on" ? "off" : "on");
        this.displayState();
        this.emit(Lani.ElementEvents.StateChange, { state: this.state, element: this });
    }
    displayState(){
        if(this.state == "on"){
            this.shadow.getElementById("ring-outer").style.borderColor = "var(--lani-on-off-state-on)";
            this.shadow.querySelector("div#content p").innerHTML = this.onText;
        }
        else{
            this.shadow.getElementById("ring-outer").style.borderColor = "var(--lani-on-off-state-off)";
            this.shadow.querySelector("div#content p").innerHTML = this.offText;
        }
    }
}

Lani.regEl("lani-on-off", Lani.OnOffElement);