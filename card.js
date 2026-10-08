// Card detail page: card.html?handle=<shopify-handle>
(function () {
    var Cat = window.AventusCatalog;
    var Cart = window.AventusCart;
    var params = new URLSearchParams(window.location.search);
    var handle = (params.get("handle") || "").trim();
    var statusEl = document.getElementById("detail-status");
    var layout = document.getElementById("detail-layout");
    var current = null;

    function setStatus(text, linkBack) {
        statusEl.hidden = false;
        statusEl.textContent = text;
        if (linkBack) {
            statusEl.appendChild(document.createTextNode(" "));
            var a = document.createElement("a");
            a.href = "index.html#inventory";
            a.textContent = "Browse the inventory.";
            statusEl.appendChild(a);
        }
    }

    // Allow-list sanitizer for Shopify body_html: keeps basic text formatting,
    // drops scripts/iframes/styles, and strips every attribute.
    var ALLOWED = { P: 1, BR: 1, UL: 1, OL: 1, LI: 1, STRONG: 1, B: 1, EM: 1, I: 1, H3: 1, H4: 1, SPAN: 1, DIV: 1 };
    var DROP = { SCRIPT: 1, STYLE: 1, IFRAME: 1, OBJECT: 1, EMBED: 1, FORM: 1, INPUT: 1, BUTTON: 1, TEXTAREA: 1, SELECT: 1, LINK: 1, META: 1, SVG: 1, MATH: 1, NOSCRIPT: 1, TEMPLATE: 1 };
    function sanitizeInto(target, html) {
        var doc = new DOMParser().parseFromString("<div>" + String(html || "") + "</div>", "text/html");
        function walk(src, dest) {
            Array.prototype.forEach.call(src.childNodes, function (node) {
                if (node.nodeType === 3) {
                    dest.appendChild(document.createTextNode(node.nodeValue));
                } else if (node.nodeType === 1) {
                    var tag = node.tagName.toUpperCase();
                    if (DROP[tag]) return;
                    if (ALLOWED[tag]) {
                        var el = document.createElement(tag.toLowerCase());
                        walk(node, el);
                        dest.appendChild(el);
                    } else {
                        walk(node, dest);
                    }
                }
            });
        }
        walk(doc.body.firstChild || doc.body, target);
    }

    function setMainImage(src, alt) {
        var wrap = document.getElementById("detail-main-image");
        wrap.innerHTML = "";
        wrap.classList.remove("is-placeholder");
        if (!src) { wrap.classList.add("is-placeholder"); return; }
        var img = document.createElement("img");
        img.src = Cat.imageUrl(src, 1100);
        img.alt = alt;
        img.addEventListener("error", function () { img.remove(); wrap.classList.add("is-placeholder"); });
        wrap.appendChild(img);
    }

    function fact(dl, label, value) {
        if (!value) return;
        var dt = document.createElement("dt");
        dt.textContent = label;
        var dd = document.createElement("dd");
        dd.textContent = value;
        dl.appendChild(dt);
        dl.appendChild(dd);
    }

    function renderActions() {
        var wrap = document.getElementById("detail-actions");
        wrap.innerHTML = "";
        var p = current;
        if (!p.live) {
            var sold = document.createElement("span");
            sold.className = "sold-out";
            sold.textContent = "Sold";
            wrap.appendChild(sold);
            return;
        }
        var inCart = Cart.has(p.variant_id);
        var add = document.createElement("button");
        add.type = "button";
        add.className = "cta-button detail-add" + (inCart ? " is-in-cart" : "");
        add.textContent = inCart ? "In cart \u2014 view cart" : "Add to cart";
        add.addEventListener("click", function () {
            if (Cart.has(p.variant_id)) Cart.open();
            else Cart.add(p);
        });
        wrap.appendChild(add);
        var note = document.createElement("p");
        note.className = "detail-note";
        note.textContent = "One of one: this exact card ships to the buyer. Checkout is handled by Shopify.";
        wrap.appendChild(note);
    }

    function render(p) {
        current = p;
        document.title = p.title + " \u00b7 Aventus Elite Cards";
        statusEl.hidden = true;
        layout.hidden = false;

        var setTag = (p.tags || []).filter(function (t) { return /^\d{4}(-\d{2})?\s+\S/.test(t); })[0];
        document.getElementById("detail-set").textContent = setTag || "Trading card";
        document.getElementById("detail-title").textContent = p.title;

        var tags = document.getElementById("detail-tags");
        tags.innerHTML = "";
        var cond = Cat.conditionTag(p);
        if (cond) tags.appendChild(cond);
        if (!p.live) {
            var s = document.createElement("span");
            s.className = "condition-tag is-sold";
            s.textContent = "Sold";
            tags.appendChild(s);
        }

        var priceEl = document.getElementById("detail-price");
        priceEl.textContent = Cart.money(p.price);
        if (p.compare_at_price && p.compare_at_price > p.price) {
            var was = document.createElement("s");
            was.className = "detail-was";
            was.textContent = Cart.money(p.compare_at_price);
            priceEl.appendChild(document.createTextNode(" "));
            priceEl.appendChild(was);
        }

        var images = p.images || [];
        setMainImage(images[0], p.title);
        var thumbs = document.getElementById("detail-thumbs");
        thumbs.innerHTML = "";
        if (images.length > 1) {
            images.forEach(function (src, i) {
                var b = document.createElement("button");
                b.type = "button";
                b.className = "detail-thumb" + (i === 0 ? " is-active" : "");
                b.setAttribute("aria-label", "Photo " + (i + 1));
                var img = document.createElement("img");
                img.src = Cat.imageUrl(src, 200);
                img.alt = "";
                b.appendChild(img);
                b.addEventListener("click", function () {
                    setMainImage(src, p.title);
                    var all = thumbs.querySelectorAll(".detail-thumb");
                    for (var k = 0; k < all.length; k++) all[k].classList.toggle("is-active", all[k] === b);
                });
                thumbs.appendChild(b);
            });
        }

        var facts = document.getElementById("detail-facts");
        facts.innerHTML = "";
        if (p.grade) fact(facts, "Grade", p.grade);
        else fact(facts, "Condition", p.condition);
        fact(facts, "Set", setTag);
        if (p.vendor && p.vendor !== "CDP") fact(facts, "Brand", p.vendor);
        var sport = (p.tags || []).filter(function (t) { return /^[A-Z]{4,}$/.test(t); })[0];
        if (sport) fact(facts, "Sport", sport.charAt(0) + sport.slice(1).toLowerCase());
        fact(facts, "SKU", p.sku);

        var desc = document.getElementById("detail-description");
        desc.innerHTML = "";
        if (p.body_html) sanitizeInto(desc, p.body_html);

        renderActions();
    }

    function renderCopies(listings) {
        if (!current) return;
        var key = Cat.groupKey(current);
        var others = listings.filter(function (l) {
            return Cat.groupKey(l) === key && String(l.variant_id) !== String(current.variant_id);
        }).sort(function (a, b) { return a.price - b.price; });
        var section = document.getElementById("detail-copies");
        var grid = document.getElementById("detail-copies-grid");
        grid.innerHTML = "";
        if (!others.length) { section.hidden = true; return; }
        section.hidden = false;
        others.forEach(function (o) {
            var a = document.createElement("a");
            a.className = "card-item copy-tile";
            a.href = Cart.cardUrl(o.handle);
            var imgWrap = document.createElement("div");
            imgWrap.className = "card-image";
            if (o.images[0]) {
                var img = document.createElement("img");
                img.src = Cat.imageUrl(o.images[0], 500);
                img.alt = o.title;
                img.loading = "lazy";
                imgWrap.appendChild(img);
            } else {
                imgWrap.classList.add("is-placeholder");
            }
            a.appendChild(imgWrap);
            var info = document.createElement("div");
            info.className = "card-info";
            var c = Cat.conditionTag(o);
            if (c) info.appendChild(c);
            var price = document.createElement("p");
            price.className = "card-price";
            price.textContent = Cart.money(o.price) + (Cart.has(o.variant_id) ? " \u00b7 in cart" : "");
            info.appendChild(price);
            a.appendChild(info);
            grid.appendChild(a);
        });
    }

    if (!handle) {
        setStatus("No card selected.", true);
        return;
    }

    var listingsPromise = Cat.fetchLive().then(function (d) {
        var listings = d.products || [];
        Cart.sync(listings);
        return listings;
    }).catch(function () { return null; });

    Cat.fetchCard(handle).then(function (p) {
        if (!p) {
            setStatus("That card is no longer listed.", true);
            return;
        }
        render(p);
        return listingsPromise.then(function (listings) {
            if (!listings) return;
            // The live feed is the source of truth for what can be bought.
            var live = listings.some(function (l) { return String(l.variant_id) === String(p.variant_id); });
            if (live !== p.live) { p.live = live; render(p); }
            renderCopies(listings);
        });
    }).catch(function () {
        setStatus("This card could not be loaded right now. Try again in a moment.", true);
    });

    Cart.onChange(function () {
        if (!current) return;
        renderActions();
        listingsPromise.then(function (l) { if (l) renderCopies(l); });
    });
})();
