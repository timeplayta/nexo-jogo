(function () {
  const params = new URLSearchParams(location.search);
  const host = `${location.hostname} ${document.referrer || ""}`.toLowerCase();
  let kind = "standalone";
  if (params.get("portal") === "poki" || host.includes("poki")) kind = "poki";
  else if (
    params.get("portal") === "crazy" ||
    params.has("useLocalSdk") ||
    host.includes("crazygames")
  ) {
    kind = "crazy";
  }

  const api = {
    kind,
    ready: Promise.resolve(),
    playing: false,
    adLock: false,
    loadingDone: false,
  };
  window.NEXO_PORTAL = api;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(src));
      document.head.appendChild(s);
    });
  }

  function crazyOk() {
    try {
      return window.CrazyGames?.SDK && window.CrazyGames.SDK.environment !== "disabled";
    } catch (_) {
      return false;
    }
  }

  if (kind === "poki") {
    api.ready = loadScript("https://game-cdn.poki.com/scripts/v2/poki-sdk.js")
      .then(() => window.PokiSDK.init())
      .catch(() => {});
  } else if (kind === "crazy") {
    api.ready = loadScript("https://sdk.crazygames.com/crazygames-sdk-v3.js")
      .then(() => window.CrazyGames.SDK.init())
      .then(() => {
        try {
          const apply = (settings) => {
            if (settings && settings.muteAudio) window.NEXO_SET_MUTE?.(true);
          };
          apply(window.CrazyGames.SDK.game.settings);
          window.CrazyGames.SDK.game.addSettingsChangeListener(apply);
        } catch (_) {}
      })
      .catch(() => {});
  }

  api.loadingStart = function () {
    if (kind !== "crazy" || !crazyOk()) return;
    try {
      window.CrazyGames.SDK.game.loadingStart();
    } catch (_) {}
  };

  api.loadingFinished = function () {
    if (api.loadingDone) return;
    api.loadingDone = true;
    try {
      if (kind === "poki" && window.PokiSDK) window.PokiSDK.gameLoadingFinished();
      if (kind === "crazy" && crazyOk()) window.CrazyGames.SDK.game.loadingStop();
    } catch (_) {}
  };

  api.gameplayStart = function () {
    if (api.adLock || api.playing) return;
    api.playing = true;
    try {
      if (kind === "poki" && window.PokiSDK) window.PokiSDK.gameplayStart();
      if (kind === "crazy" && crazyOk()) window.CrazyGames.SDK.game.gameplayStart();
    } catch (_) {}
  };

  api.gameplayStop = function () {
    if (api.adLock || !api.playing) return;
    api.playing = false;
    try {
      if (kind === "poki" && window.PokiSDK) window.PokiSDK.gameplayStop();
      if (kind === "crazy" && crazyOk()) window.CrazyGames.SDK.game.gameplayStop();
    } catch (_) {}
  };

  api.commercialBreak = function () {
    if (kind === "standalone") return Promise.resolve();
    if (api.adLock) return Promise.resolve();
    if (api.playing) {
      api.playing = false;
      try {
        if (kind === "poki" && window.PokiSDK) window.PokiSDK.gameplayStop();
        if (kind === "crazy" && crazyOk()) window.CrazyGames.SDK.game.gameplayStop();
      } catch (_) {}
    }
    api.adLock = true;
    window.NEXO_SET_MUTE?.(true);
    const done = () => {
      api.adLock = false;
      window.NEXO_SET_MUTE?.(false);
    };
    if (kind === "poki" && window.PokiSDK) {
      return window.PokiSDK.commercialBreak(() => window.NEXO_SET_MUTE?.(true))
        .then(done)
        .catch(done);
    }
    if (kind === "crazy" && crazyOk()) {
      return new Promise((resolve) => {
        try {
          window.CrazyGames.SDK.ad.requestAd("midgame", {
            adStarted: () => window.NEXO_SET_MUTE?.(true),
            adFinished: () => {
              done();
              resolve();
            },
            adError: () => {
              done();
              resolve();
            },
          });
        } catch (_) {
          done();
          resolve();
        }
      });
    }
    done();
    return Promise.resolve();
  };

  api.happy = function () {
    try {
      if (kind === "crazy" && crazyOk()) window.CrazyGames.SDK.game.happytime();
    } catch (_) {}
  };

  window.addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp" || ev.key === " ") ev.preventDefault();
  });
  window.addEventListener("wheel", (ev) => ev.preventDefault(), { passive: false });
})();
