Lani.installedModules.push("lani-markdown");

Lani.Markdown = {};

Lani.Markdown.TokenType = {
    EOL: 0,          // End Of Line
    EOF: 1,          // End Of File
    Text: 2,         // Any text with no syntactical significance
    Header: 3,       // #
    TextStyle: 4,    // *
    Code: 5          // `
};

Lani.Markdown.Token = class {
    constructor(type=null, text=null){
        this.type = type;
        this.text = text;
        // DEBUG CODE - REMOVE FOR PROD
        this.DEBUG_TypeText = this.typeText;
    }
    get typeText(){
        for(let [key, val] of Object.entries(Lani.Markdown.TokenType))
            if(val === this.type)
                return key;
    }
}

Lani.Markdown.Tokenizer = class {
    constructor(source=null){
        this.source = source;
        this.reader = {
            seek: 0,
            text: ""
        };
        this.tokens = [];
    }
    readChar(){
        if(this.isEOF())
            return null;
        return this.source[this.reader.seek++];
    }
    isEOF(){
        return this.source === null || this.reader.seek === this.source.length;
    }
    resetText(){
        this.reader.text = "";
    }
    pushTextToken(){
        if(this.reader.text && this.reader.text.length)
            this.tokens.push(new Lani.Markdown.Token(Lani.Markdown.TokenType.Text, this.reader.text));
        this.resetText();
    }
    tokenize(){
        let char = null;
        this.resetText();
        while((char = this.readChar()) !== null){
            if(char === "\n"){
                // End of line - push the remaining text (if any) and an EOL token
                this.pushTextToken();
                this.tokens.push(new Lani.Markdown.Token(Lani.Markdown.TokenType.EOL, char));
            }
            else if(char === "*"){
                this.pushTextToken();
                this.tokens.push(new Lani.Markdown.Token(Lani.Markdown.TokenType.TextStyle, char));
            }
            else if(char === "#"){
                this.pushTextToken();
                this.tokens.push(new Lani.Markdown.Token(Lani.Markdown.TokenType.Header, char));
            }
            else if(char === "`"){
                this.pushTextToken();
                this.tokens.push(new Lani.Markdown.Token(Lani.Markdown.TokenType.Code, char));
            }
            else{
                this.reader.text += char;
            }
        }
        // Put any remaining text in a text token then end the document
        this.pushTextToken();
        this.tokens.push(new Lani.Markdown.Token(Lani.Markdown.TokenType.EOF));
    }
}

Lani.Markdown.SymbolType = {
    Text: 0,
    Header: 1,
    EOL: 2
}

Lani.Markdown.Symbol = class {
    constructor(type=null, text=null){
        this.type = type;
        this.text = text;
    }
}

Lani.Markdown.HeaderSymbol = class extends Lani.Markdown.Symbol {
    constructor(level=1){
        super(Lani.Markdown.SymbolType.Header);
        this.level = level;
    }
}

