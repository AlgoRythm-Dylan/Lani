Lani.search = {};

Lani.search.exact = (term, dataSet) => {
    return dataSet.filter(item => item === term);
}

Lani.search.includes = (term, dataSet, caseInsensitive=true) => {
    if(caseInsensitive){
        let lowerTerm = term.toLowerCase();
        return dataSet.filter(item => item.toLowerCase().includes(lowerTerm));
    }
}

Lani.search.splitWords = str => str.match(/\b(\w+)'?(\w+)?\b/);

Lani.search.levenshtein = (str1, str2) => {

}