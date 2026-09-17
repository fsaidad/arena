module.exports = {
  ci: {
    collect: {
      url: ["http://127.0.0.1:3000/", "http://127.0.0.1:3000/organizer"],
      numberOfRuns: 1,
      settings: {
        chromeFlags: "--headless --no-sandbox --disable-gpu",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.75 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.85 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
