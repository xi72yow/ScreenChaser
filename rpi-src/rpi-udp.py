from email import message
import socket
import board
import neopixel

pixels = neopixel.NeoPixel(
    board.D18, 720, auto_write=False, pixel_order=neopixel.RGB)

localPort = 4210

bufferSize = 1024

msgFromServer = "check!"

bytesToSend = str.encode(msgFromServer)

# Create a datagram socket

UDPServerSocket = socket.socket(family=socket.AF_INET, type=socket.SOCK_DGRAM)

# Bind to address and ip

UDPServerSocket.bind(("", localPort))

print("UDP server up and listening")

# Listen for incoming datagrams

while(True):

    data, address = UDPServerSocket.recvfrom(bufferSize)

    message = data.decode('utf-8')
    startLed = int(message[0].lower(), 16)*42
    i = 0
    data = message[1:].replace("\n", "").lower()
    while i < len(data)/6:
        print(data)
        r = int(data[i*6]+data[i*6+1], 16)
        g = int(data[i*6+2]+data[i*6+3], 16)
        b = int(data[i*6+4]+data[i*6+5], 16)
        print(r, g, b)
        pixels[startLed+i] = (r, g, b)
        i = i + 1

    pixels.show()
    clientMsg = "Message from Client:{}".format(data)
    clientIP = "Client IP Address:{}".format(address)
    print(clientMsg)
    print(clientIP)

    # Sending a reply to client

    UDPServerSocket.sendto(bytesToSend, address)
