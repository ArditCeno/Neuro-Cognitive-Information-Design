/*
 * Stimuli loader: fetches the A/B material HTML, injects it into the document
 * viewport, and derives AOI rectangles from [data-aoi] elements.
 */

import { EyeTracking } from "./eyetracking.js";

export const Stimuli = {
  docEl: null,
  _scrollHandler: null,

  async load(field, version, lang) {
    const path = field.materials[version][lang] || field.materials[version].al;
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error("Material not found: " + path);
    const html = await res.text();

    const doc = document.getElementById("doc");
    doc.classList.remove("dense", "optimized");
    doc.classList.add(version === "A" ? "dense" : "optimized");
    doc.innerHTML = html;
    doc.scrollTop = 0;
    doc.scrollLeft = 0;
    this.docEl = doc;

    const aois = this.computeAois(doc);
    this.watchScroll(doc);
    this.updateRegion(doc);
    return { aois };
  },

  computeAois(doc) {
    const docRect = doc.getBoundingClientRect();
    const sl = doc.scrollLeft, st = doc.scrollTop;
    return Array.from(doc.querySelectorAll("[data-aoi]")).map((el) => {
      const r = el.getBoundingClientRect();
      return {
        name: el.getAttribute("data-aoi"),
        critical: el.getAttribute("data-critical") === "true",
        x: r.left - docRect.left + sl,
        y: r.top - docRect.top + st,
        width: r.width,
        height: r.height
      };
    });
  },

  updateRegion(doc) {
    const r = doc.getBoundingClientRect();
    EyeTracking.setReadingRegion({
      left: r.left, top: r.top, width: r.width, height: r.height,
      scrollLeft: doc.scrollLeft, scrollTop: doc.scrollTop
    });
  },

  watchScroll(doc) {
    if (this._scrollHandler && this.docEl) this.docEl.removeEventListener("scroll", this._scrollHandler);
    this._scrollHandler = () => this.updateRegion(doc);
    doc.addEventListener("scroll", this._scrollHandler, { passive: true });
    window.addEventListener("resize", this._scrollHandler);
  },

  clear() {
    const doc = document.getElementById("doc");
    if (doc) doc.innerHTML = "";
    EyeTracking.clearReadingRegion();
  }
};
