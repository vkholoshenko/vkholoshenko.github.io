
function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

function setIntersection(sets) {
    if (sets.length === 0) return new Set();
    const intersection = new Set(sets[0]);
    for (let i = 1; i < sets.length; i++) {
        for (let elem of intersection) {
            if (!sets[i].has(elem)) {
                intersection.delete(elem);
            }
        }
    }
    return intersection;
}

class PoiIndex {
    constructor() {
        /**
         * @type {PoiIndex}
         */
        this.anagramIndex = null;
    }
    indexObjects(objects) {
        this.objects = new Map();
        this.trie = new Trie();

        for (const obj of objects) {
            this.objects.set(obj.id, obj);
            this.indexObject(obj);
        }
    }

    distanceInM(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);  // deg2rad below
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d * 1000;
    }

    indexObject(object) {
        const objectId = object.id;
        let words = [...new Set(mapcat(TextHelper.textToNormalizedWords, object.names))];
        for (const word of words) {
            this.trie.addWord(word, objectId);
            if (this.anagramIndex !== null) {
                this.anagramIndex.add(objectId, word);
            }
        }
    }

    search(searchString, lat, lon) {
        if (searchString.trim().length === 0) return [];

        let result = this.sort(this.filter(searchString), lat, lon);
        if (result.length === 0 && this.anagramIndex !== null) {
            let result2 = [];
            const found = new Set(result);
            this.anagramIndex.search(searchString).forEach(v => {
                if (!found.has(v)) {
                    result2.push(v);
                }
            });
            result = result.concat(this.sort(result2, lat, lon));
        }
        for (let i = 0; i < result.length; i++) {
            result[i].title =
                TextHelper.buildTitle(this.objects.get(result[i].id).names);
                // TextHelper.bestMatch(this.objects.get(result[i].id).names, searchString)
        }
        return result;
    }

    /**
     * @param {String} searchString
     * @returns {String[]} array of ids
     */
    filter(searchString) {
        const reqs = TextHelper.textToNormalizedWords(searchString);
        const founds = reqs.map(req => this.trie.getIds(req));

        const intersection = setIntersection(founds);
        return Array.from(intersection);
    }

    sort(ids, lat, lon) {
        let result = [];
        for (let i = 0; i < ids.length; i++) {
            const object = this.objects.get(ids[i]);
            const coords = object.coords;
            let minDistance = Infinity;
            let foundCoords;
            for (let j = 0; j < coords.length; j++) {
                const dst = this.distanceInM(coords[j][0], coords[j][1], lat, lon);
                if (dst < minDistance) {
                    foundCoords = coords[j];
                    minDistance = dst;
                }
            }
            result.push({
                id: object.id,
                dist: minDistance,
                coords: foundCoords
            });
        }

        result.sort((a, b) => a.dist - b.dist);
        return result.slice(0, 50);
    }
}
