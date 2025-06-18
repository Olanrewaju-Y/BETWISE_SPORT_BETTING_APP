require('dotenv').config();


// Configuration for minimum bet amount (consider moving to a config file or .env)
const MIN_BET_AMOUNT = parseFloat(process.env.MIN_BET_AMOUNT) || 100; // Example: Default to 100 if not set

const MIN_TOPUP_AMOUNT = parseFloat(process.env.MIN_TOPUP_AMOUNT) || 1000; //



const BETWISE_PROJECT_CONTEXT = `
## About Betwise
Betwise is a premier online sports betting platform designed for enthusiasts and newcomers alike. We offer a wide range of sports, competitive odds, and a user-friendly interface. Our commitment is to provide a secure, fair, and engaging betting experience.

## Key Features
- **Live Betting:** Place bets on ongoing matches in real-time.
- **Wide Sport Selection:** Bet on Football, Basketball, Tennis, Cricket, eSports, Horse Racing, and more.
- **Account Management:** Easy deposits, fast withdrawals, and comprehensive betting history.
- **Promotions & Bonuses:** Regular promotions for new and existing users, including welcome bonuses, free bets, and odds boosts.
- **Security:** State-of-the-art encryption and security protocols to protect user data and funds.
- **Customer Support:** 24/7 customer support via live chat and email.
- **Responsible Gambling:** Tools and resources to promote responsible betting, including deposit limits, self-exclusion, and activity trackers.

## Frequently Asked Questions (FAQs)

**Q: How do I create an account on Betwise?**
A: To create an account, click the "Sign Up" or "Register" button on our homepage. You'll need to provide some personal details, create a username and password, and agree to our terms and conditions. You must be of legal gambling age in your jurisdiction.

**Q: What deposit methods are available?**
A: Betwise supports various deposit methods, including credit/debit cards (Visa, Mastercard), bank transfers, e-wallets (like Skrill, Neteller, PayPal - availability may vary by region), and sometimes cryptocurrencies. Check the "Deposit" section in your account for options available to you.

**Q: How long do withdrawals take?**
A: Withdrawal times vary depending on the method chosen. E-wallet withdrawals are typically the fastest (often within 24 hours), while card withdrawals and bank transfers may take 3-5 business days.

**Q: Is Betwise licensed and regulated?**
A: Yes, Betwise operates under a license from [Specify Licensing Authority, e.g., Malta Gaming Authority, UK Gambling Commission]. We adhere to strict regulatory standards.

**Q: How can I contact customer support?**
A: You can reach our customer support team 24/7 via live chat on our website/app or by emailing support@betwise.example.com.
`;




const CHAMPIONS_LEAGUE_TEAM_LOGOS = {
    "Real Madrid": "https://img.uefa.com/imgml/TP/teams/logos/240x240/50051.png", // From UEFA
    "FC Barcelona": "https://img.uefa.com/imgml/TP/teams/logos/240x240/50080.png", // From UEFA
    "Bayern Munich": "https://fcbayern.com/binaries/content/gallery/fc-bayern/logos/logo-fc-bayern.png", // From fcbayern.com
    "Manchester City": "https://www.mancity.com/meta/media/k00gpd2s/logo.png", // From mancity.com
    "Liverpool FC": "https://www.liverpoolfc.com/liverpoolfc_crest.png", // From liverpoolfc.com
    "Paris Saint-Germain": "https://en.psg.fr/img/logos/psg-logo.png", // From psg.fr
    "Juventus": "https://img.uefa.com/imgml/TP/teams/logos/240x240/50139.png", // From UEFA (new logo)
    "Inter Milan": "https://img.uefa.com/imgml/TP/teams/logos/240x240/50138.png", // From UEFA (new logo)
    "AC Milan": "https://img.uefa.com/imgml/TP/teams/logos/240x240/50037.png", // From UEFA
    "Borussia Dortmund": "https://img.uefa.com/imgml/TP/teams/logos/240x240/52758.png", // From UEFA
    "Chelsea FC": "https://img.uefa.com/imgml/TP/teams/logos/240x240/52914.png", // From UEFA
    "Arsenal FC": "https://img.uefa.com/imgml/TP/teams/logos/240x240/52280.png", // From UEFA
    "Ajax Amsterdam": "https://via.placeholder.com/150/D2122E/FFFFFF?Text=Ajax", // Placeholder
    "FC Porto": "https://via.placeholder.com/150/00428C/FFFFFF?Text=Porto", // Placeholder
    "SL Benfica": "https://via.placeholder.com/150/E00000/FFFFFF?Text=Benfica", // Placeholder
    "SSC Napoli": "https://via.placeholder.com/150/12A0D7/FFFFFF?Text=Napoli", // Placeholder
    "Atletico Madrid": "https://img.uefa.com/imgml/TP/teams/logos/240x240/50124.png", // From UEFA
    "RB Leipzig": "https://via.placeholder.com/150/E60026/FFFFFF?Text=Leipzig" // Placeholder
    // You would continue to update these manually or integrate an API
};









module.exports = {
    MIN_BET_AMOUNT,
    MIN_TOPUP_AMOUNT,
    BETWISE_PROJECT_CONTEXT,
};



