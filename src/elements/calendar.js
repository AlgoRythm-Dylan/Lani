Lani.installedModules.push("lani-calendar");

Lani.CalendarDimension = class {
    constructor(size=0){
        this.all = size;
    }
    applyToMargin(element){
        element.style.marginTop = `${this.top}px`;
        element.style.marginBottom = `${this.bottom}px`;
        element.style.marginLeft = `${this.left}px`;
        element.style.marginRight = `${this.right}px`;
    }
    applyToPadding(element){
        element.style.paddingTop = `${this.top}px`;
        element.style.paddingBottom = `${this.bottom}px`;
        element.style.paddingLeft = `${this.left}px`;
        element.style.paddingRight = `${this.right}px`;
    }
    applyToBorder(element){
        element.style.borderTopWidth = `${this.top}px`;
        element.style.borderBottomWidth = `${this.bottom}px`;
        element.style.borderLeftWidth = `${this.left}px`;
        element.style.borderRightWidth = `${this.right}px`;
    }
    set all(value){
        this.top = value;
        this.bottom = value;
        this.left = value;
        this.right =  value;
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
        this.all = color;
    }
    set all(value){
        this.top = value;
        this.bottom = value;
        this.left = value;
        this.right =  value;
    }
    applyToBorder(element){
        element.style.borderTopColor = Lani.CalendarColor4.toCSS(this.top);
        element.style.borderBottomColor = Lani.CalendarColor4.toCSS(this.bottom);
        element.style.borderLeftColor = Lani.CalendarColor4.toCSS(this.left);
        element.style.borderRightColor = Lani.CalendarColor4.toCSS(this.right);
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
        this.width = "11in";
        this.height = "8.5in";

        this.outerBorderSize = new Lani.CalendarDimension(2);
        this.outerBorderMargin = new Lani.CalendarDimension(2);
        this.outerBorderPadding = new Lani.CalendarDimension(2);
        this.outerBorderColor = new Lani.CalendarColor4("black");

        this.titleBackgroundColor = "lightblue";
        this.titleForegroundColor = "black";
        this.titleSize = 1;
        this.titleFontSize = "4rem";
        this.titleFont = null;
        this.titleBorderSize = new Lani.CalendarDimension();
        this.titleBorderColor = new Lani.CalendarColor4();
        this.titleMargin = new Lani.CalendarDimension(2);

        this.gridBackgroundColor = null;
        this.gridForegroundColor = "black";
        this.gridMargin = new Lani.CalendarDimension();
        this.gridSize = 5;
        this.gridOuterBorderSize = new Lani.CalendarDimension(1);
        this.gridInnerBorderSize = new Lani.CalendarDimension(1);
        this.gridOuterBorderColor = new Lani.CalendarColor4("black");
        this.gridInnerBorderColor = new Lani.CalendarColor4("black");

        this.showDaysRow = true;
    }
}

Lani.Calendar = class {
    constructor(){
        let date = new Date();
        this.month = date.getMonth() + 1;
        this.year = date.getFullYear();

        this.title = null;
        // free-form object of text variables for the calendar
        this.textResources = {"subTitle": null};

        this.formatting = new Lani.CalendarFormatting();
    }
}

Lani.CalendarDays = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
]

Lani.CalendarDaysShort = [
    "sun",
    "mon",
    "tues",
    "wed",
    "thurs",
    "fri",
    "sat"
]

Lani.CalendarDaysAbbr = [ "su", "m", "t", "w", "th", "f", "sa" ];

Lani.CalendarMonths = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december"
]

Lani.CalendarMonthsShort = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec"
]

Lani.CalendarElement = class extends Lani.Element {
    constructor(){
        super();
        this.calendar = new Lani.Calendar();
    }
    get formatting(){
        return this.calendar.formatting;
    }
    async connectedCallback(){
        await this.useDefaultTemplate("lani-calendar");

        let title = this.getAttribute("calendar-title");
        if(title)
            this.title = title;

        this.applyFormatting();
    }

    applyFormatting(){
        this.style.background = this.formatting.backgroundColor;
        this.style.width = this.formatting.width;
        this.style.height = this.formatting.height;

        let container = this.shadow.getElementById("container");
        this.formatting.outerBorderMargin.applyToMargin(container);
        this.formatting.outerBorderPadding.applyToPadding(container);
        this.formatting.outerBorderSize.applyToBorder(container);

        let titleContainer = this.shadow.getElementById("title-container");
        titleContainer.style.flex = this.formatting.titleSize;
        titleContainer.style.background = this.formatting.titleBackgroundColor ?? "none";
        this.formatting.titleBorderColor.applyToBorder(titleContainer);
        this.formatting.titleBorderSize.applyToBorder(titleContainer);

        let title = this.shadow.getElementById("title");
        title.style.color = this.formatting.titleForegroundColor;
        if(this.formatting.titleFont)
            title.style.fontFamily = this.formatting.titleFont;
        title.style.fontSize = this.formatting.titleFontSize;

        let gridContainer = this.shadow.getElementById("grid-container");
        gridContainer.style.flex = this.formatting.gridSize;

        this.populateGrid();

    }

    populateGrid(){
        let table = this.shadow.getElementById("day-grid");
        table.innerHTML = "";

        if(this.formatting.showDaysRow){
            let head = Lani.c("thead", null, table);
            let row = Lani.c("tr", null, head);
            for(let day of Lani.CalendarDays){
                Lani.c("th", null, row, {innerHTML: Lani.initCap(day)});
            }
        }

        let body = Lani.c("tbody", null, table);

    }

    set title(value){
        this.calendar.title = value;
        this.shadow.getElementById("title").innerHTML = value;
    }
    get title(){
        return this.calendar.title;
    }
}

Lani.regEl("lani-calendar", Lani.CalendarElement);