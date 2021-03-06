TextHelper.normalizeString = function (word) {
    return word.toLowerCase();
}
PoiIndex.prototype.indexObjects = function (objects) {
    this.objects = new Map();
    this.trie = new Trie();

    for (let i = 0; i < objects.length; i++) {
        const obj = {
            id: i,
            names: objects[i][0],
            coords: [[objects[i][1], objects[i][2]]]
        };
        this.objects.set(i, obj);
        this.indexObject(obj);
    }
}

window.onload = () => {
    poiIndex = new PoiIndex()
    poiIndex.anagramIndex = new AnagramIndex();
    if (!document.getElementById('map')) {
        updateLocation();
        setInterval(updateLocation, 5000);
    }
    loadData("cities");

    const searchInput = document.getElementById('search');
    searchInput.addEventListener('change', doSearch);
    searchInput.addEventListener('keyup', doSearch);
};
