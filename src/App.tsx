import { useEffect, useState } from "react";
import { ethers } from "ethers";
import  contractAbi from "./abi.json";
import "./App.css";
const contractAddress = "0x3CD653977F4bdcC54573b92A5eE2B5b7097A6F6B";


function App() {
  const [input, setInput] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState({
    connection: false,
    setting: false,
  });
  const [account, setAccount] = useState<{
    address?: string;
    balance: number;
    connected: boolean;
  }>({
    address: "",
    balance: 0,
    connected: false,
  });

  const fetchText = async () => {
    try {
      setIsLoading({
        connection: false,
        setting: true,
      });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, contractAbi, provider);
      const data = await contract.text();
      setText(String(data));
    } catch (error) {
      console.error("Error fetching text:", error);
      setError("Failed to fetch message from contract");
    } finally {
      setIsLoading({
        connection: false,
        setting: false,
      });
    }
  }
  const checkExistingConnection = async () => {
    try {
      setIsLoading({
        connection: true,
        setting: false,
      });
      if (window.ethereum) {
        // Check if user is already connected
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          // User is already connected
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          setAccount({
            address: address,
            balance: Number(await provider.getBalance(address)),
            connected: true,
          });
        }
      }
    } catch (error) {
      console.error("Error checking existing connection:", error);
      // Don't set error here as this is just a check, not a user action
    } finally {
      setIsLoading({
        connection: false,
        setting: false,
      });
    }
  }
      
  useEffect(() => {
    fetchText();
    checkExistingConnection();
  }, []);


  const handleConnect = async () => {
    try {
      if (window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' })
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAccount({
          address: address,
          balance: Number(await provider.getBalance(address)),
          connected: true,
        });
        setError("");
      } else {
        setError('Please install MetaMask!')
      }
    } catch (error) {
      console.error(error)
      setError("Failed to connect to wallet");
    }
  }

  const handleDisconnect = async () => {
    setAccount({
      address: "",
      balance: 0,
      connected: false,
    });
    setError("");
  } 

  const handleSet = async () => {
    setIsLoading({
      connection: false,
      setting: true,
    });
    try {
      if (!input) {
        setError("Please enter a message before setting.");
        return;
      }

      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractAbi, signer);

        const tx = await contract.setMessage(input); 
        const txReceipt = await tx.wait();
        const data = await contract.text();
        setText(String(data));
        console.log("Transaction successful:", txReceipt);
      } else {
        setError("MetaMask not found. Please install MetaMask.");
        await handleConnect();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setInput("");
      setIsLoading({
        connection: false,
        setting: false,
      });
    }
  };

  return (
      <div className="container">
              {error && <p className="error">{error}</p>}
              {account.connected && (
          <p className="connected">Connected: {account.address?.slice(0, 6)}...{account.address?.slice(-4)}</p>
        )}
        <div className="heading-container">
        <h1 className="heading">Set Message</h1>
        
        
         <button onClick={account.connected ? handleDisconnect : handleConnect} className="button" disabled={isLoading.connection}>{account.connected ? "Disconnect" : "Connect Wallet"}</button>
        
        </div>
        
      
      <input
        type="text"
        placeholder="Set message"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="input"
        />
      {isLoading.setting ? <p className="text">Loading Message...</p> : <p className="text"><span style={{color: "green"}}>Message:</span> {text}</p>}
      <div className="button-container">
      <button onClick={handleSet} className="button" disabled={isLoading.setting}>{isLoading.setting ? "Loading..." : "Set Message"}</button>
      <button onClick={fetchText} className="button" disabled={isLoading.connection}>{isLoading.connection ? "Loading..." : "Fetch Text"}</button>
      </div>
    </div>
  );
}

export default App;