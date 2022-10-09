#include <ESP8266WiFi.h>
#include "parsebytes.h"
#include "wifiSetup.h"

#if !defined(WIFI_WATCHDOG)
#define WIFI_WATCHDOG 15000
#endif

// IP address, Netmask and Gateway, populated when connected
IPAddress ip;
IPAddress net;
IPAddress gw;

// Notification LED
void flashLED(int flashtime)
{
#if defined(LED_BUILTIN)          // If we have it; flash it.
    digitalWrite(LED_BUILTIN, 0); // On at full power.
    delay(flashtime);             // delay
    digitalWrite(LED_BUILTIN, 1); // turn Off
#else
    return; // No notifcation LED, do nothing, no delay
#endif
}

void wifiSetup(struct station *stationList, int stationCount)
{
    WiFi.persistent(false);
    WiFi.mode(WIFI_STA);
    WiFi.setSleep(false);
    Serial.print("Known external SSIDs: ");
    if (stationCount > 0)
    {
        for (int i = 0; i < stationCount; i++)
            Serial.printf(" '%s'\n", stationList[i].ssid);
    }
    else
    {
        Serial.print("None\n");
    }
    Serial.println();
    byte mac[6] = {0, 0, 0, 0, 0, 0};
    WiFi.macAddress(mac);
    Serial.printf("MAC address: %02X:%02X:%02X:%02X:%02X:%02X\r\n", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

    int bestStation = -1;
    long bestRSSI = -1024;
    char bestSSID[65] = "";
    uint8_t bestBSSID[6];

    if (stationCount > 0)
    {
        // We have a list to scan
        Serial.printf("Scanning local Wifi Networks\r\n");
        int stationsFound = WiFi.scanNetworks();
        Serial.printf("%i networks found\r\n", stationsFound);
        if (stationsFound > 0)
        {
            for (int i = 0; i < stationsFound; ++i)
            {
                // Print SSID and RSSI for each network found
                String thisSSID = WiFi.SSID(i);
                int thisRSSI = WiFi.RSSI(i);
                String thisBSSID = WiFi.BSSIDstr(i);
                Serial.printf("%3i : [%s] %s (%i)", i + 1, thisBSSID.c_str(), thisSSID.c_str(), thisRSSI);
                // Scan our list of known external stations
                for (int sta = 0; sta < stationCount; sta++)
                {
                    if ((strcmp(stationList[sta].ssid, thisSSID.c_str()) == 0) || (strcmp(stationList[sta].ssid, thisBSSID.c_str()) == 0))
                    {
                        Serial.print("  -  Known!");
                        // Chose the strongest RSSI seen
                        if (thisRSSI > bestRSSI)
                        {
                            bestStation = sta;
                            strncpy(bestSSID, thisSSID.c_str(), 64);
                            // Convert char bssid[] to a byte array
                            parseBytes(thisBSSID.c_str(), ':', bestBSSID, 6, 16);
                            bestRSSI = thisRSSI;
                        }
                    }
                }
                Serial.println();
            }
        }
    }

    if (bestStation == -1)
    {
        Serial.println("No known networks found");
    }
    else
    {
        Serial.printf("Connecting to Wifi Network %d: [%02X:%02X:%02X:%02X:%02X:%02X] %s \r\n",
                      bestStation, bestBSSID[0], bestBSSID[1], bestBSSID[2], bestBSSID[3],
                      bestBSSID[4], bestBSSID[5], bestSSID);
    }

    // Initiate network connection request (3rd argument, channel = 0 is 'auto')
    WiFi.begin(bestSSID, stationList[bestStation].password, 0, bestBSSID);

    // Wait to connect, or timeout
    unsigned long start = millis();
    while ((millis() - start <= WIFI_WATCHDOG) && (WiFi.status() != WL_CONNECTED))
    {
        delay(500);
        Serial.print('.');
    }

    // If we have connected, inform user
    if (WiFi.status() == WL_CONNECTED)
    {
        Serial.println("Client connection succeeded");
        // Note IP details
        ip = WiFi.localIP();
        net = WiFi.subnetMask();
        gw = WiFi.gatewayIP();
        Serial.printf("IP address: %d.%d.%d.%d\r\n", ip[0], ip[1], ip[2], ip[3]);
        Serial.printf("Netmask   : %d.%d.%d.%d\r\n", net[0], net[1], net[2], net[3]);
        Serial.printf("Gateway   : %d.%d.%d.%d\r\n", gw[0], gw[1], gw[2], gw[3]);
        // calcURLs();
        //  Flash the LED to show we are connected
        for (int i = 0; i < 5; i++)
        {
            flashLED(50);
            delay(150);
        }
    }
    else
    {
        Serial.println("Client connection Failed");
        WiFi.disconnect(); // (resets the WiFi scan)
    }
}
