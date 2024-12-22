export default function handleError(e, sourceId, configs) {
  console.error(e);
  if (e.message === "Could not start video source" && sourceId)
    global.ipcRenderer.invoke("GET_SOURCES").then(async (sources) => {
      //if Could not start video source then try to find videosource by name
      configs.forEach(({ config, device }) => {
        const { name, id } = parseSourceString(config.config.sourceId);
        if (id === sourceId) {
          const source = sources.find((source) => source.name === name);
          if (source) {
            console.info(
              `found source by name and set config (${config.id}) to new source: ${source}`
            );
            db.configs.update(config.id, {
              config: {
                ...config.config,
                sourceId: createSourceString(source),
              },
            });
          } else {
            console.error(`could not find source by name: ${name}`);
            new Notification("ScreenChaser Notification", {
              body: `${
                device.name || device.ip
              }: Could not find source by name: ${name}`,
            });
          }
        }
      });
    });
  // could not handle error
  else throw e;
}