Lani.Markdown.Parser = class {
    constructor(tokenizer){
        this.tokenizer = tokenizer;
        this.reader = {
            seek: 0,
            peek: 0,
            lookBack: 0
        }
        this.lines = [];
        this.currentLine = [];
    }
    isEOF(){
        return this.reader.seek + this.reader.peek === this.tokenizer.tokens.length;
    }
    reset(){
        this.lines = [];
        this.reader.seek = 0;
        this.resetLookBack();
        this.resetPeek();
    }
    resetLookBack(){
        this.reader.lookBack = 0;
    }
    resetPeek(){
        this.reader.peek = 0;
    }
    nextToken(){
        this.resetPeek();
        this.resetLookBack();
        if(this.isEOF())
            return null;
        let token = this.tokenizer.tokens[this.reader.seek];
        this.reader.seek++;
        return token;
    }
    peekToken(){
        if(this.isEOF(true))
            return null;
        let token = this.tokenizer.tokens[this.reader.seek + this.reader.peek];
        this.reader.peek++;
        return token;
    }
    unpeek(){
        this.reader.peek -= 1;
    }
    goToPeek(){
        this.reader.seek += this.reader.peek;
        this.reader.peek = 0;
    }
    prevToken(){
        this.reader.lookBack++;
        if(this.tokenizer.tokens.length + this.reader.lookBack < 0)
            return null;
    }
    addTextSymbol(content){
        if(this.currentLine.length && this.currentLine[this.currentLine.length - 1].type === Lani.Markdown.SymbolType.Text)
            this.currentLine[this.currentLine.length - 1].text += content;
        else
            this.currentLine.push(new Lani.Markdown.Symbol(Lani.Markdown.SymbolType.Text, content));
    }
    finalizeLine(){
        this.currentLine.push(new Lani.Markdown.Symbol(Lani.Markdown.SymbolType.EOL));
        this.lines.push(this.currentLine);
        this.currentLine = [];
    }
    parse(){
        this.reset();
        this.currentLine = [];
        let eof = false;
        while(!eof){
            let token = this.nextToken();
            if(token.type === Lani.Markdown.TokenType.Header){
                if(this.currentLine.length === 0){
                    let level = 1;
                    while(this.peekToken().type === Lani.Markdown.TokenType.Header && level < 6)
                        level++;
                    // If we found any more header tokens, digest them
                    if(level > 1){
                        // Supposedly, we went 1 too far (peeked a token that wasn't a  header)
                        this.unpeek();
                        this.goToPeek();
                    }
                    this.currentLine.push(new Lani.Markdown.HeaderSymbol(level));
                }
                else{
                    this.addTextSymbol("#");
                }
            }
            else if(token.type === Lani.Markdown.TokenType.Text){
                this.addTextSymbol(token.text);
            }
            else if(token.type === Lani.Markdown.TokenType.EOL){
                this.finalizeLine();
            }
            else if(token.type === Lani.Markdown.TokenType.EOF){
                this.finalizeLine();
                eof = true;
            }
        }
    }
}

Lani.Markdown.UnclosedLineTag = class {
    constructor(symbolMatch=null, closeTag=null){
        this.symbolMatch = symbolMatch;
        this.closeTag = closeTag;
    }
}

Lani.Markdown.Renderer = class {
    constructor(parser=null){
        this.parser = parser;
    }
    toHTML(){
        let output = "";
        let unclosedLineTags = [];
        let i = 0;
        for(let line of this.parser.lines){
            let isFirstSymbol = unclosedLineTags.length === 0;
            for(let symbol of line){
                if(symbol.type === Lani.Markdown.SymbolType.Header){
                    output += `<h${symbol.level}>`;
                    unclosedLineTags.push(new Lani.Markdown.UnclosedLineTag(null, `</h${symbol.level}>`));
                }
                else if(symbol.type === Lani.Markdown.SymbolType.Text){
                    if(isFirstSymbol){
                        output += `<p>${symbol.text}`;
                        unclosedLineTags.push(new Lani.Markdown.UnclosedLineTag(Lani.Markdown.SymbolType.Text, "</p>"))
                    }
                    else{
                        output += symbol.text;
                    }
                }
                else if(symbol.type === Lani.Markdown.SymbolType.EOL){
                    // Check if we are continuing a paragraph on the next line
                    let continueLine = line[0].type === Lani.Markdown.SymbolType.Text;
                    let hasNextLine = i < this.parser.lines.length - 1;
                    if(hasNextLine){
                        let nextLine = this.parser.lines[i + 1];
                        continueLine &&= nextLine[0].type === Lani.Markdown.SymbolType.Text;
                    }
                    else{
                        continueLine = false;
                    }
                    // Close line tags
                    let currentUnclosedTag;
                    while(currentUnclosedTag = unclosedLineTags.pop()){
                        if(continueLine && currentUnclosedTag.symbolMatch === Lani.Markdown.SymbolType.Text){
                            unclosedLineTags.push(currentUnclosedTag);
                            break;
                        }
                        output += currentUnclosedTag.closeTag;
                    }
                    output += "\n";
                }
                isFirstSymbol = false;
            }
            i++;
        }
        return output;
    }
}

Lani.Markdown.from = source => {
    let tokenizer = new Lani.Markdown.Tokenizer(source);
    tokenizer.tokenize();
    let parser = new Lani.Markdown.Parser(tokenizer);
    parser.parse();
    return new Lani.Markdown.Renderer(parser);
}

Lani.RenderMarkdown = source => {
    return Lani.Markdown.from(source).toHTML();
}