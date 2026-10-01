// Mobile menu: the nav links collapse behind a toggle on narrow screens.
(function () {
    var toggle = document.querySelector(".menu-toggle");
    var links = document.getElementById("nav-links");
    if (!toggle || !links) return;
    function set(open) {
        document.body.classList.toggle("menu-open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    toggle.addEventListener("click", function () {
        set(!document.body.classList.contains("menu-open"));
    });
    links.addEventListener("click", function (e) {
        if (e.target.closest("a")) set(false);
    });
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") set(false);
    });
    window.addEventListener("resize", function () {
        if (window.innerWidth > 800) set(false);
    });
})();
