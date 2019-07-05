const express = require('express');
const WebSocket = require('ws');
const uuid = require('uuid/v4');

// Set the port to 3001
const PORT = 3001;

// Create a new express server
const server = express()
   // Make the express server serve static assets (html, javascript, css) from the /public folder
  .use(express.static('public'))
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${ PORT }`));

// Create the WebSockets server
const wss = new WebSocket.Server({ server });

  // Function to generate a random color for each client, used in state.
  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
  return color;
  }

// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.
wss.on('connection', function connection(ws) {
  console.log('Client connected');
  
  ws.color = getRandomColor();
  ws.username = "Anonymous";

// Create notification for user that has joined the chat
  const newClientNotification = {
    id: uuid(),
    type: "incomingNotification",
    content: "Anonymous user has joined the chat"
  };

  // Sends a notification for new client 
  wss.clients.forEach(function each(client) {
    client.send(JSON.stringify(newClientNotification));
  })

  // Broadcast number of clients connected to Chatty App
  let clientCount = wss.clients.size;
  wss.clients.forEach(function each(client) {
    client.send(clientCount);
  })

  // Broadcast messages to all clients
  ws.on('message', function incoming(data) {

    let receivedMsg = JSON.parse(data);
    const newMessageObject = {};

    switch(receivedMsg.type) {
      case "postMessage":
      // handle post message
        newMessageObject.type = "incomingMessage";
        newMessageObject.id = uuid();
        newMessageObject.username = receivedMsg.username;
        newMessageObject.content = receivedMsg.content;
        newMessageObject.color = ws.color;
        break;
      case "postNotification":
      // handle post notification
        newMessageObject.type = "incomingNotification";
        newMessageObject.id = uuid();
        newMessageObject.username = receivedMsg.username;
        newMessageObject.content = receivedMsg.content;
        ws.username = receivedMsg.username;
        break;
      default:
      // show an error in the console if the message type is unknown
      throw new Error("Unknown event type " + receivedMsg.type);
    };

    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(newMessageObject));
      }
    });

  });

  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on('close', () => {
    console.log('Client disconnected')

    // Create notification for user that has left the chat
    const clientLeftNotification = {
      id: uuid(),
      type: "incomingNotification",
      content: `${ws.username} has left the chat`
    };

    // Sends a notification for client who has left chat 
    wss.clients.forEach(function each(client) {
      client.send(JSON.stringify(clientLeftNotification));
    })

    // Update number of clients connected to Chatty App
    let clientCount = wss.clients.size;
    wss.clients.forEach(function each(client) {
      client.send(clientCount);
    })

  });

});


