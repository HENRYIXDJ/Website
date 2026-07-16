const http = require('http');
const https = require('https');

const targetUrl = 'http://localhost:3000/api/assets?url=https%3A%2F%2Ftegbbmt42xpyzcnx.private.blob.vercel-storage.com%2FMixes%2FKnight%2520Club%2FMix%2520Audio%2FKnight%2520Club%2520Session%25201%2520-%2520Mastered%2520High%2520Quality.mp3';

console.log("Fetching local proxy:", targetUrl);
http.get(targetUrl, (res) => {
  console.log("Proxy response status:", res.statusCode);
  console.log("Proxy response headers:", res.headers);
  
  const redirectUrl = res.headers.location;
  if (redirectUrl) {
    console.log("Following redirect to R2 URL:", redirectUrl);
    https.get(redirectUrl, (r2Res) => {
      console.log("R2 response status:", r2Res.statusCode);
      console.log("R2 response headers:", r2Res.headers);
      let data = '';
      r2Res.on('data', chunk => {
        if (data.length < 500) data += chunk.toString();
      });
      r2Res.on('end', () => {
        console.log("R2 response body preview:", data.substring(0, 500));
      });
    }).on('error', err => {
      console.error("Error fetching redirect URL:", err.message);
    });
  }
}).on('error', err => {
  console.error("Error fetching proxy:", err.message);
});
