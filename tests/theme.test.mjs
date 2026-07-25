import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const layoutPath = new URL("../src/layouts/BaseLayout.astro", import.meta.url);
const layout = await readFile(layoutPath, "utf8");
const scriptMatch = layout.match(/<script is:inline>\s*([\s\S]*?)\s*<\/script>/);

assert.ok(scriptMatch, "BaseLayout must contain an inline theme script");
const themeScript = scriptMatch[1];

class FakeElement {
  closest() {
    return null;
  }
}

class FakeButton extends FakeElement {
  attributes = new Map();

  closest(selector) {
    return selector === "[data-theme-toggle]" ? this : null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
  }
}

function runThemeScript(savedTheme = null) {
  const listeners = new Map();
  const stored = new Map();
  const button = new FakeButton();
  const documentElement = {
    dataset: { theme: "dark" },
    style: {}
  };

  if (savedTheme) stored.set("jonghoon-blog:theme", savedTheme);

  const document = {
    cookie: "",
    documentElement,
    querySelector(selector) {
      return selector === "[data-theme-toggle]" ? button : null;
    },
    addEventListener(type, listener) {
      listeners.set(type, listener);
    }
  };

  const localStorage = {
    getItem(key) {
      return stored.get(key) ?? null;
    },
    setItem(key, value) {
      stored.set(key, value);
    }
  };

  vm.runInNewContext(themeScript, {
    document,
    localStorage,
    Element: FakeElement,
    HTMLButtonElement: FakeButton
  });

  listeners.get("DOMContentLoaded")?.();

  return {
    button,
    click() {
      listeners.get("click")?.({ target: button });
    },
    documentElement,
    stored
  };
}

test("inline theme script is valid JavaScript", () => {
  assert.doesNotThrow(() => new vm.Script(themeScript));
});

test("theme defaults to dark and toggles in both directions", () => {
  const page = runThemeScript();

  assert.equal(page.documentElement.dataset.theme, "dark");
  assert.equal(page.button.attributes.get("aria-pressed"), "true");

  page.click();
  assert.equal(page.documentElement.dataset.theme, "light");
  assert.equal(page.stored.get("jonghoon-blog:theme"), "light");
  assert.equal(page.button.attributes.get("aria-pressed"), "false");

  page.click();
  assert.equal(page.documentElement.dataset.theme, "dark");
  assert.equal(page.stored.get("jonghoon-blog:theme"), "dark");
  assert.equal(page.button.attributes.get("aria-pressed"), "true");
});

test("saved theme is restored on a new page", () => {
  const page = runThemeScript("light");

  assert.equal(page.documentElement.dataset.theme, "light");
  assert.equal(page.documentElement.style.colorScheme, "light");
  assert.equal(page.button.attributes.get("aria-label"), "Switch to dark mode");
});
