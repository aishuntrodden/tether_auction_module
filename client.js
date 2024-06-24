"use strict";
require("dotenv").config();

const RPC = require("@hyperswarm/rpc");
const DHT = require("hyperdht");
const Hypercore = require("hypercore");
const Hyperbee = require("hyperbee");
const crypto = require("crypto");
const main = async () => {
  // Initialize Hypercore and Hyperbee for persistent storage
  const hcore = new Hypercore("./db/rpc-client");
  const hbee = new Hyperbee(hcore, {
    keyEncoding: "utf-8",
    valueEncoding: "binary",
  });
  await hbee.ready();

  // Resolve distributed hash table (DHT) seed for key pair
  let dhtSeed = (await hbee.get("dht-seed"))?.value;
  console.log("dhtSeed", process.env.dhtSeed);

  if (!dhtSeed) {
    // If seed not found, generate and store in database
    dhtSeed = crypto.randomBytes(32);
    await hbee.put("dht-seed", dhtSeed);
  }

  // Start DHT for peer discovery and RPC service discovery
  const dht = new DHT({
    port: 50001,
    keyPair: DHT.keyPair(Buffer.from(process.env.dhtSeed, "hex")),
    bootstrap: [{ host: "127.0.0.1", port: 30001 }], // Bootstrap node for DHT
  });
  await dht.ready();

  // Public key of RPC server (should match the server's public key)
  const serverPubKey = Buffer.from(process.env.publicKey, "hex");

  // Initialize RPC client
  const rpc = new RPC({ dht });

  try {
    // Payload for RPC request
    const payload = { nonce: 126 };
    const payloadRaw = Buffer.from(JSON.stringify(payload), "utf-8");

    // Send request and handle response
    const respRaw = await rpc.request(serverPubKey, "ping", payloadRaw);
    const resp = JSON.parse(respRaw.toString("utf-8"));
    console.log("Response from server:", resp);

    /////Auction methods defined below
    const openAuction = async (id, item, bid,clientName) => {
      const payload = { id, item, bid,clientName };
      const payloadRaw = Buffer.from(JSON.stringify(payload), "utf-8");
      const respRaw = await rpc.request(
        serverPubKey,
        "openAuction",
        payloadRaw
      );
      console.log(JSON.parse(respRaw.toString("utf-8")));
      return JSON.parse(respRaw.toString("utf-8"));
    };

    const placeBid = async (id, item,bid, clientName) => {
      const payload = { id, item,bid, clientName };
      const payloadRaw = Buffer.from(JSON.stringify(payload), "utf-8");
      const respRaw = await rpc.request(serverPubKey, "placeBid", payloadRaw);
      return JSON.parse(respRaw.toString("utf-8"));
    };

    const getWinnerAndCloseBidding = async (item) => {
      const payload = { item };
      const payloadRaw = Buffer.from(JSON.stringify(payload), "utf-8");
      const respRaw = await rpc.request(serverPubKey, "getWinnerAndCloseBidding", payloadRaw);
    
      return JSON.parse(respRaw.toString("utf-8"));
    };

    return { openAuction, placeBid,getWinnerAndCloseBidding };
  } catch (error) {
    console.error("Error in RPC request:", error);
  } finally {
   //closing all connections
    // await hbee.close();
    // await hcore.close();
    // await rpc.destroy();
    // await dht.destroy();   
  }
};

// main().catch(console.error);
module.exports = main;
