import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML — removes <script>, event handlers (onerror, onclick, etc.),
 * javascript: URLs, and other XSS vectors. Allows safe HTML for custom
 * design elements (divs, spans, SVGs, images, CSS classes, inline styles).
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true, svg: true },
    ALLOWED_TAGS: [
      "div", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6",
      "img", "svg", "path", "circle", "rect", "line", "polyline", "polygon",
      "a", "br", "hr", "section", "article", "header", "footer",
      "ul", "ol", "li", "strong", "em", "b", "i",
    ],
    ALLOWED_ATTR: [
      "class", "style", "id", "src", "alt", "href", "target", "rel",
      "viewBox", "fill", "stroke", "stroke-width", "d", "cx", "cy", "r",
      "width", "height", "xmlns", "opacity", "transform",
    ],
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "textarea", "select", "button"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
  });
}

/**
 * Sanitize CSS — removes dangerous CSS expressions that can execute JS.
 */
export function sanitizeCss(css: string): string {
  // Remove JS-executing CSS patterns
  return css
    .replace(/expression\s*\(/gi, "/* blocked */")
    .replace(/javascript\s*:/gi, "/* blocked */")
    .replace(/-moz-binding\s*:/gi, "/* blocked */")
    .replace(/behavior\s*:/gi, "/* blocked */")
    .replace(/@import\s+url\s*\(\s*['"]?javascript/gi, "/* blocked */");
}
