export default function getTheme(preview = false, previewProps) {
  return preview ? require("../content/styles.json") : require("../content/styles.json")
}
