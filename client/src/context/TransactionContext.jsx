import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

import { contractABI, contractAddress } from "../utils/constants";

export const TransactionContext = React.createContext();

const { ethereum } = window;

const getEthereumContract = () => {
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  const transactionContract = new ethers.Contract(
    contractAddress,
    contractABI,
    signer
  );

  // console.log({
  //   provider,
  //   signer,
  //   transactionContract,
  // });
  return transactionContract;
};

export const TransactionProvider = ({ children }) => {
  const [formData, setFormData] = useState({
    addressTo: "",
    amount: "",
    keyword: "",
    message: "",
  });
  const [currentAccount, setCurrentAccount] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setisLoading] = useState(false); //loading instances
  const [transactionCount, settransactionCount] = useState(
    localStorage.getItem("transactionCount")
  );

  //function to update form data
  const handleChange = (e, name) => {
    setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
  };
  //end....

  //function to get all transactions on the  blockchain
  const getAllTransactions = async () => {
    try {
      if (!ethereum) return alert("please install metamask");
      const transactionContract = getEthereumContract();
      const availableTransactions =
        await transactionContract.getAllTransactions();

      //better output for console transactions
      const structuredTransactions = availableTransactions.map(
        (transaction) => ({
          addressTo: transaction.reciever,
          addressFrom: transaction.sender,
          timestamp: new Date(
            transaction.timestamp.toNumber() * 1000
          ).toLocaleString(),
          message: transaction.message,
          keyword: transaction.keyword,
          amount: parseInt(transaction.amount._hex) / 10 ** 18,
        })
      );
      //end
      console.log(structuredTransactions);

      setTransactions(structuredTransactions);
    } catch (error) {
      console.log(error);
    }
  };
  //end...

  //checking if wallet is connected
  const checkIfwalletIsConnected = async () => {
    try {
      if (!ethereum) return alert("please install metamask");

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length) {
        setCurrentAccount(accounts[0]);
        getAllTransactions();
      } else {
        console.log("No accounts found!");
      }
    } catch (error) {
      console.log(error);

      throw new Error("No ethereum object");
    }
  };
  //end...

  //checking if transaction exist
  const checkIfTransactionsExist = async () => {
    try {
      const transactionContract = getEthereumContract();
      const transactionCount = await transactionContract.getTransactionCount();
      window.localStorage.setItem("transactionCount", transactionCount);
    } catch (error) {
      console.log(error);
      throw new Error("No ethereum object");
    }
  };
  //end...

  //button for connect-wallet
  const connectWallet = async () => {
    try {
      if (!ethereum) return alert("Please install MetaMask.");

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      setCurrentAccount(accounts[0]);
      // window.location.reload();
    } catch (error) {
      console.log(error);
      throw new Error("No ethereum object");
    }
  };
  //end.....

  //function for sending transactions
  const sendTransaction = async () => {
    try {
      if (!ethereum) return alert("Please install MetaMask.");

      const { addressTo, amount, keyword, message } = formData;
      const transactionContract = getEthereumContract();
      const parsedAmount = ethers.utils.parseEther(amount); //convertion

      await ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: currentAccount,
            to: addressTo,
            gas: "0x5208", //21000 GWEI
            value: parsedAmount._hex, //0.0001
          },
        ],
      });

      //store transaction
      const transactionHash = await transactionContract.addToBlockchain(
        addressTo,
        parsedAmount,
        message,
        keyword
      );

      //loading
      setisLoading(true);
      console.log(`loading - ${transactionHash.hash}`);
      await transactionHash.wait();
      setisLoading(false);
      console.log(`success - ${transactionHash.hash}`);

      const transactionCount = await transactionContract.getTransactionCount();
      settransactionCount(transactionCount.toNumber());
      window.location.reload();
    } catch (error) {
      console.log(error);
      throw new Error("No ethereum object");
    }
  };
  //end........

  useEffect(() => {
    checkIfwalletIsConnected();
    checkIfTransactionsExist();
  }, [transactionCount]);

  return (
    <TransactionContext.Provider
      value={{
        //passing them as props to access in diff file
        connectWallet,
        currentAccount,
        formData,
        setFormData,
        handleChange,
        sendTransaction,
        transactions,
        isLoading,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
