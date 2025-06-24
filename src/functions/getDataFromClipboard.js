const getDataFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText();
    console.log("Clipboard text:", text);
    return text;
  } catch (err) {
    console.error("Failed to read clipboard contents: ", err);
  }
};
export default getDataFromClipboard;
