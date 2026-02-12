export default function createDummyApexId(): string {
   // Function to generate a random alphanumeric character
   function randomChar(): string {
     const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
     const randomIndex = Math.floor(Math.random() * characters.length);
     return characters[randomIndex];
   }
 
   // Generate the first 6 characters
   const prefix = '000000';
 
   // Generate the remaining 12 characters
   const randomPart = Array.from({ length: 12 }, randomChar).join('');
 
   // Concatenate the prefix and random part
   const randomString = prefix + randomPart;
 
   return randomString;
 }
 