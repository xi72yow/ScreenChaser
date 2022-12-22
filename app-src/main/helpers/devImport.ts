let onEmit = undefined;
(async () => {
  try {
    if (process.env.NODE_ENV === "development") {
      onEmit = import(`./virtualRoomConnection`);
    }
  } catch (err) {
    console.log(err);
  }
})();
export default await onEmit;
