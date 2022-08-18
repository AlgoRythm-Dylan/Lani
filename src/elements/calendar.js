Lani.installedModules.push("lani-calendar");

Lani.CalendarDimension = class {
    constructor(size=0){
        this.top = size;
        this.bottom = size;
        this.left = size;
        this.right = size;
    }
    get isNone(){
        return (this.top === null || this.top === 0) &&
            (this.bottom === null || this.bottom === 0) &&
            (this.left === null || this.left === 0) &&
            (this.right === null || this.right === 0);
    }
}

Lani.CalendarColor4 = class {
    constructor(color=null){
        this.top = color;
        this.bottom = color;
        this.left = color;
        this.right = color;
    }
    static toCSS(colorValue){
        if(colorValue === null)
            return "transparent";
        else
            return colorValue;
    }
}

Lani.CalendarFormatting = class {
    constructor(){
        this.backgroundColor = "white";
        this.width = null;
        this.height = null;

        this.outerBorderSize = new Lani.CalendarDimension();
        this.outerBorderMargin = new Lani.CalendarDimension();
        this.outerBorderPadding = new Lani.CalendarDimension();
        this.outerBorderColor = new Lani.CalendarColor4("black");

        this.titleBackgroundColor = null;
        this.titleForegroundColor = "black";
        this.titleForegroundSize = 1;
        this.titleForegroundBorderSize = new Lani.CalendarDimension();
        this.titleForegroundBorderColor = new Lani.CalendarColor4();
        this.titleMargin = new Lani.CalendarDimension();

        this.gridBackgroundColor = null;
        this.gridForegroundColor = "black";
        this.gridMargin = new Lani.CalendarDimension();
        this.gridOuterBorderSize = new Lani.CalendarDimension(1);
        this.gridInnerBorderSize = new Lani.CalendarDimension(1);
        this.gridOuterBorderColor = new Lani.CalendarColor4("black");
        this.gridInnerBorderColor = new Lani.CalendarColor4("black");
    }
}

Lani.Calendar = class {
    constructor(){
        
    }
}

Lani.CalendarElement = class extends Lani.Element {
    constructor(){
        super();
    }
    async connectedCallback(){
        await this.useStandardTemplate("lani-calendar");
    }
}

Lani.regEl("lani-calendar", Lani.CalendarElement);