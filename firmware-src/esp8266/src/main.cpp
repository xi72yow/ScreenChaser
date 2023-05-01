#include <Arduino.h>
#include <WiFiManager.h>
#include <WiFiUdp.h>
#include <FastLED.h>
#include <TaskScheduler.h>

#define LED_PIN 14 // the D5 on D1Mini
#define NUM_LEDS 490
#define NO_SLEEP
#define WAITING_TIMEOUT 120000
#define MAX_BUFFER_SIZE 1460
#define LED_BUILTIN 2
#define CHIPSET WS2812B

void handleNetwork();
void handleApi();
void handleUdp();

// Network SSID
char ssid[] = "";
char password[] = "";

String recived = "";

CRGB leds[NUM_LEDS];

WiFiUDP udp;

// HTTP server settings
ESP8266WebServer server(80);

Task HandleNetwork(10000, TASK_FOREVER, &handleNetwork);
Task HandleApi(100, TASK_FOREVER, &handleApi);
Task HandleUdp(5, TASK_FOREVER, &handleUdp); // this limits the udp handling to 200 times per second

unsigned int localUdpPort = 19446;
char incomingPacket[MAX_BUFFER_SIZE];
int packetSize;

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

void handleNetwork()
{
  if (WiFi.status() == WL_CONNECTED)
    return;

  Serial.println("Connecting to WiFi");
  // init WIFI
  WiFi.begin(ssid, password);

  unsigned long startWaiting = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startWaiting <= WAITING_TIMEOUT)
  {
    flashLED(900);

    if (WiFi.status() == WL_CONNECTED)
    {
      Serial.println("");
      Serial.print("Connected to ");
      Serial.println("ssid");
      Serial.print("IP address: ");
      Serial.println(WiFi.localIP());
    }
    else
      Serial.println("Connect failed. Try again...");
  }

  // init FastLED
  FastLED.addLeds<CHIPSET, LED_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setBrightness(100);
}

void sendChaserInformation()
{
  // send chaser information
  IPAddress broadcastIp = WiFi.localIP();
  broadcastIp[3] = 255;

  // send status json to client
  String json = "{\"device\":\"ScreenChaser-Stripe\"}";

  server.send(200, "application/text", recived);
}

void handleApi()
{
  server.handleClient();
}

void handleUdp(void)
{
  packetSize = udp.parsePacket();
  if (packetSize)
  {
    int len = udp.read(incomingPacket, MAX_BUFFER_SIZE);
    if (len > 0)
    {
      incomingPacket[len] = 0;
      byte stripePart = incomingPacket[0];

      // log stripe part
      Serial.print("stripePart: ");
      Serial.println(stripePart);
      Serial.println(len);

      for (int i = 0; i < len / 3; i++)
      {
        leds[stripePart + i] = CRGB(incomingPacket[i * 3 + 1], incomingPacket[i * 3 + 2], incomingPacket[i * 3 + 3]);
      }
      FastLED.show();
    }
  }
}

// Task Scheduler instance
Scheduler runner;

void setup()
{
  pinMode(LED_BUILTIN, OUTPUT);

  // flash LED to indicate booting
  flashLED(100);

  Serial.begin(115200);
  Serial.println("Booting Up:");
  flashLED(100);

  handleNetwork();
  Serial.println("Network ready");
  flashLED(100);

  udp.begin(localUdpPort);
  Serial.println("UDP ready");
  flashLED(100);

  // init HTTP server
  server.on("/", sendChaserInformation);
  server.begin();
  Serial.println("HTTP server started");
  flashLED(100);

  // init runner
  runner.init();
  runner.addTask(HandleUdp);
  runner.addTask(HandleApi);
  runner.addTask(HandleNetwork);
  HandleUdp.enable();
  HandleApi.enable();
  HandleNetwork.enable();

  Serial.println("Ready");
  flashLED(100);
  flashLED(100);
  flashLED(100);
}

void loop()
{
  runner.execute();
}