#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include <Adafruit_NeoPixel.h>
#include "parsebytes.h"

#define LED_PIN 14  //the D5 on D1Mini
#define LED_COUNT 120
#define BRIGHTNESS 50
#define CHIPSET WS2812B
#define COLOR_ORDER GRB
#define DEBUG
#define NO_SLEEP

// Primary config, or defaults.
#if __has_include("myconfig.h")
struct station {
  const char ssid[65];
  const char password[65];
  const bool dhcp;
};  // do no edit
#include "myconfig.h"
#else
#warning "Using Defaults: Copy myconfig.sample.h to myconfig.h and edit that to use your own settings"
#endif

#if !defined(WIFI_WATCHDOG)
#define WIFI_WATCHDOG 15000
#endif

// Number of known networks in stationList[]
int stationCount = sizeof(stationList) / sizeof(stationList[0]);

// IP address, Netmask and Gateway, populated when connected
IPAddress ip;
IPAddress net;
IPAddress gw;

// Notification LED
void flashLED(int flashtime) {
#if defined(LED_BUILTIN)         // If we have it; flash it.
  digitalWrite(LED_BUILTIN, 0);  // On at full power.
  delay(flashtime);              // delay
  digitalWrite(LED_BUILTIN, 1);  // turn Off
#else
  return;  // No notifcation LED, do nothing, no delay
#endif
}

Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

WiFiUDP Udp;
unsigned int localUdpPort = 4210;  // local port to listen on
char incomingPacket[1024];         // buffer for incoming packets
char replyPacket[] = "check!";     // a reply string to send back

