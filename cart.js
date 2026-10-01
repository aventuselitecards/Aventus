// Aventus cart: a small localStorage cart shared by the home page and card pages.
// Every card is one-of-a-kind, so each Shopify variant can be in the cart at most once.
// Checkout goes through one combined Shopify cart permalink: /cart/ID:1,ID:1,...
// Shopify prices the checkout from its own data, so the price a buyer pays is always
// the live Shopify price for exactly the variants in the cart.
(function () {
    var STORAGE_KEY = "aventus-cart-v1";
    var SHOP_CHECKOUT = "https://aventus-elite-cards.myshopify.com";
    var listeners = [];
    var drawer, overlay, listEl, subtotalEl, checkoutBtn, noticeEl, countEls = [];

    function read() {
        try {
            var raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
            if (!Array.isArray(raw)) return [];
            var seen = {};
            return raw.filter(function (item) {
                if (!item || !item.variantId || seen[item.variantId]) return false;
                seen[item.variantId] = true;
                return true;
            });
        } catch (e) {
            return [];
        }
    }
    function write(items) {
        try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (e) { /* storage full or blocked */ }
        render();
        listeners.forEach(function (fn) { fn(items); });
    }
    function has(variantId) {
        return read().some(function (i) { return String(i.variantId) === String(variantId); });
    }
    // product: the slim listing shape returned by /.netlify/functions/shopify
    function add(product) {
        if (!product || !product.variant_id) return false;
        var items = read();
        if (items.some(function (i) { return String(i.variantId) === String(product.variant_id); })) {
            open();
            return false;
        }
        items.push({
            variantId: product.variant_id,
            handle: product.handle,
            title: product.title,
            price: product.price,
            image: (product.images && product.images[0]) || "",
            label: product.grade || product.condition || ""
        });
        write(items);
        open();
        return true;
    }
    function remove(variantId) {
        write(read().filter(function (i) { return String(i.variantId) !== String(variantId); }));
    }
    function checkoutUrl(items) {
        items = items || read();
        if (!items.length) return "";
        return SHOP_CHECKOUT + "/cart/" + items.map(function (i) { return i.variantId + ":1"; }).join(",");
    }
    // Drop cart items that are no longer live and refresh prices from the live feed.
    function sync(liveProducts) {
        if (!Array.isArray(liveProducts)) return;
        var byVariant = {};
        liveProducts.forEach(function (p) { byVariant[String(p.variant_id)] = p; });
        var removed = [];
        var items = read().filter(function (i) {
            var live = byVariant[String(i.variantId)];
            if (!live) { removed.push(i.title); return false; }
            i.price = live.price;
            i.title = live.title;
            i.handle = live.handle;
            i.image = (live.images && live.images[0]) || i.image;
            i.label = live.grade || live.condition || "";
            return true;
        });
        write(items);
        if (removed.length) {
            notice(removed.length === 1
                ? "\u201c" + removed[0] + "\u201d sold and was removed from your cart."
                : removed.length + " cards in your cart sold and were removed.");
        }
    }
    function onChange(fn) { listeners.push(fn); }
    function money(n) { return "$" + (Number(n) || 0).toFixed(2); }
    function cardUrl(handle) { return "card.html?handle=" + encodeURIComponent(handle); }

    function notice(text) {
        if (!noticeEl) return;
        noticeEl.textContent = text;
        noticeEl.hidden = !text;
    }

    function buildDrawer() {
        overlay = document.createElement("div");
        overlay.className = "cart-overlay";
        overlay.hidden = true;
        overlay.addEventListener("click", close);

        drawer = document.createElement("aside");
        drawer.className = "cart-drawer";
        drawer.id = "cart-drawer";
        drawer.setAttribute("aria-label", "Cart");
        drawer.setAttribute("aria-hidden", "true");
        drawer.innerHTML =
            '<div class="cart-head"><h2>Your cart</h2>' +
            '<button type="button" class="cart-close" aria-label="Close cart">&times;</button></div>' +
            '<p class="cart-notice" hidden></p>' +
            '<ul class="cart-list"></ul>' +
            '<div class="cart-foot">' +
            '<p class="cart-subtotal"><span>Subtotal</span><span class="cart-subtotal-value">$0.00</span></p>' +
            '<p class="cart-fine">One of each card. Shipping and tax are calculated at Shopify checkout.</p>' +
            '<a class="cta-button cart-checkout" href="#" rel="noopener">Checkout</a>' +
            '</div>';
        document.body.appendChild(overlay);
        document.body.appendChild(drawer);
        listEl = drawer.querySelector(".cart-list");
        subtotalEl = drawer.querySelector(".cart-subtotal-value");
        checkoutBtn = drawer.querySelector(".cart-checkout");
        noticeEl = drawer.querySelector(".cart-notice");
        drawer.querySelector(".cart-close").addEventListener("click", close);
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && drawer.classList.contains("is-open")) close();
        });
    }

    function render() {
        var items = read();
        countEls.forEach(function (el) {
            el.textContent = String(items.length);
            el.hidden = items.length === 0;
        });
        if (!listEl) return;
        listEl.innerHTML = "";
        if (!items.length) {
            var empty = document.createElement("li");
            empty.className = "cart-empty";
            empty.textContent = "Your cart is empty.";
            listEl.appendChild(empty);
        }
        var total = 0;
        items.forEach(function (item) {
            total += Number(item.price) || 0;
            var li = document.createElement("li");
            li.className = "cart-line";
            var thumb = document.createElement("a");
            thumb.className = "cart-thumb";
            thumb.href = cardUrl(item.handle);
            if (item.image) {
                var img = document.createElement("img");
                img.src = item.image + (item.image.indexOf("?") === -1 ? "?" : "&") + "width=160";
                img.alt = "";
                thumb.appendChild(img);
            }
            li.appendChild(thumb);
            var meta = document.createElement("div");
            meta.className = "cart-meta";
            var title = document.createElement("a");
            title.className = "cart-title";
            title.href = cardUrl(item.handle);
            title.textContent = item.title;
            meta.appendChild(title);
            if (item.label) {
                var label = document.createElement("span");
                label.className = "condition-tag";
                label.textContent = item.label;
                meta.appendChild(label);
            }
            var price = document.createElement("span");
            price.className = "card-price";
            price.textContent = money(item.price);
            meta.appendChild(price);
            li.appendChild(meta);
            var rm = document.createElement("button");
            rm.type = "button";
            rm.className = "cart-remove";
            rm.textContent = "Remove";
            rm.addEventListener("click", function () { remove(item.variantId); });
            li.appendChild(rm);
            listEl.appendChild(li);
        });
        subtotalEl.textContent = money(total);
        var url = checkoutUrl(items);
        checkoutBtn.href = url || "#";
        checkoutBtn.classList.toggle("is-disabled", !url);
        checkoutBtn.setAttribute("aria-disabled", url ? "false" : "true");
    }

    function open() {
        if (!drawer) return;
        render();
        overlay.hidden = false;
        drawer.classList.add("is-open");
        drawer.setAttribute("aria-hidden", "false");
        document.body.classList.add("cart-open");
    }
    function close() {
        if (!drawer) return;
        overlay.hidden = true;
        drawer.classList.remove("is-open");
        drawer.setAttribute("aria-hidden", "true");
        document.body.classList.remove("cart-open");
        notice("");
    }

    function init() {
        buildDrawer();
        var toggles = document.querySelectorAll("[data-cart-toggle]");
        for (var i = 0; i < toggles.length; i++) {
            toggles[i].addEventListener("click", function (e) { e.preventDefault(); open(); });
        }
        countEls = Array.prototype.slice.call(document.querySelectorAll("[data-cart-count]"));
        checkoutBtn.addEventListener("click", function (e) {
            if (!read().length) e.preventDefault();
        });
        window.addEventListener("storage", function (e) {
            if (e.key === STORAGE_KEY) {
                render();
                listeners.forEach(function (fn) { fn(read()); });
            }
        });
        render();
    }

    window.AventusCart = {
        items: read,
        has: has,
        add: add,
        remove: remove,
        sync: sync,
        open: open,
        close: close,
        onChange: onChange,
        checkoutUrl: checkoutUrl,
        money: money,
        cardUrl: cardUrl
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
