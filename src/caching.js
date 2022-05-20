/*

    Caching module

*/
Lani.installedModules.push("lani-caching");

Lani.CachedFetchMode = {
    Memory: "memory",
    LocalStorage: "localstorage"
};

Lani.defaultCachedFetchOptions = {
    mode: Lani.CachedFetchMode.Memory,
}

Lani.CachedFetch = class {
    constructor(url, fetchOptions, cacheOptions){
        this.url = url;
        this.fetchOptions = fetchOptions;
        this.cacheOptions = cacheOptions;
        this.timestamp = new Date().getTime();
    }
}

Lani.cachedFetch = async (url, fetchOptions, cacheOptions) => {

}