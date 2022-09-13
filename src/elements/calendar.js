Lani.installedModules.push("lani-calendar");

Lani.CalendarLib = {};

Lani.CalendarColor4 = class {
    constructor(color=null){
        this.all = color;
    }
    set all(value){
        this.top = value;
        this.bottom = value;
        this.left = value;
        this.right = value;
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

Lani.CALENDAR_FMT_VERSION = 1;

Lani.CalendarFormatting = class {
    constructor(){
        this.version = Lani.CALENDAR_FMT_VERSION;

        this.backgroundColor = "white";
        this.width = "11in";
        this.height = "8.5in";

        this.outerBorderSize = new Lani.Dimension(0);
        this.outerBorderMargin = new Lani.Dimension(0);
        this.outerBorderPadding = new Lani.Dimension(0);
        this.outerBorderColor = new Lani.CalendarColor4("black");

        this.showTitle = true;
        this.titleBackgroundColor = "#f54242";
        this.titleForegroundColor = "white";
        this.titleSize = 1;
        this.titleFont = new Lani.Font();
        this.titleFont.size = "4rem";
        this.titleBorderSize = new Lani.Dimension();
        this.titleBorderColor = new Lani.CalendarColor4();
        this.titleMargin = new Lani.Dimension(2);

        this.gridBackgroundColor = null;
        this.gridForegroundColor = "black";
        this.gridMargin = new Lani.Dimension(10);
        this.gridSize = 5;
        this.gridOuterBorderSize = new Lani.Dimension(1);
        this.gridInnerBorderSize = 1;
        this.gridOuterBorderColor = new Lani.CalendarColor4("lightgray");
        this.gridInnerBorderColor = "lightgray";

        this.showDaysRow = true;
        this.dayGridBackgroundColor = null;
        this.dayGridForegroundColor = "black";
        this.dayGridFont = new Lani.Font();
        this.dayGridFont.size = "1rem";
        this.dayGridFont.isBold = true;
        this.dayGridInnerBorderColor = null;
        this.dayGridBottomBorderColor = "lightgray";
        this.dayGridBottomBorderSize = 1;

        this.gridCellPadding = new Lani.Dimension(2);
        this.showDayNumbers = true;
        this.showDayNumbersForOtherMonths = true;

    }
}

Lani.CalendarCellFormatting = class {
    constructor(){
        this.version = Lani.CALENDAR_FMT_VERSION;

        this.dayNumberFont = new Lani.Font();
        this.dayNumberFont.size = "1rem";
        this.dayNumberMargin = new Lani.Dimension(3);
        this.dayNumberPadding = new Lani.Dimension(3);
        this.dayNumberForegroundColor = null;
        this.dayNumberBackgroundColor = null;
        this.dayNumberRounding = new Lani.Corners(3);

    }
}

Lani.CalendarEventFormatting = class {
    constructor(){
        this.version = Lani.CALENDAR_FMT_VERSION;
    }
}

Lani.CalendarEvent = class {
    constructor(){
        this.formatting = new Lani.CalendarEventFormatting();
        this.content = "(new event)";
        this.contentType = "text/plain";
    }
}

Lani.CalendarDay = class {
    constructor(){
        this.events = [];
        this.formatting = null;
    }
}

Lani.Calendar = class {
    constructor(){
        let date = new Date();
        this.setDate(date.getFullYear(), date.getMonth() + 1);

        this.title = null;
        // free-form object of variables for the calendar
        this.resources = {"subTitle": null};

        this.formatting = new Lani.CalendarFormatting();
        this.defaultCellFormatting = new Lani.CalendarCellFormatting();
        this.defaultWeekendCellFormatting = new Lani.CalendarCellFormatting();
        this.defaultWeekendCellFormatting.dayNumberForegroundColor = "red";
        this.defaultEventFormatting = new Lani.CalendarEventFormatting();
    }
    createDaysArray(){
        this.days = new Array(Lani.calendarRowsForMonth(this.year, this.month) * 7);
        for(let i = 0; i < this.days.length; i++){
            this.days[i] = new Lani.CalendarDay();
        }
    }
    // The "days" array also (potentially) contains the last few days of the previous
    // month, and the first few days of the next month. This is because a calendar
    // (one that you would hang on you office wall) generally does this, and keeping
    // them in memory like this makes it easy to add events to even days that don't
    // happen this month (this helps in situations where you're doing something 
    // *tomorrow*, but tomorrow is next month)
    getDayOfMonth(day){
        return this.days[day + firstDayOfMonth(this.year, this.month)];
    }
    setDate(year=null, month=null){
        if(year !== null)
            this.year = year;
        if(month !== null)
            this.month = month;
        this.createDaysArray();
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

/*

    This one warrants some explanation...

    So this is a combination of a JavaScript hack(?)
    and the fact that Lani uses 1-based months,
    as opposed to JS, which uses 0-based months.

    The generic solution to this issue is to pass in
    the index of the **next** month to the date
    constructor and use 0 as the day:

    https://stackoverflow.com/questions/1184334/get-number-days-in-a-specified-month-using-javascript

    HOWEVER, since Lani uses 1 = January, we can keep
    it as-is

*/
Lani.daysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
}

Lani.firstDayOfMonth = (year, month) => {
    return new Date(year, month - 1).getDay();
}

Lani.calendarRowsForMonth = (year, month, endOfWeekDay=6) => {
    month--;
    let days = Lani.daysInMonth(year, month);
    let rows = 0;
    let i = 0;
    while(i < days){
        i++;
        let thisDate = new Date(year, month, i);
        if(thisDate.getDay() === endOfWeekDay || i == days)
            rows++;
        // Small optimization to skip forwards. We don't care
        // about non-Saturdays. Saves 6 cycles per week.
        if(thisDate.getDay() === endOfWeekDay && (days - i) > 7)
            i += 6;
    }
    return rows;
}

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

        if(this.formatting.showTitle === true){
            titleContainer.style.display = "flex";
            titleContainer.style.flex = this.formatting.titleSize;
            titleContainer.style.background = this.formatting.titleBackgroundColor ?? "none";
            this.formatting.titleBorderColor.applyToBorder(titleContainer);
            this.formatting.titleBorderSize.applyToBorder(titleContainer);
    
            let title = this.shadow.getElementById("title");
            title.style.color = this.formatting.titleForegroundColor ?? "transparent";
            this.formatting.titleFont.apply(title);
        }
        else{
            titleContainer.style.display = "none";
        }

        let gridContainer = this.shadow.getElementById("grid-container");
        gridContainer.style.flex = this.formatting.gridSize;
        this.formatting.gridMargin.applyToMargin(gridContainer);
        this.formatting.gridOuterBorderSize.applyToBorder(gridContainer);
        this.formatting.gridOuterBorderColor.applyToBorder(gridContainer);

        let grid = this.populateGrid();

    }

    populateGrid(){
        let table = this.shadow.getElementById("grid");
        table.innerHTML = "";

        let i = 0;
        if(this.formatting.showDaysRow){
            let head = Lani.c("thead", null, table);
            let row = Lani.c("tr", null, head);
            for(let day of Lani.CalendarDays){
                let cell = Lani.c("th", null, row, {innerHTML: Lani.initCap(day)});
                cell.style.background = this.formatting.dayGridBackgroundColor ?? "none";
                cell.style.color = this.formatting.dayGridForegroundColor;
                this.formatting.dayGridFont.apply(cell);
                if(this.formatting.dayGridBottomBorderSize !== null)
                    cell.style.borderBottomWidth = Lani.genericDimension(this.formatting.dayGridBottomBorderSize);
                cell.style.borderBottomColor = this.formatting.dayGridBottomBorderColor ?? "transparent";

                if(i !== 0){
                    cell.style.borderLeftColor = this.formatting.dayGridInnerBorderColor ??
                        this.formatting.gridInnerBorderColor ?? "transparent";
                    cell.style.borderLeftWidth = Lani.genericDimension(this.formatting.gridInnerBorderSize);
                }
                if(i < 6){
                    cell.style.borderRightColor = this.formatting.dayGridInnerBorderColor ??
                        this.formatting.gridInnerBorderColor ?? "transparent";
                    cell.style.borderRightWidth = Lani.genericDimension(this.formatting.gridInnerBorderSize);
                }
                i++;
            }
        }

        let body = Lani.c("tbody", null, table);
        let rows = Lani.calendarRowsForMonth(this.calendar.year, this.calendar.month);
        let firstDayOfMonth = Lani.firstDayOfMonth(this.calendar.year, this.calendar.month);

        let daysInLastMonth = Lani.daysInMonth(this.calendar.year, this.calendar.month - 1);
        let daysInMonth = Lani.daysInMonth(this.calendar.year, this.calendar.month);


        for(let rowInd = 0; rowInd < rows; rowInd++){
            let row = Lani.c("tr", null, body);
            for(let i = 0; i < 7; i++){
                let thisDayOfMonth = (rowInd * 7) + i - (firstDayOfMonth - 1);

                let actualDay = new Date(this.calendar.year, this.calendar.month - 1, thisDayOfMonth);
                let isWeekend = actualDay.getDay() == 0 || actualDay.getDay() == 6;

                let dayFormatting;
                if(isWeekend){
                    dayFormatting = Lani.typedCoalescedObjectGet([
                        this.calendar.days[i].formatting,
                        this.calendar.defaultWeekendCellFormatting,
                        this.calendar.defaultCellFormatting
                    ], Lani.CalendarCellFormatting);

                    dayFormatting.dayNumberFont = Lani.typedCoalescedObjectGet([
                        this.calendar.days[i].formatting?.dayNumberFont,
                        this.calendar.defaultWeekendCellFormatting?.dayNumberFont,
                        this.calendar.defaultCellFormatting?.dayNumberFont
                    ], Lani.Font);
                }
                else{
                    dayFormatting = Lani.typedCoalescedObjectGet([
                        this.calendar.days[i].formatting,
                        this.calendar.defaultCellFormatting
                    ], Lani.CalendarCellFormatting);
                }

                let cell = Lani.c("td", null, row);
                let dayLabel = null;
                this.formatting.gridCellPadding.applyToPadding(cell);
                if(rowInd === 0) {
                    // The first row
                    if(thisDayOfMonth > 0){
                        if(this.formatting.showDayNumbers)
                            dayLabel = Lani.c("p", "day-label", cell, {innerHTML: thisDayOfMonth});
                    }
                    else{
                        if(this.formatting.showDayNumbers && this.formatting.showDayNumbersForOtherMonths){
                            dayLabel = Lani.c("p", "day-label", cell, {innerHTML: daysInLastMonth + thisDayOfMonth});
                            cell.className += " not-this-month";
                        }
                    }

                    if(i !== 0){
                        cell.style.borderLeftWidth = Lani.genericDimension(this.formatting.gridInnerBorderSize);
                        cell.style.borderLeftColor = this.formatting.gridInnerBorderColor;
                    }
                    // Bottom border
                    cell.style.borderBottomWidth = Lani.genericDimension(this.formatting.gridInnerBorderSize);
                    cell.style.borderBottomColor = this.formatting.gridInnerBorderColor;
                    if(i < 6){
                        cell.style.borderRightWidth = Lani.genericDimension(this.formatting.gridInnerBorderSize);
                        cell.style.borderRightColor = this.formatting.gridInnerBorderColor;
                    }

                }
                else if(rowInd === rows - 1){
                    // The last row
                    if(thisDayOfMonth <= daysInMonth){
                        if(this.formatting.showDayNumbers)
                            dayLabel = Lani.c("p", "day-label", cell, {innerHTML: thisDayOfMonth});
                    }
                    else {
                        if(this.formatting.showDayNumbers && this.formatting.showDayNumbersForOtherMonths){
                            dayLabel = Lani.c("p", "day-label", cell, {innerHTML: thisDayOfMonth - daysInMonth});
                            cell.className += " not-this-month";
                        }
                    }

                    if(i !== 0){
                        cell.style.borderLeftWidth = Lani.genericDimension(this.formatting.gridInnerBorderSize);
                        cell.style.borderLeftColor = this.formatting.gridInnerBorderColor;
                    }
                    if(i < 6){
                        cell.style.borderRightWidth = Lani.genericDimension(this.formatting.gridInnerBorderSize);
                        cell.style.borderRightColor = this.formatting.gridInnerBorderColor;
                    }

                }
                else {
                    // All middle rows
                    if(this.formatting.showDayNumbers)
                        dayLabel = Lani.c("p", "day-label", cell, {innerHTML: thisDayOfMonth});
                    // Left side border
                    if(i !== 0){
                        cell.style.borderLeftWidth = Lani.genericDimension(this.formatting.gridInnerBorderSize);
                        cell.style.borderLeftColor = this.formatting.gridInnerBorderColor;
                    }
                    // Bottom border
                    cell.style.borderBottomWidth = Lani.genericDimension(this.formatting.gridInnerBorderSize);
                    cell.style.borderBottomColor = this.formatting.gridInnerBorderColor;
                    // Right side border
                    if(i < 6){
                        cell.style.borderRightWidth = Lani.genericDimension(this.formatting.gridInnerBorderSize);
                        cell.style.borderRightColor = this.formatting.gridInnerBorderColor;
                    }
                }
                if(dayLabel !== null){

                    dayFormatting.dayNumberFont.apply(dayLabel);
                    dayFormatting.dayNumberMargin.applyToMargin(dayLabel);
                    dayFormatting.dayNumberPadding.applyToPadding(dayLabel);
                    dayFormatting.dayNumberRounding.applyToBorderRadius(dayLabel);
                    dayLabel.style.backgroundColor = dayFormatting.dayNumberBackgroundColor ?? "transparent";
                    dayLabel.style.color = dayFormatting.dayNumberForegroundColor;

                }

            }
        }

        return table;
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