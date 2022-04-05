import React, {useEffect, useState } from "react";
import './App.css';
// ethers 変数の定義
import {ethers} from "ethers";
// ABIファイルを含むWavePortal.jsonファイルの定義
import abi from "./utils/WavePortal.json";
const App = () =>{
  // ユーザーのパブリックウォレットを保存するために使用する状態変数を定義
  const [currentAccount, setCurrentAccount] = useState("");
  // ユーザーのメッセージを保持する状態変数
  const [messageValue, setMessageValue] = useState("")
  // すべてのwavesを保存する状態変数
  const [allWaves, setAllWaves] = useState([]);
  console.log("currentAccount: ", currentAccount);
  // デプロイされたコントラクトアドレス用変数
  const contractAddress = "0x6522700CA45D3c268501C2F8B6fF4ED2298151C9";
  // ABIの内容を参照する変数
  const contractABI = abi.abi;
  const getAllWaves = async () => {
    const { ethereum } = window;
    try{
      if (ethereum){
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer =provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        // コントラクトからgetAllWavesを呼び出す
        const waves = await wavePortalContract.getAllWaves();
        // UIに必要なアドレス、タイムスタンプ、メッセージを設定
        const wavesCleaned = waves.map(wave => {
          return{
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          };
        });

        // React Stateにデータを格納
        setAllWaves(wavesCleaned);
      }else{
        console.log("Ethereum object doesn't exist!");
      }
    }catch(error){
      console.log(error);
    }
  };

  // emit されたイベントに反応する
  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    // NewWaveイベントがコントラクトから発信されたときに、情報を受け取る
    if(window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }
    //メモリリークを防ぐためにNewWaveのイベントを解除
    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  // window.ethereumにアクセスできるか確認
  const checkIfWalletIsConnected = async() => {
    try{
      const {ethereum} = window;    
      if (!ethereum){
        console.log("Make sure you have MetaMask!");
        return;
      }else{
        console.log("We have the ethereum object",ethereum);
      }
      // ユーザーのウォレットへのアクセスが許可されているか確認
      const accounts = await ethereum.request({method: "eth_accounts"});
      if (accounts.length !==0){
        const account = accounts[0];
        console.log("Found an authorized account: ",account);
        setCurrentAccount(account);
        getAllWaves();
      }else{
        console.log("NO authorized account found");
      }
    }catch(error){
      console.log(error);
    }
  }
  // connectWalletメッソドを実装
  const connectWallet = async () =>{
    try{
      const { ethereum } = window;
      if(!ethereum){
        alert("Get MetaMask!");
        return;
      }
      const accounts = await ethereum.request({method: "eth_requestAccounts"});
      console.log("Connected: ",accounts[0]);
      setCurrentAccount(accounts[0]);
    }catch(error){
      console.log(error);
    }
  }
  // waveの回数をカウントする関数
  const wave = async () => {
    try{
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        // ABIを参照
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        // ETH送金確認
        let contractBalance = await provider.getBalance(
          wavePortalContract.address
        );
        console.log(
          "Contract balance: ",
          ethers.utils.formatEther(contractBalance)
        );
        // コントラクトにwaveを書き込む
        const waveTxn = await wavePortalContract.wave(messageValue,{gasLimit:300000});
        console.log("Mining...",waveTxn.hash);
        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);
        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...",count.toNumber());
        //
        let contractBalance_post = await provider.getBalance(wavePortalContract.address);
        // コントラクトの残高が減っていることを確認
        if (contractBalance_post < contractBalance){
          // 減っていた場合
          console.log("Use won ETH!");
        }else{
          console.log("User didn'n win ETH.");
        }
        console.log(
          "Contract balance after wave: ",
          ethers.utils.formatEther(contractBalance_post)
        );
      }else{
        console.log("Ethereum object doesn't exist!");
      }
    }catch(error){
      console.log(error)
    }
  }
  //Webページがロードされたときに下記関数を実行
  useEffect(() =>{
    checkIfWalletIsConnected();
  },[])
  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
        <span role="img" aria-label="hand-wave">👋</span> WELCOME!
        </div>
        <div className="bio">
        イーサリアムウォレットを接続して、「<span role="img" aria-label="hand-wave">👋</span>(wave)」を送ってください<span role="img" aria-label="shine">✨</span>
        </div>
        <br />
        {/*walletコネクトボタン実装*/}
        {!currentAccount &&(
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
        {currentAccount &&(
          <button className="waveButton" onClick={connectWallet}>
            Wallet Connected
          </button>
        )}
        {/* waveボタンにwave関数を連動*/}
        {currentAccount &&(
          <button className="waveButton" onClick={wave}>
            Wave at Me
          </button>
        )}
        {/* メッセージボックスを実装*/}
        {currentAccount && (
          <textarea name="messageArea" placeholder="メッセージはこちら" 
          type="text" id="message"
          value={messageValue}
          onChange={e => setMessageValue(e.target.value)} />)
        }
        {/* 履歴を表示する*/}
        {currentAccount && (
          allWaves.slice(0).reverse().map((wave,index) => {
            return(
              <div key={index} style={{backgroundColor: "#F8F8FF", marginTop: "16px", padding:"8px"}}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
              </div>)
          })
        )}
      </div>
    </div>
  );
}

export default App
