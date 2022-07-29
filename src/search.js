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
Lani.search.splitWords = str => str.match(/\b(\w+)'?(\w+)?\b/g);

Lani.search.levenshtein = (str1, str2) => {
    if(str1.length === 0)
        return str2.length;
    else if(str2.length === 0)
        return str1.length;
    if(str1[0] === str2[0])
        return Lani.search.levenshtein(Lani.search.levenshteinTail(str1), Lani.search.levenshteinTail(str2));
    else
        return 1 + Math.min(
            Lani.search.levenshtein(Lani.search.levenshteinTail(str1), str2),
            Lani.search.levenshtein(str1, Lani.search.levenshteinTail(str2)),
            Lani.search.levenshtein(Lani.search.levenshteinTail(str1), Lani.search.levenshteinTail(str2))
        );
}

Lani.search.levenshteinTail = str => {
    return str.slice(1);
}