void WifiSetup() {
  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  Serial.print("Known external SSIDs: ");
  if (stationCount > 0) {
    for (int i = 0; i < stationCount; i++) Serial.printf(" '%s'\n", stationList[i].ssid);
  } else {
    Serial.print("None\n");
  }
  Serial.println();
  byte mac[6] = { 0, 0, 0, 0, 0, 0 };
  WiFi.macAddress(mac);
  Serial.printf("MAC address: %02X:%02X:%02X:%02X:%02X:%02X\r\n", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

  int bestStation = -1;
  long bestRSSI = -1024;
  char bestSSID[65] = "";
  uint8_t bestBSSID[6];

  if (stationCount > 0) {
    // We have a list to scan
    Serial.printf("Scanning local Wifi Networks\r\n");
    int stationsFound = WiFi.scanNetworks();
    Serial.printf("%i networks found\r\n", stationsFound);
    if (stationsFound > 0) {
      for (int i = 0; i < stationsFound; ++i) {
        // Print SSID and RSSI for each network found
        String thisSSID = WiFi.SSID(i);
        int thisRSSI = WiFi.RSSI(i);
        String thisBSSID = WiFi.BSSIDstr(i);
        Serial.printf("%3i : [%s] %s (%i)", i + 1, thisBSSID.c_str(), thisSSID.c_str(), thisRSSI);
        // Scan our list of known external stations
        for (int sta = 0; sta < stationCount; sta++) {
          if ((strcmp(stationList[sta].ssid, thisSSID.c_str()) == 0) || (strcmp(stationList[sta].ssid, thisBSSID.c_str()) == 0)) {
            Serial.print("  -  Known!");
            // Chose the strongest RSSI seen
            if (thisRSSI > bestRSSI) {
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

  if (bestStation == -1) {
    Serial.println("No known networks found");
  } else {
    Serial.printf("Connecting to Wifi Network %d: [%02X:%02X:%02X:%02X:%02X:%02X] %s \r\n",
                  bestStation, bestBSSID[0], bestBSSID[1], bestBSSID[2], bestBSSID[3],
                  bestBSSID[4], bestBSSID[5], bestSSID);
  }

  // Initiate network connection request (3rd argument, channel = 0 is 'auto')
  WiFi.begin(bestSSID, stationList[bestStation].password, 0, bestBSSID);

  // Wait to connect, or timeout
  unsigned long start = millis();
  while ((millis() - start <= WIFI_WATCHDOG) && (WiFi.status() != WL_CONNECTED)) {
    delay(500);
    Serial.print('.');
  }

  // If we have connected, inform user
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Client connection succeeded");
    // Note IP details
    ip = WiFi.localIP();
    net = WiFi.subnetMask();
    gw = WiFi.gatewayIP();
    Serial.printf("IP address: %d.%d.%d.%d\r\n", ip[0], ip[1], ip[2], ip[3]);
    Serial.printf("Netmask   : %d.%d.%d.%d\r\n", net[0], net[1], net[2], net[3]);
    Serial.printf("Gateway   : %d.%d.%d.%d\r\n", gw[0], gw[1], gw[2], gw[3]);
    //calcURLs();
    // Flash the LED to show we are connected
    for (int i = 0; i < 5; i++) {
      flashLED(50);
      delay(150);
    }
  } else {
    Serial.println("Client connection Failed");
    WiFi.disconnect();  // (resets the WiFi scan)
  }
}


int getNum(char ch) {
  int num = 0;
  if (ch >= '0' && ch <= '9') {
    num = ch - 0x30;
  } else {
    switch (ch) {
      case 'A':
      case 'a':
        num = 10;
        break;
      case 'B':
      case 'b':
        num = 11;
        break;
      case 'C':
      case 'c':
        num = 12;
        break;
      case 'D':
      case 'd':
        num = 13;
        break;
      case 'E':
      case 'e':
        num = 14;
        break;
      case 'F':
      case 'f':
        num = 15;
        break;
      default:
        num = 0;
    }
  }
  return num;
}

unsigned int hex2int(unsigned char hex[]) {
  unsigned int x = 0;
  x = (getNum(hex[0])) * 16 + (getNum(hex[1]));
  return x;
}

void setupStripe(void) {
  strip.begin();
  strip.show();
  strip.setBrightness(BRIGHTNESS);
}

void setup() {
  Serial.begin(115200);
  Serial.println();
  pinMode(LED_BUILTIN, OUTPUT);

  WifiSetup();
  setupStripe();

  Udp.begin(localUdpPort);
  Serial.printf("Now listening at IP %s, UDP port %d\n", WiFi.localIP().toString().c_str(), localUdpPort);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    delay(10);
    WifiSetup();
  }

  int packetSize = Udp.parsePacket();
  if (packetSize) {
    // receive incoming UDP packets
    Serial.printf("Received %d bytes from %s, port %d\n", packetSize, Udp.remoteIP().toString().c_str(), Udp.remotePort());
    int len = Udp.read(incomingPacket, 512);
    if (len > 0) {
      incomingPacket[len] = 0;
    }
    Serial.printf("UDP packet contents: %s\n", incomingPacket);
    byte stripePart = incomingPacket[0] - '0';
    int startLed = stripePart * 42;

    for (int k = 0; k < packetSize / 6; k++) {
      unsigned char r[] = { incomingPacket[k * 6 + 1], incomingPacket[k * 6 + 2] };
      unsigned char g[] = { incomingPacket[k * 6 + 3], incomingPacket[k * 6 + 4] };
      unsigned char b[] = { incomingPacket[k * 6 + 5], incomingPacket[k * 6 + 6] };
      strip.setPixelColor(startLed + k, hex2int(r), hex2int(g), hex2int(b));
    }

    strip.show();

    int elements_in_Packet = sizeof(incomingPacket) / sizeof(incomingPacket[0]);
    Serial.printf("char: %c\n", incomingPacket[1]);
    Serial.printf("len: %i\n", elements_in_Packet);

    // send back a reply, to the IP address and port we got the packet from
    Udp.beginPacket(Udp.remoteIP(), Udp.remotePort());
    Udp.write(replyPacket);
    Udp.endPacket();
  }
}