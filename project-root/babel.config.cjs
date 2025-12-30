module.exports = {
  presets: [
    // Transpile modern JS for the current Node version
    ["@babel/preset-env", { targets: { node: "current" }, modules: "auto" }],
    // Handle JSX and React-specific syntax
    "@babel/preset-react"
  ]
};