#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include <Adafruit_NeoPixel.h>

#define LED_PIN 14 //the D5 on D1Mini
#define LED_COUNT 120
#define BRIGHTNESS 50
#define CHIPSET WS2812B
#define COLOR_ORDER GRB
#define DEBUG
#define NO_SLEEP

const char *ssid = "SSID";
const char *password = "**psw**";
Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

WiFiUDP Udp;
unsigned int localUdpPort = 4210;                     // local port to listen on
char incomingPacket[1024];                             // buffer for incoming packets
char replyPacket[] = "check!"; // a reply string to send back

void connectToNetwork()
{
    byte i = 0;
    WiFi.persistent(false);
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED)
    {
#ifdef NO_SLEEP
        pinMode(LED_BUILTIN, OUTPUT);
        digitalWrite(LED_BUILTIN, 0);
#endif
        delay(500);
        digitalWrite(LED_BUILTIN, 1);
        delay(500);
        i++;
        if (i > 9)
        {
            ESP.restart();
        }
    }
    Serial.println("");
    Serial.print("Connected to ");
    Serial.println(ssid);
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
}

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

void setupStripe(void) {
        strip.begin();
        strip.show();
        strip.setBrightness(BRIGHTNESS);
}

void setup()
{
    Serial.begin(115200);
    Serial.println();
    pinMode(LED_BUILTIN, OUTPUT);

    Serial.printf("Connecting to %s ", ssid);
    connectToNetwork();
    setupStripe();

    Udp.begin(localUdpPort);
    Serial.printf("Now listening at IP %s, UDP port %d\n", WiFi.localIP().toString().c_str(), localUdpPort);
}

void loop()
{
    if (WiFi.status() != WL_CONNECTED)
    {
        delay(10);
        connectToNetwork();
    }

    int packetSize = Udp.parsePacket();
    if (packetSize)
    {
        // receive incoming UDP packets
        Serial.printf("Received %d bytes from %s, port %d\n", packetSize, Udp.remoteIP().toString().c_str(), Udp.remotePort());
        int len = Udp.read(incomingPacket, 512);
        if (len > 0)
        {
            incomingPacket[len] = 0;
        }
        Serial.printf("UDP packet contents: %s\n", incomingPacket);
        byte stripePart = incomingPacket[0] - '0';
        int startLed = stripePart*42;

        for (int k = 0; k < packetSize / 6; k++)
        {
            unsigned char r[] = {incomingPacket[k * 6 + 1], incomingPacket[k * 6 + 2]};
            unsigned char g[] = {incomingPacket[k * 6 + 3], incomingPacket[k * 6 + 4]};
            unsigned char b[] = {incomingPacket[k * 6 + 5], incomingPacket[k * 6 + 6]};
            strip.setPixelColor(startLed+k, hex2int(r), hex2int(g), hex2int(b));
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
