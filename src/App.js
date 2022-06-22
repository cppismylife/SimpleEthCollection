import "./styles/App.css";
import React from "react";
import Web3 from "web3";
import contractAbi from "./utils/MyEpicNFT.json";
import raribleIcon from "./utils/rarible.svg";
import twitterIcon from "./utils/twitter.svg";

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
const contractABI = contractAbi.abi;
const MAX_MINT_COUNT = 50;
const raribleURL = `https://rinkeby.rarible.com/collection/${contractAddress}/items`;

class MintButton extends React.Component {
  constructor(props) {
    super(props);
    this.requestMint = this.requestMint.bind(this);
    this.web3 = props.web3;
    this.wallet = props.wallet;
    this.state = {
      miningTx: "",
      minedTxTokenId: "",
      mintLimit: false,
      mintCount: null,
    };
    this.contract = new this.web3.eth.Contract(contractABI, contractAddress, {
      from: this.wallet,
    });
  }

  async getMintedCount() {
    let count = await this.contract.methods.mintCount(this.wallet).call();
    return Number(count);
  }

  async requestMint() {
    if ((await this.getMintedCount()) >= MAX_MINT_COUNT) {
      this.setState({ mintLimit: true });
      return;
    }
    this.contract.methods
      .makeAnEpicNFT()
      .send()
      .once("transactionHash", (txHash) => {
        this.setState({
          miningTx: txHash,
          minedTxTokenId: "",
        });
      })
      .then(async (receipt) => {
        this.setState({
          minedTxTokenId: receipt.events.Transfer.returnValues[2],
          mintCount: await this.getMintedCount(),
          miningTx: "",
        });
      })
      .catch((error) => {
        console.error(error);
      });
  }

  render() {
    if (this.state.mintLimit)
      return <h2>You have already minted max amount!</h2>;
    else if (this.state.miningTx)
      return <h3>Tx {this.state.miningTx} is mining...</h3>;
    else if (this.state.minedTxTokenId)
      return (
        <>
          <h3>
            Check your NFT:&nbsp;
            <a
              className="opensea-link"
              href={`https://rinkeby.rarible.com/token/${contractAddress.toLowerCase()}:${
                this.state.minedTxTokenId
              }`}
            >
              Rarible link
            </a>
          </h3>
          <h3>
            You have minted {this.state.mintCount}/{MAX_MINT_COUNT}
          </h3>
          <button
            className="cta-button active-button"
            onClick={this.requestMint}
          >
            Mint NFT
          </button>
        </>
      );
    else
      return (
        <button className="cta-button active-button" onClick={this.requestMint}>
          Mint NFT
        </button>
      );
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.renderConnectButton = this.renderConnectButton.bind(this);
    this.connectWallet = this.connectWallet.bind(this);
    this.state = {
      currentWallet: "",
    };
    this.web3 = new Web3();
  }

  renderConnectButton() {
    const wallet = this.state.currentWallet;
    if (!wallet)
      return (
        <button
          className="cta-button active-button"
          onClick={this.connectWallet}
        >
          Connect wallet
        </button>
      );
    else
      return (
        <div>
          <p>
            Connected wallet: <i>{wallet}</i>
          </p>
          <MintButton web3={this.web3} wallet={this.state.currentWallet} />
        </div>
      );
  }

  getProvider() {
    const { ethereum } = window;
    if (!ethereum) alert("Please install Metamask");
    else console.log("Metamask ready!");
    return ethereum;
  }

  connectWallet() {
    this.web3.eth
      .requestAccounts()
      .then((accounts) => {
        this.setState({ currentWallet: accounts[0] });
        console.log("Connected:", accounts[0]);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  componentDidMount() {
    const ethereum = this.getProvider();
    if (ethereum.chainId !== "0x1")
      ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x4" }],
      });
    this.web3.setProvider(ethereum);
    this.web3.eth.getAccounts().then((accounts) => {
      if (accounts.length > 0) {
        this.setState({ currentWallet: accounts[0] });
        console.log("Found authorized accounts:", accounts);
      }
    });
  }

  render() {
    return (
      <div className="App">
        <div className="container">
          <div className="header-container">
            <p className="header gradient-text">
              Mint NFT and know who are you in crypto
            </p>
            <div>
              <a href={raribleURL} style={{ margin: "0 10px 0 0" }}>
                <img src={raribleIcon} alt="Rarible icon"></img>
              </a>
              <a href={""} style={{ margin: "0 0 0 10px" }}>
                <img src={twitterIcon} alt="Twitter icon"></img>
              </a>
            </div>
            <p className="sub-text">
              Your nft will contain 3 random words, which describe your role,
              for example: <b>DegenJpegMinter!</b>
            </p>
            {this.renderConnectButton()}
          </div>
          <div className="footer-container"></div>
        </div>
      </div>
    );
  }
}

export default App;
