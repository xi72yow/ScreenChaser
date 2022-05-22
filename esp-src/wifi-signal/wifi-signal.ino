//Oled
#include <SPI.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 64 // OLED display height, in pixels

// Declaration for an SSD1306 display connected to I2C (SDA, SCL pins)
#define OLED_RESET     0 // Reset pin # (or -1 if sharing Arduino reset pin)
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
//Adafruit_SSD1306 display(OLED_RESET);

//Wifi
#include "Arduino.h"
#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include "parsebytes.h"

#if !defined(WIFI_WATCHDOG)
#define WIFI_WATCHDOG 15000
#endif

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

// Number of known networks in stationList[]
int stationCount = sizeof(stationList) / sizeof(stationList[0]);

// IP address, Netmask and Gateway, populated when connected
IPAddress ip;
IPAddress net;
IPAddress gw;

// Notification LED
void flashLED(int flashtime) {
#if defined(LED_BUILTIN)                // If we have it; flash it.
  digitalWrite(LED_BUILTIN, 0);  // On at full power.
  delay(flashtime);               // delay
  digitalWrite(LED_BUILTIN, 1); // turn Off
#else
  return;                         // No notifcation LED, do nothing, no delay
#endif
}

void drawSignal(int rssi){
  if (rssi >= -55) { 
    display.fillRect(102,7,4,1, INVERSE);
    display.fillRect(107,6,4,2, INVERSE);
    display.fillRect(112,4,4,4, INVERSE);
    display.fillRect(117,2,4,6, INVERSE);
    display.fillRect(122,0,4,8, INVERSE);
    display.display();
  } else if (rssi < -55 & rssi > -65) {
    display.fillRect(102,7,4,1, INVERSE);
    display.fillRect(107,6,4,2, INVERSE);
    display.fillRect(112,4,4,4, INVERSE);
    display.fillRect(117,2,4,6, INVERSE);
    display.drawRect(122,0,4,8, WHITE);
    display.display();
  } else if (rssi < -65 & rssi > -75) {
    display.fillRect(102,8,4,1, INVERSE);
    display.fillRect(107,6,4,2, INVERSE);
    display.fillRect(112,4,4,4, INVERSE);
    display.drawRect(117,2,2,6, WHITE);
    display.drawRect(122,0,4,8, WHITE);
    display.display();
  } else if (rssi < -75 & rssi > -85) {
    display.fillRect(102,8,4,1, INVERSE);
    display.fillRect(107,6,4,2, INVERSE);
    display.drawRect(112,4,4,4, WHITE);
    display.drawRect(117,2,4,6, WHITE);
    display.drawRect(122,0,4,8, WHITE);
    display.display();
  } else if (rssi < -85 & rssi > -96) {
    display.fillRect(102,8,4,1, INVERSE);
    display.drawRect(107,6,4,2, WHITE);
    display.drawRect(112,4,4,4, WHITE);
    display.drawRect(117,2,4,6, WHITE);
    display.drawRect(122,0,4,8, WHITE);
    display.display();
  } else {
    display.drawRect(102,8,4,1, WHITE);
    display.drawRect(107,6,4,2, WHITE);
    display.drawRect(112,4,4,4, WHITE);
    display.drawRect(117,2,4,6, WHITE);
    display.drawRect(122,0,4,8, WHITE);
    display.display();
  }

}

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
  byte mac[6] = {0, 0, 0, 0, 0, 0};
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
          if ((strcmp(stationList[sta].ssid, thisSSID.c_str()) == 0) ||
              (strcmp(stationList[sta].ssid, thisBSSID.c_str()) == 0)) {
            Serial.print("  -  Known!");

            display.drawRect(i, i, display.width()-2*i, display.height()-2*i, WHITE);
            display.clearDisplay();

            display.setTextSize(2);
            display.setTextColor(WHITE);
            display.setCursor(0, 0);
            display.println("Scanner");

            display.setTextSize(0.8);
            display.setCursor(0, 20);
            display.printf("[%s]", thisBSSID.c_str());
            display.setTextSize(1);
            display.setCursor(0, 40);
            display.printf("%s (%i)", thisSSID.c_str(), thisRSSI);
            drawSignal(thisRSSI);
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
    Serial.printf("Known Wifi Network found %d: [%02X:%02X:%02X:%02X:%02X:%02X] %s \r\n",
                  bestStation, bestBSSID[0], bestBSSID[1], bestBSSID[2], bestBSSID[3],
                  bestBSSID[4], bestBSSID[5], bestSSID);
  }

  display.display();

  /*for (int i = 0; i < 5; i++) {
    flashLED(50);
    delay(150);
    }*/
  flashLED(50);
  WiFi.disconnect();   // (resets the WiFi scan)
}


void setup() {
  Serial.begin(115200);
  delay(1000);
  pinMode(LED_BUILTIN, OUTPUT);
  // SSD1306_SWITCHCAPVCC = generate display voltage from 3.3V internally
  // Wichtige Änderung: 0x3C statt 0x3D !!!!!!!!!
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) { // Address 0x3D for 128x64
    Serial.println(F("SSD1306 allocation failed"));
    for (;;);
  }
  
  // Show the display buffer on the screen. You MUST call display() after
  // drawing commands to make them visible on screen!
  display.display();
  delay(2000); // Pause for 2 seconds

  // Clear the buffer
  display.clearDisplay();

  for (int i = 0; i < 5; i++) {
    flashLED(50);
    delay(150);
  }
}

void loop() {
  WifiSetup();
}
