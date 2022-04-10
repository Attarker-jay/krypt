require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: "0.8.0",
  networks: {
    ropsten: {
      url: "https://eth-ropsten.alchemyapi.io/v2/AWbj5YYvl4Itvls4x9NZQf2UGd_SVm4_",
      accounts: [
        "209f780e034544d2f834757449b73536a37eda80af9a3cacbfd97bae1e850815",
      ],
    },
  },
};
