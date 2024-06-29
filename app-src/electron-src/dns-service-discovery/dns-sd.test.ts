import mDnsSd from "./dns-sd";

mDnsSd
  .discover({
    name: "_services._dns-sd._udp.local",
    type: "PTR",
    key: "fqdn",
  })
  .then((device_list) => {
    console.log(JSON.stringify(device_list, null, "  "));
  })
  .catch((error) => {
    console.error(error);
  });
