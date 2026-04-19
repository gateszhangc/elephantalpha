const topbar = document.querySelector("[data-topbar]");
const yearNode = document.querySelector("[data-current-year]");
const siteConfig = window.__ELEPHANT_ALPHA_CONFIG__ || {};

const isConfiguredValue = (value) => typeof value === "string" && value.length > 0 && !value.includes("__");

const injectScript = (src) => {
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
  return script;
};

const bootGa4 = () => {
  const measurementId = siteConfig.ga4MeasurementId;

  if (!isConfiguredValue(measurementId)) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  injectScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`);
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { anonymize_ip: true });
};

const bootClarity = () => {
  const projectId = siteConfig.clarityProjectId;

  if (!isConfiguredValue(projectId)) return;

  ((c, l, a, r, i, t, y) => {
    c[a] =
      c[a] ||
      function clarity() {
        (c[a].q = c[a].q || []).push(arguments);
      };
    t = l.createElement(r);
    t.async = 1;
    t.src = `https://www.clarity.ms/tag/${i}`;
    y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", projectId);
};

window.__ELEPHANT_ALPHA_BOOT__ = {
  bootClarity,
  bootGa4
};

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

const handleScroll = () => {
  if (!topbar) return;
  topbar.classList.toggle("is-scrolled", window.scrollY > 12);
};

window.addEventListener("scroll", handleScroll, { passive: true });
handleScroll();
bootGa4();
bootClarity();
