(function () {
    var allProducts = [];
    var filteredProducts = [];
    var productsPerPage = 24;
    var currentPage = 1;
    var activeChip = "all";

    var SPORTS = [
        { label: "Baseball", needles: ["baseball", "mlb"] },
        { label: "Basketball", needles: ["basketball", "nba", "wnba"] },
        { label: "Football", needles: ["football", "nfl"] },
        { label: "Hockey", needles: ["hockey", "nhl"] }
    ];
    var TEAMS = [
        "Yankees", "Dodgers", "Mets", "Cubs", "Red Sox", "Braves", "Astros", "Phillies",
        "Giants", "Cardinals", "Rangers", "Padres", "Mariners", "Angels", "Orioles",
        "Guardians", "Twins", "White Sox", "Tigers", "Royals", "Rays", "Blue Jays",
        "Nationals", "Marlins", "Pirates", "Reds", "Brewers", "Athletics", "Rockies",
        "Diamondbacks", "Lakers", "Celtics", "Warriors", "Bulls", "Knicks", "Nets",
        "Heat", "Nuggets", "Suns", "Mavericks", "76ers", "Bucks", "Clippers", "Thunder",
        "Cavaliers", "Hawks", "Pelicans", "Kings", "Spurs", "Rockets", "Grizzlies",
        "Pacers", "Raptors", "Hornets", "Magic", "Wizards", "Pistons", "Jazz",
        "Cowboys", "Chiefs", "Eagles", "49ers", "Packers", "Bills", "Ravens", "Steelers",
        "Lions", "Bengals", "Dolphins", "Jets", "Patriots", "Broncos", "Raiders",
        "Chargers", "Rams", "Seahawks", "Bears", "Vikings", "Saints", "Falcons",
        "Panthers", "Buccaneers", "Colts", "Texans", "Titans", "Jaguars", "Commanders"
    ];
    var SKIP = {
        topps: 1, panini: 1, bowman: 1, upper: 1, deck: 1, fleer: 1, donruss: 1,
        prizm: 1, chrome: 1, heritage: 1, stadium: 1, club: 1, finest: 1, select: 1,
        mosaic: 1, optic: 1, hoops: 1, series: 1, update: 1, insert: 1, rookie: 1,
        auto: 1, autograph: 1, refractor: 1, gold: 1, silver: 1, orange: 1, card: 1,
        cards: 1, baseball: 1, basketball: 1, football: 1, hockey: 1, sports: 1,
        psa: 1, bgs: 1, cgc: 1, sgc: 1, graded: 1, raw: 1, hobby: 1, now: 1,
        common: 1, foil: 1, holo: 1, the: 1, and: 1, for: 1, with: 1, from: 1,
        aventus: 1, elite: 1, shop: 1, new: 1, sale: 1, set: 1, base: 1
    };

    var Cat = window.AventusCatalog;
    var Cart = window.AventusCart;
    var tileButtons = [];

    // Each entry in allProducts is a group: one card title with one or more in-stock copies.
    function productPrice(g) {
        return g ? g.minPrice : 0;
    }
    function productDate(g) {
        return g ? g.newest : 0;
    }
    function isAvailable(g) {
        return Boolean(g && g.copies && g.copies.length);
    }
    function imageUrl(g) {
        var p = g && g.primary;
        return p ? Cat.imageUrl(p.images[0], 700) : "";
    }
    function hasImage(g) {
        return Boolean(imageUrl(g));
    }
    function haystack(g) {
        var p = g.primary;
        return ((p.title || "") + " " + (p.vendor || "") + " " + (p.product_type || "") + " " +
            (p.tags || []).join(" ") + " " + (p.handle || "") + " " + Cat.conditionLabel(p)).toLowerCase();
    }
    function tagsOf(g) {
        return (g.primary && g.primary.tags) || [];
    }
    // First copy of this card that is not already in the cart.
    function nextCopy(g) {
        for (var i = 0; i < g.copies.length; i++) {
            if (!Cart.has(g.copies[i].variant_id)) return g.copies[i];
        }
        return null;
    }
    function updateTileButton(btn, g) {
        var copy = nextCopy(g);
        btn.classList.toggle("is-in-cart", !copy);
        btn.textContent = copy ? "Add to cart" : "In cart";
    }
    function refreshTileButtons() {
        tileButtons.forEach(function (t) { updateTileButton(t.btn, t.group); });
    }

    function renderCard(g, opts) {
        opts = opts || {};
        var p = g.primary;
        var name = p.title || "Untitled card";
        // Set name from CDP tags (e.g. "2025 Topps Chrome"); "CDP" is the lister, not useful to buyers.
        var setTag = (p.tags || []).filter(function (t) { return /^\d{4}(-\d{2})?\s+\S/.test(t); })[0];
        var vendor = setTag || (p.vendor && p.vendor !== "Aventus Elite Cards" && p.vendor !== "CDP" ? p.vendor : "");
        var imgSrc = imageUrl(g);
        var href = Cart.cardUrl(p.handle);

        var article = document.createElement("article");
        article.className = "card-item";

        if (opts.badge) {
            var feat = document.createElement("span");
            feat.className = "badge";
            feat.textContent = opts.badge;
            article.appendChild(feat);
        }

        var imageWrap = document.createElement("a");
        imageWrap.className = "card-image";
        imageWrap.href = href;
        imageWrap.setAttribute("aria-label", name);
        if (imgSrc) {
            var img = document.createElement("img");
            img.src = imgSrc;
            img.alt = name;
            img.loading = "lazy";
            img.addEventListener("error", function () {
                img.remove();
                imageWrap.classList.add("is-placeholder");
            });
            imageWrap.appendChild(img);
        } else {
            imageWrap.classList.add("is-placeholder");
        }
        article.appendChild(imageWrap);

        var info = document.createElement("div");
        info.className = "card-info";
        var title = document.createElement("h3");
        var titleLink = document.createElement("a");
        titleLink.href = href;
        titleLink.textContent = name;
        title.appendChild(titleLink);
        info.appendChild(title);
        var cond = Cat.conditionTag(p);
        if (cond) info.appendChild(cond);
        if (vendor) {
            var team = document.createElement("p");
            team.className = "card-team";
            team.textContent = vendor;
            info.appendChild(team);
        }
        var price = document.createElement("p");
        price.className = "card-price";
        price.textContent = (g.copies.length > 1 && g.maxPrice !== g.minPrice ? "From " : "") + Cart.money(g.minPrice);
        info.appendChild(price);
        if (g.copies.length > 1) {
            var copies = document.createElement("a");
            copies.className = "card-copies";
            copies.href = href;
            copies.textContent = g.copies.length + " copies available";
            info.appendChild(copies);
        }
        var add = document.createElement("button");
        add.type = "button";
        add.className = "shopify-button";
        add.addEventListener("click", function () {
            var copy = nextCopy(g);
            if (copy) Cart.add(copy);
            else Cart.open();
        });
        updateTileButton(add, g);
        tileButtons.push({ btn: add, group: g });
        info.appendChild(add);
        article.appendChild(info);
        return article;
    }

    function fillGrid(el, products, emptyText, cardOpts) {
        if (!el) return;
        el.innerHTML = "";
        tileButtons = tileButtons.filter(function (t) { return !el.contains(t.btn) && document.body.contains(t.btn); });
        if (!products.length) {
            var empty = document.createElement("p");
            empty.className = "coming-soon";
            empty.textContent = emptyText;
            el.appendChild(empty);
            return;
        }
        products.forEach(function (p) { el.appendChild(renderCard(p, cardOpts)); });
    }

    function guessPlayer(title) {
        var raw = String(title || "");
        var first = raw.split(" - ")[0].replace(/^\d{4}\s+/, "").trim();
        var words = first.split(/\s+/).filter(function (w) {
            var k = w.toLowerCase().replace(/[^a-z]/g, "");
            if (!k || SKIP[k]) return false;
            if (/^\d+$/.test(w)) return false;
            return /^[A-Z]/.test(w) || w.indexOf(".") !== -1;
        });
        if (words.length >= 2 && words.length <= 4) return words.join(" ");
        return "";
    }

    function buildChips(products) {
        var counts = {};
        function add(label, n) {
            if (!label) return;
            counts[label] = (counts[label] || 0) + (n || 1);
        }
        products.forEach(function (p) {
            var text = haystack(p);
            SPORTS.forEach(function (s) {
                for (var i = 0; i < s.needles.length; i++) {
                    if (text.indexOf(s.needles[i]) !== -1) { add(s.label, 4); break; }
                }
            });
            TEAMS.forEach(function (team) {
                if (text.indexOf(team.toLowerCase()) !== -1) add(team, 3);
            });
            tagsOf(p).forEach(function (tag) {
                var nice = tag.replace(/\s+/g, " ").trim();
                var key = nice.toLowerCase();
                if (SKIP[key] || nice.length < 3) return;
                if (/^\d+$/.test(nice)) return;
                add(nice, 2);
            });
            add(guessPlayer(p.primary.title), 2);
        });
        return Object.keys(counts)
            .filter(function (k) { return counts[k] >= 2 && k.toLowerCase() !== "all"; })
            .sort(function (a, b) { return counts[b] - counts[a]; })
            .slice(0, 16);
    }

    function matchesChip(p, chip) {
        if (!chip || chip === "all") return true;
        if (chip === "under5") return productPrice(p) < 5;
        if (chip === "featured") return isAvailable(p) && productPrice(p) >= 50;
        var text = haystack(p);
        return text.indexOf(chip.toLowerCase()) !== -1;
    }

    function applyFilters() {
        var q = (document.getElementById("search-input").value || "").toLowerCase().trim();
        filteredProducts = allProducts.filter(function (p) {
            if (!matchesChip(p, activeChip)) return false;
            if (!q) return true;
            return haystack(p).indexOf(q) !== -1;
        });
        var sortType = document.getElementById("sort-select").value;
        sortProducts(sortType, true);
        currentPage = 1;
        displayProducts(currentPage);
    }

    function sortProducts(sortType, skipRender) {
        if (sortType === "name") {
            filteredProducts.sort(function (a, b) { return (a.primary.title || "").localeCompare(b.primary.title || ""); });
        } else if (sortType === "name-desc") {
            filteredProducts.sort(function (a, b) { return (b.primary.title || "").localeCompare(a.primary.title || ""); });
        } else if (sortType === "price") {
            filteredProducts.sort(function (a, b) { return productPrice(a) - productPrice(b); });
        } else if (sortType === "price-desc") {
            filteredProducts.sort(function (a, b) { return productPrice(b) - productPrice(a); });
        } else {
            filteredProducts.sort(function (a, b) { return productDate(b) - productDate(a); });
        }
        if (!skipRender) {
            currentPage = 1;
            displayProducts(currentPage);
        }
    }

    function displayProducts(page) {
        var grid = document.getElementById("inventory-grid");
        var prevBtn = document.getElementById("prev-page");
        var nextBtn = document.getElementById("next-page");
        var pageInfo = document.getElementById("page-info");
        if (!grid) return;
        var totalPages = Math.ceil(filteredProducts.length / productsPerPage) || 1;
        if (page > totalPages) page = totalPages;
        currentPage = page;
        var start = (page - 1) * productsPerPage;
        fillGrid(grid, filteredProducts.slice(start, start + productsPerPage), "No cards match that filter.");
        if (pageInfo) pageInfo.textContent = "Page " + page + " of " + totalPages + " \u00b7 " + filteredProducts.length.toLocaleString() + " cards";
        if (prevBtn) prevBtn.disabled = page <= 1;
        if (nextBtn) nextBtn.disabled = page >= totalPages;
        if (page !== 1) {
            document.getElementById("inventory").scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    function setChip(value, scroll) {
        activeChip = value || "all";
        var chips = document.querySelectorAll(".chip");
        for (var i = 0; i < chips.length; i++) {
            chips[i].classList.toggle("is-active", chips[i].getAttribute("data-chip") === activeChip);
        }
        applyFilters();
        if (scroll) document.getElementById("inventory").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function renderChips(labels) {
        var wrap = document.getElementById("browse-chips");
        if (!wrap) return;
        wrap.innerHTML = "";
        var all = ["All"].concat(labels);
        if (labels.length) wrap.hidden = false;
        all.forEach(function (label) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "chip" + (label === "All" ? " is-active" : "");
            btn.setAttribute("data-chip", label === "All" ? "all" : label);
            btn.textContent = label;
            btn.addEventListener("click", function () { setChip(btn.getAttribute("data-chip"), false); });
            wrap.appendChild(btn);
        });
    }

    function renderRails() {
        var inStock = allProducts.filter(isAvailable);
        var withPhoto = inStock.filter(hasImage);
        var featured = withPhoto.slice().sort(function (a, b) { return productPrice(b) - productPrice(a); }).slice(0, 8);
        var value = withPhoto.filter(function (p) { return productPrice(p) < 5; }).slice(0, 12);
        fillGrid(document.getElementById("featured-grid"), featured, "No high-end cards in stock right now.", { badge: "Featured" });
        fillGrid(document.getElementById("value-grid"), value, "No cards under $5 in stock right now.");
    }

    Cat.fetchLive()
        .then(function (data) {
            var listings = data.products || [];
            Cart.sync(listings);
            allProducts = Cat.groupProducts(listings);
            filteredProducts = allProducts.slice();
            var countEl = document.getElementById("catalog-count");
            if (countEl) {
                var copies = listings.length - allProducts.length;
                countEl.textContent = allProducts.length.toLocaleString() + " cards in stock" +
                    (copies > 0 ? " \u00b7 " + listings.length.toLocaleString() + " listings incl. extra copies" : "") + ".";
            }
            renderRails();
            renderChips(buildChips(allProducts));
            sortProducts("newest", true);
            displayProducts(1);
        })
        .catch(function () {
            ["featured-grid", "value-grid", "inventory-grid"].forEach(function (id) {
                fillGrid(document.getElementById(id), [], "Inventory is temporarily unavailable. Try again in a moment.");
            });
        });

    Cart.onChange(refreshTileButtons);

    document.getElementById("search-input").addEventListener("input", function () {
        currentPage = 1;
        applyFilters();
    });
    document.getElementById("sort-select").addEventListener("change", function (e) {
        sortProducts(e.target.value);
    });
    document.getElementById("prev-page").addEventListener("click", function () {
        if (currentPage > 1) displayProducts(currentPage - 1);
    });
    document.getElementById("next-page").addEventListener("click", function () {
        var totalPages = Math.ceil(filteredProducts.length / productsPerPage) || 1;
        if (currentPage < totalPages) displayProducts(currentPage + 1);
    });
    document.getElementById("view-featured").addEventListener("click", function () {
        document.getElementById("sort-select").value = "price-desc";
        setChip("featured", true);
    });
    document.getElementById("view-value").addEventListener("click", function () {
        document.getElementById("sort-select").value = "price";
        setChip("under5", true);
    });
    document.getElementById("contact-form").addEventListener("submit", function (e) {
        e.preventDefault();
        var form = e.target;
        var body = "From: " + form.name.value.trim() + " (" + form.email.value.trim() + ")\n\n" + form.message.value.trim();
        window.location.href = "mailto:Justin@aventuselitecards.com?subject=" +
            encodeURIComponent(form.subject.value.trim()) + "&body=" + encodeURIComponent(body);
    });
    document.getElementById("notify-form").addEventListener("submit", function (e) {
        e.preventDefault();
        var email = e.target.email.value.trim();
        window.location.href = "mailto:Justin@aventuselitecards.com?subject=" +
            encodeURIComponent("Notify me when new cards drop") +
            "&body=" + encodeURIComponent("Please notify this email when new cards are listed:\n\n" + email);
    });
})();
