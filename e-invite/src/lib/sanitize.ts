import sanitize from "sanitize-html";

/**
 * Sanitize HTML — removes <script>, event handlers (onerror, onclick, etc.),
 * javascript: URLs, and other XSS vectors. Allows safe HTML for custom
 * design elements (divs, spans, SVGs, images, CSS classes, inline styles).
 */
export function sanitizeHtml(html: string): string {
  return sanitize(html, {
    allowedTags: [
      "div", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6",
      "img", "svg", "path", "circle", "rect", "line", "polyline", "polygon",
      "a", "br", "hr", "section", "article", "header", "footer",
      "ul", "ol", "li", "strong", "em", "b", "i",
    ],
    allowedAttributes: {
      "*": ["class", "style", "id"],
      img: ["src", "alt", "width", "height"],
      a: ["href", "target", "rel"],
      svg: ["viewBox", "fill", "stroke", "stroke-width", "width", "height", "xmlns", "opacity", "transform"],
      path: ["d", "fill", "stroke", "stroke-width", "opacity", "transform"],
      circle: ["cx", "cy", "r", "fill", "stroke", "stroke-width", "opacity"],
      rect: ["x", "y", "width", "height", "fill", "stroke", "stroke-width", "opacity", "rx", "ry"],
      line: ["x1", "y1", "x2", "y2", "stroke", "stroke-width", "opacity"],
      polyline: ["points", "fill", "stroke", "stroke-width", "opacity"],
      polygon: ["points", "fill", "stroke", "stroke-width", "opacity"],
    },
    allowedSchemes: ["http", "https", "data"],
    disallowedTagsMode: "discard",
  });
}

/**
 * Sanitize CSS — removes dangerous CSS expressions that can execute JS.
 */
export function sanitizeCss(css: string): string {
  return css
    .replace(/expression\s*\(/gi, "/* blocked */")
    .replace(/javascript\s*:/gi, "/* blocked */")
    .replace(/-moz-binding\s*:/gi, "/* blocked */")
    .replace(/behavior\s*:/gi, "/* blocked */")
    .replace(/@import\s+url\s*\(\s*['"]?javascript/gi, "/* blocked */");
}
