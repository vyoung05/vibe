// Quick test script to verify what URL the deployed code is using
// Run this in browser console on https://www.daydeamersnightstreamers.com/

console.log("Testing redirect URL logic:");
console.log("window.location.origin:", window.location.origin);
console.log("Expected redirect:", `${window.location.origin}/reset-password`);
console.log("typeof window:", typeof window);

// This should output the production URL, not localhost:3000
