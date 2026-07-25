const accordion = document.querySelector(".topic-accordion");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const animations = new WeakMap();

function setExpanded(details, expanded) {
  const summary = details.querySelector(":scope > summary");
  details.dataset.expanded = String(expanded);
  summary?.setAttribute("aria-expanded", String(expanded));
}

function finishAnimation(details, animation, expanded) {
  if (animations.get(details) !== animation) return;
  animations.delete(details);
  if (!expanded) details.open = false;
  details.classList.remove("is-animating");
  details.style.removeProperty("height");
  details.style.removeProperty("overflow");
}

function animateDetails(details, expanded) {
  const summary = details.querySelector(":scope > summary");
  if (!summary) return;

  const activeAnimation = animations.get(details);
  const startHeight = details.getBoundingClientRect().height;
  activeAnimation?.cancel();

  if (expanded) details.open = true;
  setExpanded(details, expanded);

  if (reducedMotion.matches) {
    if (!expanded) details.open = false;
    details.classList.remove("is-animating");
    details.style.removeProperty("height");
    details.style.removeProperty("overflow");
    return;
  }

  const endHeight = expanded ? details.scrollHeight : summary.offsetHeight;
  details.classList.add("is-animating");
  details.style.height = `${startHeight}px`;
  details.style.overflow = "hidden";

  const animation = details.animate(
    {
      height: [`${startHeight}px`, `${endHeight}px`]
    },
    {
      duration: 300,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)"
    }
  );
  animations.set(details, animation);
  animation.finished
    .then(() => finishAnimation(details, animation, expanded))
    .catch(() => {});
}

if (accordion) {
  const items = [...accordion.querySelectorAll("details")];
  for (const details of items) {
    details.removeAttribute("name");
    setExpanded(details, details.open);
    details.querySelector(":scope > summary")?.addEventListener("click", (event) => {
      event.preventDefault();
      const willOpen = details.dataset.expanded !== "true";
      if (willOpen) {
        for (const other of items) {
          if (other !== details && other.dataset.expanded === "true") {
            animateDetails(other, false);
          }
        }
      }
      animateDetails(details, willOpen);
    });
  }
}
