import React, {
  useEffect, useState, useMemo, useCallback
} from "react";
import { ethers } from "ethers";
import './App.css';
import abi from './utils/WavePortal.json';

export default function App() {
  const [currentAccount, setCurrentAccount] = useState('');
  const [mining, setMining] = useState(false);
  const [waveCount, setWaveCount] = useState(0);
  const [allWaves, setAllWaves] = useState([]);
  const contractAddress = '0x1cAf6Cad87Df93a9b2dA5b62d0b4504cc5551113';
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    const {ethereum} = window;

    if (ethereum){
      console.log('Make are ready!!');
    } else {
      console.error('Make sure to have Metamask');
      return;
    }

    // check if we're authorized to access the user's wallet
    const accounts = await ethereum.request({method: 'eth_accounts'});

    if (accounts.length) {
      const account = accounts[0];
      console.log('Found an authorized account');
      setCurrentAccount(account);
    } else {
      console.error('Not authorized account found');
    }
  }

  const connectWallet = async () => {
    try {
      const {ethereum} = window;

      if (!ethereum){
        console.error('Get Metamask!');
        return;
      }

      const accounts = await ethereum.request({method: 'eth_requestAccounts'})
      console.log('Connected! ', accounts[0]);
      setCurrentAccount(accounts[0]);
    }
    catch {
      console.log('error');
    }
  }

  const wavePortalContract = useMemo(() => {
    if(!window.ethereum) return;

    const {ethereum} = window;

    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    return contract;
  },[contractABI])

  const wave = async (e) => {
    e.preventDefault()
    try {
      const { ethereum } = window;

      if (ethereum) {
        setMining(true);

        const formData = new FormData(e.target);
        
        // wave logic
        const waveTxn = await wavePortalContract.wave(formData.get('message'), {gasLimit: 300000});
        console.log('Mining...', waveTxn.hash);

        await waveTxn.wait();
        console.log('Mined -- ', waveTxn.hash);
        setMining(false);

        const count = await wavePortalContract.getTotalWaves();
        setWaveCount(count);

        e.target.reset();
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.error(error)
      setMining(false);
    }
  }

  const getAllWaves = useCallback(async () => {
    const { ethereum } = window;

      if (currentAccount && ethereum) {
        const waves = await wavePortalContract.getWaves();

        const mappedWaves = waves.map(w => ({
          address: w.waver,
          timestamp: new Date(w.timestamp * 1000),
          message: w.message
        }));

        setAllWaves(mappedWaves);
      }
  }, [wavePortalContract, currentAccount, setAllWaves])

  const getTotalWaves = useCallback(async () => {
    const { ethereum } = window;
    if (currentAccount && ethereum) {
      const count = await wavePortalContract.getTotalWaves();
      setWaveCount(count);
    }
  }, [wavePortalContract, currentAccount, setWaveCount])

  useEffect(() => {
    checkIfWalletIsConnected()
  }, [setCurrentAccount]);

  useEffect(() => {
    getAllWaves();
    getTotalWaves();
  }, [currentAccount, setWaveCount, getTotalWaves, getAllWaves, setAllWaves, wavePortalContract])

  useEffect(() => {
    wavePortalContract.once('NewWave', (from, timestamp, message) => {
      console.log('New wave', from, timestamp, message);
      setAllWaves(prev => [...prev, {
        address: from,
        timestamp: new Date(timestamp * 1000),
        message,
      }])
    })
  }, [setAllWaves, wavePortalContract])
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        👋  Hey there! 👋
        </div>

        <div className="bio">
        I am dobleuber and I worked on web development? Connect your Ethereum wallet and wave at me!
        </div>

        <div>Total waves: {waveCount.toLocaleString()}</div>

        <form onSubmit={wave} className="form">
          <div>
            <textarea type="text" className="textArea" rows="3" required        maxLength={256}
            name="message"
            />
          </div>
          <div>
            {!mining
              ? <button className="waveButton" type="submit">
                Wave at Me 👋
                </button>
              : <button className="waveButton">
                  🏃‍♂️ Mining 🏃‍♂️
                </button>
            }
          </div>
        </form>

        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        <div className="feed">
        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}
        </div>
      </div>
    </div>
  );
}
