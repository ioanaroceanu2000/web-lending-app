import React, {Component} from 'react';
import './App.css';
import PriceUpdate from './price_update';
import Balance from './Balance.js'
import Web3 from 'web3';
import {Container, Row, Col, Navbar, Button, Form} from 'react-bootstrap';
import logo from './logoTr.png';
import warwicklogo from './warwicklogo.png';
import ActionButtons from './ActionButtons.js';
import {getTokenAPIPrices, getTokenAPIData, deployToken, getTokenAPIPrice, getAccount, createToken, addLoadedTokens} from './utils.js';
import {LiquidityPool_ABI, LiquidityPool_ADD, Exchange_ADD, Exchange_ABI, ERC20_ABI, Token_ABI, Token_BYTECODE } from './abis/abi'


class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      toBeAdded: 'WETH',
      web3: null,
      userAddress: null,
      userDeposit: 0,
      depositedToken: '',
      userCollateral: 0,
      collateralToken: '',
      userOwed: 0,
      owedToken:'',
      liquidityPool: null,
      exchange: null,
      addedTokenIDs: [], //reaIDs
      realToFakeID: [], // {realID: fakeID}
      allTokenIDs: [], // realIDs
      allTokenData: {}, // {realID: {symbol: -, utilisationRate: -, collateral: -, baseRate: -, slope1:-, slope2:-, sread: -}
    };
  }

  componentWillMount(){
    this.loadBlockchainData();
  }

  async loadBlockchainData(){
    // load web3
    const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
    const network = await web3.eth.net.getNetworkType();
    console.log("network:",network);

    // load contracts
    const lpinstance = new web3.eth.Contract(LiquidityPool_ABI, LiquidityPool_ADD);
    const exinstance = new web3.eth.Contract(Exchange_ABI, Exchange_ADD);
    this.setState({liquidityPool: lpinstance, exchange: exinstance});

    //get all token's data from api
    const [ids, data]= await getTokenAPIData();
    this.setState({allTokenData: data, allTokenIDs: ids, web3: web3});
    await addLoadedTokens('cevaa', 'altcevaa');
  }

  async addToken(){
    if(this.state.addedTokenIDs.includes(this.state.toBeAdded)){
      alert("This token already has a pool.")
    }else{
      // get selected token's details to pass to the create function
      let tokenDetails = {};
      const tokenData = this.state.allTokenData[this.state.toBeAdded];
      tokenDetails.symbol = tokenData.symbol;
      tokenDetails.utilisation = Math.round(tokenData.utilisationRate);
      tokenDetails.collateral = Math.round(tokenData.collateral);
      tokenDetails.baseRate = tokenData.baseRate;
      tokenDetails.slope1 = tokenData.slope1;
      tokenDetails.slope2 = tokenData.slope2;
      tokenDetails.spread = tokenData.spread;
      console.log(tokenData.spread);
      let price = await getTokenAPIPrice(this.state.toBeAdded);
      tokenDetails.price = Math.round(price*1000);
      console.log(tokenDetails);
      // get current connected account
      const user = await getAccount(this.state.web3);
      // deploy and add token to contracts
      const fakeTokenID = await createToken(user, this.state.web3, tokenDetails, this.state.exchange, this.state.liquidityPool);
      // register new added token
      const newEntry = {...this.state.realToFakeID};
      newEntry[this.state.toBeAdded] = fakeTokenID;
      this.setState({addedTokenIDs: [...this.state.addedTokenIDs, this.state.toBeAdded], realToFakeID: newEntry});
    }
  }

  handleChangeAddToken = (e) => {
    this.setState({ toBeAdded: e.target.value });
  }

  //// RENDER COMPONENTS
  displayAddTokenOption(){
    var tokenOptions = [];
    var i =0;
    const len = this.state.allTokenIDs.length;
    for(i=0; i < len; i++){
      const realId = this.state.allTokenIDs[i];
      const symbol = this.state.allTokenData[realId].symbol;
      tokenOptions.push(<option value={realId}>{symbol}</option>);
    }
    return(
    <Row className="add-token-row">
      <Col><h4 style={{marginTop:"7px"}}>Add pool to protocol</h4></Col>

      <Col>
        <Form>
        <Form.Group>
          <Form.Control size="md" as="select" style={{marginTop:"5px"}} onChange={ this.handleChangeAddToken } >
          {tokenOptions}
          </Form.Control>
        </Form.Group>
        </Form>
      </Col>

      <Col>
      <button className="button-addToken"
          type="button"
          style={{marginTop:"5px"}}
          onClick={this.addToken.bind(this)}
      >Add Pool</button>
      </Col>
    </Row>
  );
  }

  render() {

    return (
      <div className="container-fluid">
      <Navbar>
        <a className="navbar-brand" href="#">
          <img src={logo} width="80" height="40" className="d-inline-block align-top" alt="" />
        </a>
        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse justify-content-end" id="navbarCollapse">
          <ul className="navbar-nav">
            <li className="nav-item active">
              <a className="nav-link" href="#">Home <span className="sr-only">(current)</span></a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">Features</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">Pricing</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">Disabled</a>
            </li>
          </ul>
        </div>
      </Navbar>

      <Container className="container">
        <Row className="rows">
          <Col className="columns columns-left" lg={4}>
          <h3 style={{marginTop: "18px"}}>Your Balance</h3>
          <hr/>
          <div>  <Balance/> </div>
          </Col>

          <Col sm={1}><br/></Col>

          <Col className="columns columns-right" lg={7}>
            <Container>
              <ActionButtons/>
            </Container>
          </Col>
        </Row>

        <PriceUpdate loadedTokens={this.state.addedTokenIDs}/>

        {this.displayAddTokenOption()}

      </Container>

      <div className="footer">
      <Navbar expand="lg" sticky="bottom" className="footer">
        <Navbar.Brand href="#home">
          <img src={warwicklogo} width="35%" height="35%"

            alt="Warwick University"
          />
        </Navbar.Brand>
        <Navbar.Collapse className="justify-content-end">
          <Navbar.Text style={{color: "white"}}>
          @ "Smart Contracts Lending" by Ioana Roceanu at University of Warwick
          </Navbar.Text>
        </Navbar.Collapse>
      </Navbar>
      </div>

      </div>
    );
  }
}
// <!-- <div className="tokens"> {this.renderPrices()} </div> -->
export default App;
