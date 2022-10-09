
struct station
{
    const char ssid[65];
    const char password[65];
    const bool dhcp;
};

extern void wifiSetup(struct station *stationList, int stationCount);