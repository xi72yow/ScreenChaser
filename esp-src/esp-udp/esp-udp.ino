#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include <Adafruit_NeoPixel.h>
#include "parsebytes.h"
#include "wifiSetup.h"

#define LED_PIN 14 // the D5 on D1Mini
#define LED_COUNT 120
#define BRIGHTNESS 50
#define CHIPSET WS2812B
#define COLOR_ORDER GRB
#define NO_SLEEP

#define DEBUG

// Primary config, or defaults.
#if __has_include("myconfig.h")
#include "myconfig.h"
#else
#warning "Using Defaults: Copy myconfig.sample.h to myconfig.h and edit that to use your own settings"
#endif

// Number of known networks in stationList[]
int stationCount = sizeof(stationList) / sizeof(stationList[0]);

Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

WiFiUDP Udp;
unsigned int localUdpPort = 4210; // local port to listen on
char incomingPacket[1024];        // buffer for incoming packets
char replyPacket[] = "check!";    // a reply string to send back

int getNum(char ch)
{
  int num = 0;
  if (ch >= '0' && ch <= '9')
  {
    num = ch - 0x30;
  }
  else
  {
    switch (ch)
    {
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

unsigned int hex2int(unsigned char hex[])
{
  unsigned int x = 0;
  x = (getNum(hex[0])) * 16 + (getNum(hex[1]));
  return x;
}

void setupStripe(void)
{
  strip.begin();
  strip.show();
  strip.setBrightness(BRIGHTNESS);
}

void setup()
{
  Serial.begin(115200);
  Serial.println();
  pinMode(LED_BUILTIN, OUTPUT);

  wifiSetup(stationList, stationCount);
  setupStripe();

  Udp.begin(localUdpPort);
#ifdef DEBUG
  Serial.printf("Now listening at IP %s, UDP port %d\n", WiFi.localIP().toString().c_str(), localUdpPort);
#endif
}

void loop()
{
  if (WiFi.status() != WL_CONNECTED)
  {
    wifiSetup(stationList, stationCount);
  }

  int packetSize = Udp.parsePacket();
  if (packetSize)
  {
// receive incoming UDP packets
#ifdef DEBUG
    Serial.printf("Received %d bytes from %s, port %d\n", packetSize, Udp.remoteIP().toString().c_str(), Udp.remotePort());
#endif
    int len = Udp.read(incomingPacket, 512);
    if (len > 0)
    {
      incomingPacket[len] = 0;
    }
#ifdef DEBUG
    Serial.printf("UDP packet contents: %s\n", incomingPacket);
#endif
    byte stripePart = incomingPacket[0] - '0';
    int startLed = stripePart * 42;

    for (int k = 0; k < packetSize / 6; k++)
    {
      unsigned char r[] = {incomingPacket[k * 6 + 1], incomingPacket[k * 6 + 2]};
      unsigned char g[] = {incomingPacket[k * 6 + 3], incomingPacket[k * 6 + 4]};
      unsigned char b[] = {incomingPacket[k * 6 + 5], incomingPacket[k * 6 + 6]};
      strip.setPixelColor(startLed + k, hex2int(r), hex2int(g), hex2int(b));
    }

    strip.show();

    int elements_in_Packet = sizeof(incomingPacket) / sizeof(incomingPacket[0]);
#ifdef DEBUG
    Serial.printf("char: %c\n", incomingPacket[1]);
    Serial.printf("len: %i\n", elements_in_Packet);
#endif

    // send back a reply, to the IP address and port we got the packet from
    Udp.beginPacket(Udp.remoteIP(), Udp.remotePort());
    Udp.write(replyPacket);
    Udp.endPacket();
  }
}