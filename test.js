require('dotenv').config();
const main = require('./client');
// The below test case will open auction for item 1 which is 'Pic#1' and close bidding with annoucing the winner in the end.
const startAuction = async () => {
  try {
    const client1 = await main();
   await client1.openAuction('auction1', 'Pic#1', 75,'aish');
   await client1.placeBid('auction2','Pic#1', 80,'batman')
   const winner = await client1.getWinnerAndCloseBidding('Pic#1')
   console.log('Auction opened successfully:',winner);
  } catch (error) {
    console.error('Error in startAuction:', error);
    // Handle error appropriately, e.g., retry logic, logging, etc.
  }
};

startAuction().catch(console.error);