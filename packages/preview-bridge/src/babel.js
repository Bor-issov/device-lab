// Babel plugin: on web builds, point `react-native` imports in *app* code (not node_modules)
// at the platform shim, so Platform.OS / Platform.select report the Lab device's OS.
// A Metro resolveRequest cannot do this under Expo, which aliases react-native -> react-native-web
// in its own resolvers before custom ones run.

const SHIM = "@device-lab/preview-bridge/platform"

function isAppFile(filename) {
  return Boolean(filename) && !filename.split(/[\\/]/).includes("node_modules")
}

module.exports = function deviceLabPlatform(api) {
  const platform = api.caller((caller) => (caller ? caller.platform : undefined))
  if (platform !== "web") return { name: "device-lab-platform", visitor: {} }

  const rewrite = (source, state) => {
    if (source && source.value === "react-native" && isAppFile(state.filename)) source.value = SHIM
  }

  return {
    name: "device-lab-platform",
    visitor: {
      ImportDeclaration(path, state) {
        rewrite(path.node.source, state)
      },
      ExportNamedDeclaration(path, state) {
        rewrite(path.node.source, state)
      },
      ExportAllDeclaration(path, state) {
        rewrite(path.node.source, state)
      },
      CallExpression(path, state) {
        const { callee, arguments: args } = path.node
        if (callee.type === "Identifier" && callee.name === "require" && args[0] && args[0].type === "StringLiteral") {
          rewrite(args[0], state)
        }
      },
    },
  }
}
