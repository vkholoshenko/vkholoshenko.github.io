class AnagramIndex {
    constructor() {
        this.index = new Map();
    }

    /**
     *
     * @param {String} string
     * @returns {Map<any, any>}
     * @constructor
     */
    static StrToMap(string) {
        let map = new Map();
        for (let i = 0; i < string.length; i++) {
            const c = string.charAt(i);
            if (!map.has(c)) {
                map.set(c, 1);
            } else {
                map.set(c, map.get(c) + 1);
            }
        }
        return map;
    }

    /**
     *
     * @param {String} name
     */
    add(id, name) {
        const map = AnagramIndex.StrToMap(name);

        map.forEach((count, char) => {
            if (!this.index.has(char)) {
                this.index.set(char, []);
            }
            let arr = this.index.get(char);
            while (arr.length <= count) {
                arr.push(new Set());
            }
            arr[count].add(id);
        });
    }

    /**
     *
     * @param {String} request
     */
    search(request) {
        const map = AnagramIndex.StrToMap(request);

        let result = [];
        map.forEach((count, char) => {
            const s = new Set();
            const idx = this.index.get(char);
            if (idx && idx.length && idx.length > 0) {
                for (let i = count; i < +idx.length; i++) {
                    const s2 = idx[i].forEach(s.add, s);
                }
            }
            result.push(s);
        })
        return setIntersection(result);
    }
}