// Shared catalog helpers for the home page and card pages.
(function () {
    var FEED = "/.netlify/functions/shopify";
    var livePromise = null;

    // Same card (same title) listed more than once = one tile with several copies.
    function groupKey(p) {
        return String((p && p.title) || "").toLowerCase().replace(/\s+/g, " ").trim();
    }
    function imageUrl(src, width) {
        if (!src) return "";
        if (src.indexOf("cdn.shopify.com") !== -1) {
            src += (src.indexOf("?") === -1 ? "?" : "&") + "width=" + (width || 700);
        }
        return src;
    }
    // Grade for slabs (e.g. "PSA 10"), else the raw condition CDP tagged (e.g. "Near Mint or Better").
    function conditionLabel(p) {
        if (!p) return "";
        if (p.grade) return p.grade;
        return p.condition || "";
    }
    function conditionTag(p) {
        var text = conditionLabel(p);
        if (!text) return null;
        var el = document.createElement("span");
        el.className = "condition-tag" + (p.grade ? " is-graded" : "");
        el.textContent = text;
        el.title = p.grade ? "Graded: " + p.grade : "Raw card condition: " + p.condition;
        return el;
    }
    function groupProducts(products) {
        var map = {};
        var groups = [];
        products.forEach(function (p) {
            var key = groupKey(p);
            if (!map[key]) {
                map[key] = { key: key, copies: [] };
                groups.push(map[key]);
            }
            map[key].copies.push(p);
        });
        groups.forEach(function (g) {
            g.copies.sort(function (a, b) {
                var ai = a.images.length ? 0 : 1, bi = b.images.length ? 0 : 1;
                if (a.price !== b.price) return a.price - b.price;
                return ai - bi;
            });
            g.primary = g.copies.filter(function (c) { return c.images.length; })[0] || g.copies[0];
            g.minPrice = g.copies[0].price;
            g.maxPrice = g.copies[g.copies.length - 1].price;
            g.newest = Math.max.apply(null, g.copies.map(function (c) {
                return Date.parse(c.published_at || c.created_at || 0) || 0;
            }));
        });
        return groups;
    }
    function fetchLive() {
        if (!livePromise) {
            livePromise = fetch(FEED + "?t=" + Math.floor(Date.now() / 60000))
                .then(function (r) {
                    if (!r.ok) throw new Error("Inventory request failed");
                    return r.json();
                })
                .catch(function (err) {
                    livePromise = null;
                    throw err;
                });
        }
        return livePromise;
    }
    function fetchCard(handle) {
        return fetch(FEED + "?handle=" + encodeURIComponent(handle)).then(function (r) {
            if (r.status === 404) return null;
            if (!r.ok) throw new Error("Card request failed");
            return r.json().then(function (d) { return d.product; });
        });
    }

    window.AventusCatalog = {
        groupKey: groupKey,
        groupProducts: groupProducts,
        imageUrl: imageUrl,
        conditionLabel: conditionLabel,
        conditionTag: conditionTag,
        fetchLive: fetchLive,
        fetchCard: fetchCard
    };
})();
