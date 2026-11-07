// A page just large enough for the kit's h(), s(), sliders, readouts and step player, so the labs' tests can mount every lab
// in Node and play every step without a browser. Not a test itself (no .test.js): code-views.js and the labs' tests import it (one copy since 7 Nov 2026).

export class Node {}
class Text extends Node {
  constructor(t) { super(); this.text = t; }
  get textContent() { return this.text; }
}
export class El extends Node {
  constructor(tag) { super(); Object.assign(this, { tag, attrs: {}, children: [], listeners: {}, dataset: {}, _text: "", value: "", isConnected: true, style: {} }); }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === "value") this.value = String(v); }
  getAttribute(k) { return this.attrs[k]; }
  addEventListener(type, f) { (this.listeners[type] ??= []).push(f); }
  append(...c) { for (const x of c) this.children.push(x instanceof Node ? x : new Text(String(x))); }
  replaceChildren(...c) { this.children = []; this._text = ""; this.append(...c); }
  set textContent(t) { this.children = []; this._text = String(t); }
  get textContent() { return this._text + this.children.map(c => c.textContent).join(""); }
  set innerHTML(v) { this._text = String(v); }
  fire(type) { for (const f of this.listeners[type] ?? []) f({ target: this }); }
  *walk() { yield this; for (const c of this.children) if (c instanceof El) yield* c.walk(); }
  focus() {} scrollIntoView() {}
}

/** Puts the fake page in place of the browser's: document, Node, requestAnimationFrame (which never calls back, so
 *  the player waits and the test moves the slider itself). */
export function install() {
  globalThis.Node = Node;
  globalThis.document = { createElement: t => new El(t), createElementNS: (ns, t) => new El(t) };
  globalThis.requestAnimationFrame = () => 0;
  globalThis.cancelAnimationFrame = () => {};
}
