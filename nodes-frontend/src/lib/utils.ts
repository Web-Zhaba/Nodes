import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

let caretDiv: HTMLDivElement | null = null;

export function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
  if (!caretDiv) {
    caretDiv = document.createElement("div");
    caretDiv.style.position = "absolute";
    caretDiv.style.visibility = "hidden";
    caretDiv.style.whiteSpace = "pre-wrap";
    caretDiv.style.wordWrap = "break-word";
    document.body.appendChild(caretDiv);
  }
  
  const style = window.getComputedStyle(element);
  
  const properties = [
    "direction", "boxSizing", "width", "height", "overflowX", "overflowY",
    "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
    "borderStyle", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
    "fontStyle", "fontVariant", "fontWeight", "fontStretch", "fontSize",
    "lineHeight", "fontFamily", "textAlign", "textTransform", "textIndent",
    "textDecoration", "letterSpacing", "wordSpacing", "tabSize"
  ];
  
  properties.forEach(prop => {
    // @ts-ignore
    caretDiv.style[prop] = style[prop];
  });
  
  const text = element.value.substring(0, position);
  caretDiv.textContent = text;
  
  const span = document.createElement("span");
  span.textContent = element.value.substring(position) || ".";
  caretDiv.appendChild(span);
  
  const coordinates = {
    top: span.offsetTop + parseInt(style.borderTopWidth || "0") - element.scrollTop,
    left: span.offsetLeft + parseInt(style.borderLeftWidth || "0") - element.scrollLeft
  };
  
  caretDiv.removeChild(span);
  return coordinates;
}
