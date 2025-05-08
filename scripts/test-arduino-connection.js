/**
 * Simple test script to verify the connection to the Arduino ESP32 controller
 *
 * Usage:
 * 1. Make sure your ESP32 is running and connected to WiFi
 * 2. Run this script with: node scripts/test-arduino-connection.js <esp32-ip-address>
 */

const fetch = require("node-fetch");

// Get IP address from command line args
const args = process.argv.slice(2);
const ipAddress = args[0] || "192.168.137.220"; // Default IP if not provided

async function testConnection() {
  console.log("\n-------------------------------------");
  console.log("SwiftPass Arduino Connection Tester");
  console.log("-------------------------------------\n");
  console.log(`Testing connection to ESP32 at: ${ipAddress}\n`);

  try {
    // Test 1: Check status endpoint
    console.log("Test 1: Checking device status...");
    const statusResponse = await fetch(`http://${ipAddress}/status`);

    if (!statusResponse.ok) {
      throw new Error(`Status endpoint returned ${statusResponse.status}`);
    }

    const statusData = await statusResponse.json();
    console.log("✅ Status check successful!");
    console.log("   Response:", JSON.stringify(statusData));

    // Test 2: Test LED control (on)
    console.log("\nTest 2: Turning LED ON...");
    const ledOnResponse = await fetch(`http://${ipAddress}/led/on`);

    if (!ledOnResponse.ok) {
      throw new Error(
        `LED ON request failed with status ${ledOnResponse.status}`
      );
    }

    const ledOnData = await ledOnResponse.json();
    console.log("✅ LED ON successful!");
    console.log("   Response:", JSON.stringify(ledOnData));

    // Wait 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test 3: Test LED control (off)
    console.log("\nTest 3: Turning LED OFF...");
    const ledOffResponse = await fetch(`http://${ipAddress}/led/off`);

    if (!ledOffResponse.ok) {
      throw new Error(
        `LED OFF request failed with status ${ledOffResponse.status}`
      );
    }

    const ledOffData = await ledOffResponse.json();
    console.log("✅ LED OFF successful!");
    console.log("   Response:", JSON.stringify(ledOffData));

    // Test 4: Test QR scan endpoint with valid code
    console.log("\nTest 4: Testing QR scan endpoint with valid code...");
    const validScanResponse = await fetch(`http://${ipAddress}/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ qrcode: "ACCESS123" }),
    });

    if (!validScanResponse.ok) {
      throw new Error(
        `Valid QR scan failed with status ${validScanResponse.status}`
      );
    }

    const validScanData = await validScanResponse.json();
    console.log("✅ Valid QR scan successful!");
    console.log("   Response:", JSON.stringify(validScanData));

    // Wait 4 seconds to see LED effect and let it turn off
    await new Promise((resolve) => setTimeout(resolve, 4000));

    // Test 5: Test QR scan endpoint with invalid code
    console.log("\nTest 5: Testing QR scan endpoint with invalid code...");
    const invalidScanResponse = await fetch(`http://${ipAddress}/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ qrcode: "INVALID" }),
    });

    // This should return a 403 status code for invalid code
    if (invalidScanResponse.status !== 403) {
      throw new Error(
        `Invalid QR scan should return 403, got ${invalidScanResponse.status}`
      );
    }

    const invalidScanData = await invalidScanResponse.json();
    console.log("✅ Invalid QR scan test successful! (Expected 403 status)");
    console.log("   Response:", JSON.stringify(invalidScanData));

    console.log("\n-------------------------------------");
    console.log("✅ All tests passed! Arduino connection verified.");
    console.log("-------------------------------------\n");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error("Check that the ESP32 is powered on and connected to WiFi.");
    console.error("Verify that the IP address is correct:", ipAddress);
    process.exit(1);
  }
}

testConnection();
