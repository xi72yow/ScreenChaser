#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include <ArduinoJson.h>
#include <Adafruit_NeoPixel.h>

#include <Preferences.h>

Preferences preferences;

#define LED_PIN 14 // the D5 on D1Mini
#define LED_COUNT 120
#define BRIGHTNESS 50
#define CHIPSET WS2812B
#define COLOR_ORDER GRB
#define DEBUG
#define NO_SLEEP
#define ARDUINOJSON_ENABLE_ARDUINO_STRING 1
#define WAITING_TIMEOUT 120000

Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

WiFiUDP Udp;
unsigned int localUdpPort = 4210; // local port to listen on
char incomingPacket[1024];        // buffer for incoming packets
char replyPacket[] = "check!";    // a reply string to send back

DynamicJsonDocument doc(1024);

// Notification LED
void flashLED(int flashtime)
{
#if defined(LED_BUILTIN) // If we have it; flash it.
  delay(flashtime);
  digitalWrite(LED_BUILTIN, 0); // On at full power.
  delay(flashtime);             // delay
  digitalWrite(LED_BUILTIN, 1); // turn Off
#else
  return; // No notifcation LED, do nothing, no delay
#endif
}

void getSettings()
{
  unsigned long startWaiting = millis();
  while (Serial.available() <= 0 && millis() - startWaiting <= WAITING_TIMEOUT)
  {
    flashLED(100);
  }
  // read the incoming string:
  String json = Serial.readString();

  DeserializationError error = deserializeJson(doc, json);

  // Test if parsing succeeds.
  if (error)
  {
    Serial.print(F("deserializeJson() failed: "));
    Serial.println(error.f_str());
    return;
  }

  // prints the received data
  String ssid = doc["ssid"];
  String password = doc["password"];
  // neopixelCount      = doc["pixCount"].f_str();
  preferences.putString("ssid", ssid);
  preferences.putString("password", password);
  Serial.println(password);
  Serial.println(ssid);
  // ESP.restart();
}

void connectToNetwork()
{

  String ssid = preferences.getString("ssid", "");
  String password = preferences.getString("password", "");

  Serial.println(password);
  Serial.println(ssid);

  byte i = 0;
  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid.c_str(), password.c_str());
  unsigned long startWaiting = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startWaiting <= WAITING_TIMEOUT)
  {
    flashLED(900);
    i++;
    if (i > 9)
    {
      getSettings();
      return;
    }

    if (WiFi.status() == WL_CONNECTED)
    {
      Serial.println("");
      Serial.print("Connected to ");
      Serial.println(ssid);
      Serial.print("IP address: ");
      Serial.println(WiFi.localIP());
    }
    Serial.println("Connect failed. Try again...");
  }
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

  preferences.begin("settings", false);

  String ssid = preferences.getString("ssid", "");
  String password = preferences.getString("password", "");

  if (ssid == "" || password == "")
  {
    Serial.println("No values saved for ssid or password");
  }

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
    Serial.printf("char: %c\n", incomingPacket[1]);
    Serial.printf("len: %i\n", elements_in_Packet);

    // send back a reply, to the IP address and port we got the packet from
    Udp.beginPacket(Udp.remoteIP(), Udp.remotePort());
    Udp.write(replyPacket);
    Udp.endPacket();
  }
}