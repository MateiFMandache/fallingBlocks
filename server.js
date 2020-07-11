const http = require("http");
const fs = require("fs");
const PORT = 1234;
"use strict";

http.createServer((req, res) => {
  if (req.method == "GET") {
    // If root url is requested, send people to home page
    const file = (req.url === "/") ? "fallingBlocks.html" : req.url.slice(1);
    fs.readFile(file, (error, data) => {
      if (error) {
        res.writeHead(404, {"Content-Type": "text/plain"});
        res.write("Resource not found")
        res.end()
      } else {
        const extension = file.split(".")[1];
        switch (extension) {
          case "html":
            res.writeHead(200, {"Content-Type": "text/html"});
            break;
          case "css":
            res.writeHead(200, {"Content-Type": "text/css"});
            break;
          case "js":
            res.writeHead(200, {"Content-Type": "application/javascript"});
            break;
          case "json":
            res.writeHead(200, {"Content-Type": "application/json"});
            break;
          case "ico":
            res.writeHead(200, {"Content-Type": "image/x-icon"});
            break;
          case "png":
            res.writeHead(200, {"Content-Type": "image/png"});
            break;
          case "svg":
            res.writeHead(200, {"Content-Type": "image/svg+xml"});
            break;
          case "txt":
          default:
            res.writeHead(200, {"Content-Type": "text/plain"});
        }
        res.write(data);
        res.end();
      }
    });
  }
}).listen(PORT);
